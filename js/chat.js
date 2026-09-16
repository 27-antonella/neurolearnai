const mensajes = document.getElementById("mensajes");
const input = document.getElementById("texto");
const escribiendo = document.getElementById("escribiendo");
const botonEnviar = document.getElementById("btnEnviar");

// Enviar con Enter
input.addEventListener("keydown", function (e) {

    if (e.key === "Enter") {

        e.preventDefault();

        enviar();

    }

});

// Agregar mensaje al chat
function agregarMensaje(texto, tipo) {

    const mensaje = document.createElement("div");

    mensaje.className = "mensaje " + tipo;

    if (tipo === "bot") {

        mensaje.innerHTML = `
            <img src="logo.png" class="avatar">

            <div class="burbuja">

                ${texto}

            </div>
        `;

    } else {

        mensaje.innerHTML = `
            <div class="burbuja">

                ${texto}

            </div>
        `;

    }

    mensajes.appendChild(mensaje);

    mensajes.scrollTop = mensajes.scrollHeight;

}

// Mostrar/Ocultar "escribiendo"
function mostrarEscribiendo() {

    escribiendo.style.display = "flex";

    mensajes.scrollTop = mensajes.scrollHeight;

}

function ocultarEscribiendo() {

    escribiendo.style.display = "none";

}
// Enviar pregunta a Ollama
async function enviar() {

    const pregunta = input.value.trim();

    if (pregunta === "") return;

    // Mostrar inmediatamente el mensaje del usuario
    agregarMensaje(pregunta, "user");

    // Limpiar el cuadro de texto enseguida
    input.value = "";

    input.focus();

    // Desactivar mientras responde
    botonEnviar.disabled = true;

    input.disabled = true;

    // Mostrar "pensando..."
    mostrarEscribiendo();

   try {

        const respuesta = await fetch(
"https://neurolearnai-1.onrender.com/preguntar",
   {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    pregunta: pregunta
                })

            }
        );


        const datos = await respuesta.json();
        console.log(datos);

        ocultarEscribiendo();

        agregarMensaje(datos.respuesta, "bot");

    }

    catch (error) {

        console.error(error);

        ocultarEscribiendo();

        agregarMensaje(
            "❌ No pude conectarme con NeuroLearn AI.",
            "bot"
        );

    }

    botonEnviar.disabled = false;

    input.disabled = false;

    input.focus();

}
// ===============================
// NeuroLearn AI
// Funciones auxiliares
// ===============================

// Desplazar siempre al último mensaje
function bajarChat() {

    mensajes.scrollTo({
        top: mensajes.scrollHeight,
        behavior: "smooth"
    });

}

// Enfocar el cuadro de texto al iniciar
window.addEventListener("load", () => {

    input.focus();

    bajarChat();

});

// Mantener el foco cuando el usuario haga clic en el chat
document.addEventListener("click", () => {

    if (!input.disabled) {

        input.focus();

    }

});

// Permitir enviar haciendo clic en el botón
botonEnviar.addEventListener("click", enviar);