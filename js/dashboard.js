/* =========================================
   EDUSIM - DASHBOARD
========================================= */

// =========================================
// 1. CONTROL DE SESIÓN
// =========================================

if (sessionStorage.getItem("edusim_access") !== "true") {
    window.location.replace("index.html");
}

// =========================================
// 2. DOCUMENTOS DISPONIBLES
// =========================================

const baseBanks = typeof BANCOS_CSV !== "undefined" ? BANCOS_CSV : [];

const documents = baseBanks.map((banco) => ({
    id: banco.id,
    category: banco.categoria || "Normativa",
    title: banco.title,
    description: banco.description,
    file: banco.file,
    icon: banco.icon || "bi-journal-text",
    color: banco.color || "#1D5C99",
    background: banco.background || "#EAF3FB",
    questions: null,
    link: `simuladores/simulador.html?banco=${encodeURIComponent(banco.id)}`
}));

// =========================================
// 3. CONTAR PREGUNTAS DE CADA CSV
// =========================================

async function countQuestionsInCSV(relativeFilePath) {
    try {
        const url = new URL(relativeFilePath, window.location.href).href;
        const response = await fetch(url);
        if (!response.ok) return null;

        const csvText = await response.text();
        if (typeof Papa === "undefined") return null;

        const parsed = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (h) => h.replace(/^\uFEFF/, "").trim()
        });

        const validRows = (parsed.data || []).filter((row) => {
            const q = String(row.Pregunta ?? "").trim();
            const ans = String(row.Respuesta ?? "").trim().toUpperCase();
            return q.length > 0 && ["A", "B", "C", "D"].includes(ans);
        });

        return validRows.length;
    } catch (error) {
        console.warn(`No se pudo leer ${relativeFilePath}:`, error);
        return null;
    }
}

async function loadAllQuestionCounts() {
    if (!documents.length) return;

    const counts = await Promise.all(
        documents.map((doc) => countQuestionsInCSV(doc.file))
    );

    counts.forEach((count, idx) => {
        documents[idx].questions = count;
    });

    renderDocuments();
}

// =========================================
// 4. GENERAR TARJETAS
// =========================================

const simulatorContainer = document.getElementById("simulatorContainer");

function renderDocuments() {
    simulatorContainer.innerHTML = "";

    if (documents.length === 0) {
        simulatorContainer.innerHTML = `
            <div class="col-12">
                <div class="empty-library">
                    <i class="bi bi-folder2-open fs-1"></i>
                    <h5 class="mt-3">No hay documentos disponibles</h5>
                    <p>Próximamente se incorporarán nuevos simuladores.</p>
                </div>
            </div>
        `;
        updateStatistics();
        return;
    }

    documents.forEach((doc, index) => {
        const questionText = Number.isInteger(doc.questions)
            ? `${doc.questions} preguntas`
            : "Cargando conteo...";

        const col = document.createElement("div");
        col.className = "col-12 col-md-6 col-lg-4";

        col.innerHTML = `
            <article class="simulator-card"
                style="
                    --card-color: ${doc.color};
                    --card-background: ${doc.background};
                    animation-delay: ${index * 0.06}s;
                ">

                <div class="simulator-card-top"></div>

                <div class="simulator-card-body">

                    <div class="simulator-card-icon">
                        <i class="bi ${doc.icon}"></i>
                    </div>

                    <span class="section-label doc-category-label"></span>

                    <h3 class="doc-title"></h3>

                    <p class="simulator-description doc-description"></p>

                    <div class="simulator-meta">
                        <span>
                            <i class="bi bi-patch-question"></i>
                            ${questionText}
                        </span>
                        <span>
                            <i class="bi bi-filetype-csv"></i>
                            CSV
                        </span>
                    </div>

                    <a href="${doc.link}" class="btn-simulator">
                        Acceder al simulador
                        <i class="bi bi-arrow-right"></i>
                    </a>

                </div>

            </article>
        `;

        col.querySelector(".doc-category-label").textContent = doc.category;
        col.querySelector(".doc-title").textContent = doc.title;
        col.querySelector(".doc-description").textContent = doc.description;

        simulatorContainer.appendChild(col);
    });

    updateStatistics();
}

// =========================================
// 5. ACTUALIZAR ESTADÍSTICAS
// =========================================

function updateStatistics() {
    const totalDocuments = documents.length;

    const totalQuestions = documents.reduce((total, doc) => {
        return total + (Number.isInteger(doc.questions) ? doc.questions : 0);
    }, 0);

    document.getElementById("totalDocuments").textContent = totalDocuments;
    document.getElementById("totalQuestions").textContent = totalQuestions;
    document.getElementById("libraryCounter").textContent =
        `${totalDocuments} ${totalDocuments === 1 ? "documento" : "documentos"}`;
}

// =========================================
// 6. CERRAR SESIÓN
// =========================================

document.getElementById("logoutButton").addEventListener("click", () => {
    sessionStorage.removeItem("edusim_access");
    window.location.replace("index.html");
});

// =========================================
// 7. INICIAR DASHBOARD
// =========================================

renderDocuments();
loadAllQuestionCounts();