
const mensajes = document.getElementById("mensajes");
const input = document.getElementById("texto");
const escribiendo = document.getElementById("escribiendo");
const botonEnviar = document.getElementById("btnEnviar");

const API_URL = "https://neurolearnai-1.onrender.com";
const MAX_MENSAJES_MEMORIA = 12;

let historialConversacion = [];
let enviando = false;

// Comprobar que existen los elementos del chat.
if (!mensajes || !input || !escribiendo || !botonEnviar) {
    console.error("NeuroLearn AI: faltan elementos HTML del chat.");
} else {

    // Enviar con Enter.
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            enviar();
        }
    });

    // Botón enviar.
    botonEnviar.addEventListener("click", enviar);

    // Limpiar formato Markdown básico.
    function limpiarRespuesta(texto) {
        return String(texto ?? "")
            .replace(/\*\*(.*?)\*\*/gs, "$1")
            .replace(/\*(.*?)\*/gs, "$1")
            .replace(/^#{1,6}\s*/gm, "")
            .replace(/`/g, "")
            .replace(/__([^_]+)__/g, "$1")
            .replace(/_([^_]+)_/g, "$1")
            .replace(/^\s*[-*_]{3,}\s*$/gm, "")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    }

    // Mostrar mensajes de forma segura.
    function agregarMensaje(texto, tipo) {
        const mensaje = document.createElement("div");
        mensaje.className = "mensaje " + tipo;

        if (tipo === "bot") {
            const avatar = document.createElement("img");
            avatar.src = "img/robot.png";
            avatar.className = "avatar";
            avatar.alt = "NeuroLearn AI";
            avatar.onerror = () => avatar.remove();

            mensaje.appendChild(avatar);
        }

        const burbuja = document.createElement("div");
        burbuja.className = "burbuja";
        burbuja.textContent = tipo === "bot"
            ? limpiarRespuesta(texto)
            : texto;

        mensaje.appendChild(burbuja);
        mensajes.appendChild(mensaje);

        bajarChat();
    }

    // Mantener memoria temporal.
    function guardarEnMemoria(pregunta, respuesta) {
        historialConversacion.push(
            { role: "user", content: pregunta },
            { role: "assistant", content: respuesta }
        );

        historialConversacion =
            historialConversacion.slice(-MAX_MENSAJES_MEMORIA);
    }

    function mostrarEscribiendo() {
        escribiendo.style.display = "flex";
        bajarChat();
    }

    function ocultarEscribiendo() {
        escribiendo.style.display = "none";
    }

    // Enviar pregunta al servidor.
    async function enviar() {
        if (enviando) return;

        const pregunta = input.value.trim();

        if (!pregunta) return;

        enviando = true;
        agregarMensaje(pregunta, "user");

        input.value = "";
        input.disabled = true;
        botonEnviar.disabled = true;

        mostrarEscribiendo();

        try {
            const respuesta = await fetch(`${API_URL}/preguntar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    pregunta,
                    historial: historialConversacion
                })
            });

            const datos = await respuesta.json();

            console.log("Respuesta del servidor:", datos);

            if (!respuesta.ok) {
                throw new Error(
                    datos.error ||
                    datos.respuesta ||
                    datos.mensaje ||
                    `Error HTTP ${respuesta.status}`
                );
            }

            if (
                typeof datos.respuesta !== "string" ||
                !datos.respuesta.trim()
            ) {
                throw new Error("El servidor devolvió una respuesta vacía.");
            }

            agregarMensaje(datos.respuesta, "bot");

            guardarEnMemoria(pregunta, datos.respuesta);

        } catch (error) {
            console.error("Error en NeuroLearn AI:", error);

            let mensajeError =
                "No pude obtener una respuesta. Intentá nuevamente.";

            if (error instanceof TypeError) {
                mensajeError =
                    "No pude conectar con el servidor. Comprobá tu conexión a Internet o el estado de Render.";
            } else if (error.message) {
                mensajeError = error.message;
            }

            agregarMensaje("⚠️ " + mensajeError, "bot");

        } finally {
            ocultarEscribiendo();

            enviando = false;
            input.disabled = false;
            botonEnviar.disabled = false;
            input.focus();
        }
    }

    // Bajar al último mensaje.
    function bajarChat() {
        mensajes.scrollTo({
            top: mensajes.scrollHeight,
            behavior: "smooth"
        });
    }

    // Inicialización.
    window.addEventListener("load", () => {
        input.focus();
        bajarChat();
    });

    ocultarEscribiendo();
}
