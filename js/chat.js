
const mensajes = document.getElementById("mensajes");
const input = document.getElementById("texto");
const escribiendo = document.getElementById("escribiendo");
const botonEnviar = document.getElementById("btnEnviar");

// ==================================================
// URL DEL SERVIDOR
// ==================================================

const API_URL = "https://neurolearnai-clit.onrender.com";

// ==================================================
// MEMORIA DE LA CONVERSACIÓN
// ==================================================

// Aquí se guardan los mensajes mientras el chat esté abierto.
let historialConversacion = [];

// Máximo de mensajes anteriores que enviamos a la IA.
const MAX_MENSAJES_MEMORIA = 12;

// ==================================================
// ENVIAR CON ENTER
// ==================================================

input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        enviar();
    }
});

// ==================================================
// LIMPIAR RESPUESTAS DE LA IA
// ==================================================

function limpiarRespuesta(texto) {
    let limpio = String(texto);

    limpio = limpio.replace(/\*\*(.*?)\*\*/g, "$1");
    limpio = limpio.replace(/\*(.*?)\*/g, "$1");
    limpio = limpio.replace(/^#{1,6}\s*/gm, "");
    limpio = limpio.replace(/`/g, "");
    limpio = limpio.replace(/__([^_]+)__/g, "$1");
    limpio = limpio.replace(/_([^_]+)_/g, "$1");
    limpio = limpio.replace(/\\([*_#`])/g, "$1");
    limpio = limpio.replace(/^\s*[-*_]{3,}\s*$/gm, "");
    limpio = limpio.replace(/\n{3,}/g, "\n\n");

    return limpio.trim();
}

// ==================================================
// AGREGAR MENSAJE
// ==================================================

function agregarMensaje(texto, tipo) {
    const mensaje = document.createElement("div");
    mensaje.className = "mensaje " + tipo;

    if (tipo === "bot") {
        const avatar = document.createElement("img");

        avatar.src = "logo.png";
        avatar.className = "avatar";
        avatar.alt = "NeuroLearn AI";

        const burbuja = document.createElement("div");
        burbuja.className = "burbuja";
        burbuja.textContent = limpiarRespuesta(texto);

        mensaje.appendChild(avatar);
        mensaje.appendChild(burbuja);

    } else {
        const burbuja = document.createElement("div");

        burbuja.className = "burbuja";
        burbuja.textContent = texto;

        mensaje.appendChild(burbuja);
    }

    mensajes.appendChild(mensaje);

    mensajes.scrollTop = mensajes.scrollHeight;
}

// ==================================================
// GUARDAR MENSAJES EN LA MEMORIA
// ==================================================

function guardarEnMemoria(pregunta, respuesta) {
    historialConversacion.push({
        role: "user",
        content: pregunta
    });

    historialConversacion.push({
        role: "assistant",
        content: respuesta
    });

    // Conservar solamente los últimos 12 mensajes.
    historialConversacion =
        historialConversacion.slice(-MAX_MENSAJES_MEMORIA);
}

// ==================================================
// MOSTRAR "NEUROLEARN AI ESTÁ PENSANDO"
// ==================================================

function mostrarEscribiendo() {
    escribiendo.style.display = "flex";

    mensajes.scrollTop = mensajes.scrollHeight;
}

// ==================================================
// OCULTAR "PENSANDO"
// ==================================================

function ocultarEscribiendo() {
    escribiendo.style.display = "none";
}

// ==================================================
// ENVIAR PREGUNTA
// ==================================================

async function enviar() {
    const pregunta = input.value.trim();

    if (pregunta === "") {
        return;
    }

    // Mostrar pregunta del usuario.
    agregarMensaje(pregunta, "user");

    // Limpiar input.
    input.value = "";
    input.focus();

    // Desactivar controles.
    botonEnviar.disabled = true;
    input.disabled = true;

    mostrarEscribiendo();

    try {
        // Obtener el historial anterior a esta pregunta.
        const historialAnterior = [...historialConversacion];

        // Enviar pregunta y memoria al servidor.
        const respuesta = await fetch(`${API_URL}/preguntar`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                pregunta: pregunta,
                historial: historialAnterior
            })
        });

        const datos = await respuesta.json().catch(() => ({}));

        console.log("Respuesta del servidor:", datos);

        if (!respuesta.ok) {
            throw new Error(
                datos.respuesta ||
                `Error del servidor: ${respuesta.status}`
            );
        }

        if (!datos.respuesta) {
            throw new Error("El servidor no devolvió una respuesta.");
        }

        // Ocultar indicador.
        ocultarEscribiendo();

        // Mostrar respuesta de la IA.
        agregarMensaje(datos.respuesta, "bot");

        // Guardar pregunta y respuesta en la memoria.
        guardarEnMemoria(pregunta, datos.respuesta);

    } catch (error) {
        console.error("❌ Error:", error);

        ocultarEscribiendo();

        agregarMensaje(
            "❌ No pude conectarme con NeuroLearn AI. Intentá nuevamente.",
            "bot"
        );

    } finally {
        // Reactivar controles.
        botonEnviar.disabled = false;
        input.disabled = false;
        input.focus();
    }
}

// ==================================================
// BAJAR CHAT
// ==================================================

function bajarChat() {
    mensajes.scrollTo({
        top: mensajes.scrollHeight,
        behavior: "smooth"
    });
}

// ==================================================
// AL CARGAR LA PÁGINA
// ==================================================

window.addEventListener("load", () => {
    input.focus();
    bajarChat();
});

// ==================================================
// BOTÓN ENVIAR
// ==================================================

botonEnviar.addEventListener("click", enviar);
