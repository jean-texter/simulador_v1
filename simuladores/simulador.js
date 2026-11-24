// ======================================================
// VERIFICACIÓN DE SESIÓN
// ======================================================

if (sessionStorage.getItem("edusim_access") !== "true") {
    window.location.replace("../index.html");
}

// ======================================================
// CONFIGURACIÓN DEL SIMULADOR
// ======================================================

// Cantidad de preguntas por simulacro.
// Coloca 0 para utilizar todas las preguntas del CSV.
const PREGUNTAS_POR_SIMULACRO = 0;

// Bancos de preguntas de respaldo (si no existe BANCOS_CSV en ../js/bancos.js)
const BANCOS_RESPALDO = {
    cpe: {
        titulo: "Constitución Política del Estado",
        descripcion: "Simulador sobre la Constitución Política del Estado Plurinacional de Bolivia.",
        archivo: "../data/cpe-questions.csv"
    },
    ley_070: {
        titulo: "Ley N° 070 — Avelino Siñani - Elizardo Pérez",
        descripcion: "Simulador sobre la Ley de Educación y el Modelo Educativo Sociocomunitario Productivo.",
        archivo: "../data/ley_070.csv"
    },
    ley_045: {
        titulo: "Ley N° 045 — Contra el Racismo y Discriminación",
        descripcion: "Prevención, sanción y políticas contra toda forma de racismo y discriminación.",
        archivo: "../data/ley_045.csv"
    },
    ley_348: {
        titulo: "Ley N° 348 — Vida Libre de Violencia",
        descripcion: "Garantía para las mujeres de una vida libre de violencia, protección y prevención.",
        archivo: "../data/ley_348.csv"
    },
    ley_548: {
        titulo: "Ley N° 548 — Código Niña, Niño y Adolescente",
        descripcion: "Derechos, garantías y protección integral de niñas, niños y adolescentes.",
        archivo: "../data/ley_548.csv"
    },
    ley_223: {
        titulo: "Ley N° 223 — Personas con Discapacidad",
        descripcion: "Inclusión, igualdad de oportunidades, accesibilidad y derechos de personas con discapacidad.",
        archivo: "../data/ley_223.csv"
    },
    ley_1178: {
        titulo: "Ley N° 1178 — Administración y Control",
        descripcion: "Sistemas de administración y control gubernamentales (Ley SAFCO).",
        archivo: "../data/ley_1178.csv"
    },
    ley_004: {
        titulo: "Ley N° 004 — Marcelo Quiroga Santa Cruz",
        descripcion: "Lucha contra la corrupción, enriquecimiento ilícito e investigación de fortunas.",
        archivo: "../data/ley_004.csv"
    },
    escalafon: {
        titulo: "D.S. N° 04688 — Escalafón del Magisterio",
        descripcion: "Reglamento del Escalafón Nacional del Servicio de Educación y carrera docente.",
        archivo: "../data/escalafon.csv"
    },
    compendio_esfm: {
        titulo: "R.M. N° 2938 — Compendio Normativo ESFM/UA",
        descripcion: "Reglamento general, evaluación, convivencia, IEPC-PEC, TACFI, licencias y residencias.",
        archivo: "../data/compendio_normativo_esfm.csv"
    },
    rs_faltas: {
        titulo: "R.S. N° 212414 — Faltas y Sanciones",
        descripcion: "Reglamento de faltas y sanciones disciplinarias del servicio educativo.",
        archivo: "../data/rs_faltas.csv"
    }
};

function construirMapaBancos() {
    if (typeof BANCOS_CSV !== "undefined" && Array.isArray(BANCOS_CSV) && BANCOS_CSV.length > 0) {
        const mapa = {};
        BANCOS_CSV.forEach((banco) => {
            const ruta = banco.file.startsWith("../") || banco.file.startsWith("http")
                ? banco.file
                : `../${banco.file}`;

            mapa[banco.id] = {
                titulo: banco.title,
                descripcion: banco.description,
                archivo: ruta
            };
        });
        return mapa;
    }

    return BANCOS_RESPALDO;
}

const BANCOS = construirMapaBancos();


// ======================================================
// VARIABLES DEL SIMULADOR
// ======================================================

let bancoActual = null;
let preguntas = [];
let indiceActual = 0;


// ======================================================
// ELEMENTOS HTML
// ======================================================

const loadingScreen = document.getElementById("loadingScreen");
const errorScreen = document.getElementById("errorScreen");
const errorMessage = document.getElementById("errorMessage");

const examScreen = document.getElementById("examScreen");
const resultScreen = document.getElementById("resultScreen");
const reviewScreen = document.getElementById("reviewScreen");

const examTitle = document.getElementById("examTitle");
const examDescription = document.getElementById("examDescription");

const questionNumber = document.getElementById("questionNumber");
const questionId = document.getElementById("questionId");
const questionText = document.getElementById("questionText");

const optionsContainer = document.getElementById("optionsContainer");
const progressBar = document.getElementById("progressBar");

const checkButton = document.getElementById("checkButton");
const nextButton = document.getElementById("nextButton");

const feedbackMessage = document.getElementById("feedbackMessage");
const answeredCounter = document.getElementById("answeredCounter");


// ======================================================
// FUNCIONES GENERALES
// ======================================================

function mezclarArreglo(arreglo) {
    const copia = [...arreglo];

    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }

    return copia;
}

function obtenerCampo(fila, nombre) {
    return String(fila[nombre] ?? "").trim();
}

function prepararOpcion(texto, indice) {
    const letraOriginal = ["A", "B", "C", "D"][indice];
    const contenido = texto.replace(/^\s*[A-D]\s*[\)\.\-:]\s*/, "").trim();

    return {
        letraOriginal,
        texto: contenido
    };
}


// ======================================================
// CARGAR BANCO CSV
// ======================================================

async function cargarBanco() {

    try {

        loadingScreen.classList.remove("d-none");
        errorScreen.classList.add("d-none");
        examScreen.classList.add("d-none");
        resultScreen.classList.add("d-none");
        reviewScreen.classList.add("d-none");

        const parametros = new URLSearchParams(window.location.search);
        const identificadorBanco = parametros.get("banco") || "cpe";

        bancoActual = BANCOS[identificadorBanco];

        if (!bancoActual) {
            throw new Error(`El banco "${identificadorBanco}" no está configurado.`);
        }

        if (typeof Papa === "undefined") {
            throw new Error("No se pudo cargar la biblioteca PapaParse para leer archivos CSV.");
        }

        const urlArchivo = new URL(bancoActual.archivo, window.location.href).href;
        const respuesta = await fetch(urlArchivo);

        if (!respuesta.ok) {
            throw new Error(
                `No se encontró el archivo CSV (${respuesta.status}): ${bancoActual.archivo}`
            );
        }

        const contenidoCSV = await respuesta.text();

        const resultado = Papa.parse(contenidoCSV, {
            header: true,
            skipEmptyLines: true,
            transformHeader: header => header.replace(/^\uFEFF/, "").trim()
        });

        if (resultado.errors.length > 0) {
            console.warn("Advertencias del CSV:", resultado.errors);
        }

        const filas = resultado.data;

        if (!filas.length) {
            throw new Error("El archivo CSV no contiene preguntas.");
        }

        const preguntasPreparadas = filas.map((fila, indice) => {

            const opcionesOriginales = [
                obtenerCampo(fila, "Op1"),
                obtenerCampo(fila, "Op2"),
                obtenerCampo(fila, "Op3"),
                obtenerCampo(fila, "Op4")
            ];

            const respuestaCorrecta = obtenerCampo(fila, "Respuesta").toUpperCase();

            if (
                !obtenerCampo(fila, "Pregunta") ||
                opcionesOriginales.some(opcion => !opcion) ||
                !["A", "B", "C", "D"].includes(respuestaCorrecta)
            ) {
                throw new Error(
                    `Hay un problema en la pregunta de la fila ${indice + 2} del CSV (${bancoActual.archivo}). Revisa sus columnas y respuesta correcta.`
                );
            }

            const opciones = opcionesOriginales.map((texto, i) =>
                prepararOpcion(texto, i)
            );

            return {
                id: obtenerCampo(fila, "ID") || `P-${indice + 1}`,
                pregunta: obtenerCampo(fila, "Pregunta"),
                opciones: mezclarArreglo(opciones),
                respuestaCorrecta,
                seleccionada: null,
                respondida: false,
                esCorrecta: false
            };
        });

        const preguntasAleatorias = mezclarArreglo(preguntasPreparadas);

        preguntas = PREGUNTAS_POR_SIMULACRO > 0
            ? preguntasAleatorias.slice(
                0,
                Math.min(PREGUNTAS_POR_SIMULACRO, preguntasAleatorias.length)
            )
            : preguntasAleatorias;

        if (!preguntas.length) {
            throw new Error("No hay preguntas disponibles para el simulacro.");
        }

        iniciarExamen();

    } catch (error) {

        loadingScreen.classList.add("d-none");
        errorScreen.classList.remove("d-none");
        errorMessage.textContent = error.message;

        console.error(error);
    }
}


// ======================================================
// INICIAR EXAMEN
// ======================================================

function iniciarExamen() {

    indiceActual = 0;

    examTitle.textContent = bancoActual.titulo;
    examDescription.textContent = bancoActual.descripcion;

    loadingScreen.classList.add("d-none");
    errorScreen.classList.add("d-none");
    resultScreen.classList.add("d-none");
    reviewScreen.classList.add("d-none");
    examScreen.classList.remove("d-none");

    mostrarPregunta();
}


// ======================================================
// MOSTRAR PREGUNTA
// ======================================================

function mostrarPregunta() {

    const pregunta = preguntas[indiceActual];

    const numero = indiceActual + 1;
    const total = preguntas.length;

    questionNumber.textContent = `${numero} / ${total}`;
    questionId.textContent = pregunta.id;
    questionText.textContent = pregunta.pregunta;

    progressBar.style.width = `${(numero / total) * 100}%`;

    optionsContainer.innerHTML = "";

    feedbackMessage.className = "feedback-message d-none";
    feedbackMessage.textContent = "";

    pregunta.opciones.forEach((opcion, indice) => {

        const letraVisual = ["A", "B", "C", "D"][indice];

        const boton = document.createElement("button");

        boton.type = "button";
        boton.className = "option-button";

        boton.innerHTML = `
            <span class="option-letter">${letraVisual}</span>
            <span class="option-text"></span>
            <i class="bi bi-circle option-icon"></i>
        `;

        boton.querySelector(".option-text").textContent = opcion.texto;

        boton.addEventListener("click", () => {
            seleccionarOpcion(indice);
        });

        optionsContainer.appendChild(boton);
    });

    checkButton.classList.remove("d-none");
    nextButton.classList.add("d-none");

    actualizarContador();

    if (pregunta.respondida) {
        mostrarCorreccion();
    }
}


// ======================================================
// SELECCIONAR RESPUESTA
// ======================================================

function seleccionarOpcion(indice) {

    const pregunta = preguntas[indiceActual];

    if (pregunta.respondida) return;

    pregunta.seleccionada = indice;

    const botones = optionsContainer.querySelectorAll(".option-button");

    botones.forEach((boton, i) => {

        boton.classList.toggle("selected", i === indice);

        const icono = boton.querySelector(".option-icon");

        icono.className = i === indice
            ? "bi bi-record-circle-fill option-icon"
            : "bi bi-circle option-icon";
    });
}


// ======================================================
// COMPROBAR RESPUESTA
// ======================================================

function comprobarRespuesta() {

    const pregunta = preguntas[indiceActual];

    if (pregunta.respondida) return;

    if (pregunta.seleccionada === null) {
        feedbackMessage.className = "feedback-message feedback-warning";
        feedbackMessage.textContent = "Selecciona una opción antes de continuar.";
        return;
    }

    const opcionSeleccionada = pregunta.opciones[pregunta.seleccionada];

    pregunta.respondida = true;

    pregunta.esCorrecta =
        opcionSeleccionada.letraOriginal === pregunta.respuestaCorrecta;

    mostrarCorreccion();
    actualizarContador();
}


// ======================================================
// MOSTRAR CORRECCIÓN VISUAL
// ======================================================

function mostrarCorreccion() {

    const pregunta = preguntas[indiceActual];

    const botones = optionsContainer.querySelectorAll(".option-button");

    botones.forEach((boton, indice) => {

        boton.disabled = true;

        const opcion = pregunta.opciones[indice];

        const esRespuestaCorrecta =
            opcion.letraOriginal === pregunta.respuestaCorrecta;

        const fueSeleccionada =
            indice === pregunta.seleccionada;

        const icono = boton.querySelector(".option-icon");

        if (esRespuestaCorrecta) {

            boton.classList.add("option-correct");
            icono.className = "bi bi-check-circle-fill option-icon";

        } else if (fueSeleccionada) {

            boton.classList.add("option-incorrect");
            icono.className = "bi bi-x-circle-fill option-icon";
        }
    });

    if (pregunta.esCorrecta) {

        feedbackMessage.className = "feedback-message feedback-correct";
        feedbackMessage.textContent = "¡Correcto! Has seleccionado la respuesta adecuada.";

    } else {

        feedbackMessage.className = "feedback-message feedback-incorrect";
        feedbackMessage.textContent = "Respuesta incorrecta. La opción correcta está marcada en verde.";
    }

    checkButton.classList.add("d-none");
    nextButton.classList.remove("d-none");

    nextButton.innerHTML = indiceActual === preguntas.length - 1
        ? 'Finalizar simulador <i class="bi bi-flag-fill ms-2"></i>'
        : 'Siguiente pregunta <i class="bi bi-arrow-right ms-2"></i>';
}


// ======================================================
// CONTINUAR A LA SIGUIENTE PREGUNTA
// ======================================================

function siguientePregunta() {

    if (!preguntas[indiceActual].respondida) return;

    if (indiceActual < preguntas.length - 1) {

        indiceActual++;
        mostrarPregunta();

    } else {

        finalizarExamen();
    }
}


// ======================================================
// ACTUALIZAR CONTADOR
// ======================================================

function actualizarContador() {

    const respondidas = preguntas.filter(
        pregunta => pregunta.respondida
    ).length;

    answeredCounter.textContent = `Respondidas: ${respondidas} / ${preguntas.length}`;
}


// ======================================================
// FINALIZAR Y CALCULAR RESULTADOS
// ======================================================

function finalizarExamen() {

    const correctas = preguntas.filter(
        pregunta => pregunta.esCorrecta
    ).length;

    const incorrectas = preguntas.length - correctas;

    const porcentaje = (correctas / preguntas.length) * 100;

    document.getElementById("finalScore").textContent =
        `${porcentaje.toFixed(1)}%`;

    document.getElementById("correctCount").textContent = correctas;
    document.getElementById("incorrectCount").textContent = incorrectas;
    document.getElementById("totalCount").textContent = preguntas.length;

    let mensaje = "Evaluación completada.";

    if (porcentaje >= 90) {
        mensaje = "Excelente resultado.";
    } else if (porcentaje >= 70) {
        mensaje = "Buen resultado. Sigue practicando.";
    } else if (porcentaje >= 51) {
        mensaje = "Puedes mejorar con más práctica.";
    } else {
        mensaje = "Te recomendamos repasar los contenidos.";
    }

    document.getElementById("resultMessage").textContent = mensaje;

    examScreen.classList.add("d-none");
    reviewScreen.classList.add("d-none");
    resultScreen.classList.remove("d-none");
}


// ======================================================
// REVISAR RESPUESTAS
// ======================================================

function revisarRespuestas() {

    const contenedor = document.getElementById("reviewContainer");

    contenedor.innerHTML = "";

    preguntas.forEach((pregunta, indice) => {

        const opcionCorrecta = pregunta.opciones.find(
            opcion => opcion.letraOriginal === pregunta.respuestaCorrecta
        );

        const opcionSeleccionada = pregunta.seleccionada !== null
            ? pregunta.opciones[pregunta.seleccionada]
            : null;

        const tarjeta = document.createElement("div");

        tarjeta.className = "review-card";

        const encabezado = document.createElement("div");
        encabezado.className = "review-card-header";

        const numero = document.createElement("strong");
        numero.textContent = `Pregunta ${indice + 1}`;

        const estado = document.createElement("span");
        estado.className = pregunta.esCorrecta
            ? "review-status review-status-correct"
            : "review-status review-status-incorrect";

        estado.textContent = pregunta.esCorrecta ? "Correcta" : "Incorrecta";

        encabezado.append(numero, estado);

        const texto = document.createElement("p");
        texto.className = "review-question";
        texto.textContent = pregunta.pregunta;

        const seleccion = document.createElement("p");
        seleccion.className = "review-answer";

        seleccion.textContent = opcionSeleccionada
            ? `Tu respuesta: ${opcionSeleccionada.texto}`
            : "Tu respuesta: Sin responder";

        if (pregunta.esCorrecta) {
            seleccion.classList.add("text-success");
        } else {
            seleccion.classList.add("text-danger");
        }

        const correcta = document.createElement("p");
        correcta.className = "review-answer text-success";
        correcta.textContent = `Respuesta correcta: ${opcionCorrecta.texto}`;

        tarjeta.append(encabezado, texto, seleccion, correcta);

        contenedor.appendChild(tarjeta);
    });

    resultScreen.classList.add("d-none");
    reviewScreen.classList.remove("d-none");
}


// ======================================================
// NUEVO INTENTO
// ======================================================

function nuevoIntento() {

    resultScreen.classList.add("d-none");
    cargarBanco();
}


// ======================================================
// EVENTOS
// ======================================================

checkButton.addEventListener("click", comprobarRespuesta);

nextButton.addEventListener("click", siguientePregunta);

document.getElementById("reviewButton").addEventListener(
    "click",
    revisarRespuestas
);

document.getElementById("restartButton").addEventListener(
    "click",
    nuevoIntento
);

document.getElementById("backToResultsButton").addEventListener(
    "click",
    () => {
        reviewScreen.classList.add("d-none");
        resultScreen.classList.remove("d-none");
    }
);


// ======================================================
// EJECUTAR SIMULADOR
// ======================================================

cargarBanco();