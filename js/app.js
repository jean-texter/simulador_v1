// =========================================
// EDUSIM - SISTEMA DE ACCESO
// =========================================

// Lista de contraseñas válidas:
// - 2 contraseñas solicitadas: "spidey", "mey"
// - 10 contraseñas con 2 letras mayúsculas iniciales + 5 números
const PASSWORDS_VALIDAS = [
    "spidey",
    "mey",
    "AB10482",
    "CM39215",
    "DG74810",
    "EF51924",
    "GH83019",
    "JK26473",
    "LM90518",
    "NP61742",
    "QR45829",
    "ST72936",
    "AB81154",
    "CM99154",
    "DG71388",
    "EF14756",
    "GH89925",
    "JK14211",
    "LM99712",
    "NP15444",
    "QR22422",
    "ST14454",
    
];

// Elementos HTML
const loginForm = document.getElementById("loginForm");
const passwordInput = document.getElementById("password");
const loginError = document.getElementById("loginError");

const togglePassword = document.getElementById("togglePassword");

// =========================================
// MOSTRAR / OCULTAR CONTRASEÑA
// =========================================

togglePassword.addEventListener("click", () => {

    const isPassword = passwordInput.type === "password";

    passwordInput.type = isPassword ? "text" : "password";

    togglePassword.innerHTML = isPassword
        ? '<i class="bi bi-eye-slash"></i>'
        : '<i class="bi bi-eye"></i>';

});

// =========================================
// VALIDACIÓN DE ACCESO
// =========================================

loginForm.addEventListener("submit", (event) => {

    event.preventDefault();

    const enteredPassword = passwordInput.value;

    if (PASSWORDS_VALIDAS.includes(enteredPassword)) {

        // Guardar sesión de acceso
        sessionStorage.setItem("edusim_access", "true");

        // Ir al panel principal
        window.location.href = "dashboard.html";

    } else {

        // Mostrar mensaje de error
        loginError.classList.add("show");

        // Limpiar campo
        passwordInput.value = "";

        passwordInput.focus();

    }

});

// =========================================
// OCULTAR ERROR AL ESCRIBIR
// =========================================

passwordInput.addEventListener("input", () => {
    loginError.classList.remove("show");
});