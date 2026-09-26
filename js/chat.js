const mensajes = document.getElementById("mensajes");
const input = document.getElementById("texto");
const escribiendo = document.getElementById("escribiendo");
const botonEnviar = document.getElementById("btnEnviar");


// ==========================================
// URL DEL SERVIDOR
// ==========================================

const API_URL =
    "https://neurolearnai-1.onrender.com";


// ==========================================
// ENVIAR CON ENTER
// ==========================================

input.addEventListener(
    "keydown",
    function (e) {

        if (e.key === "Enter") {

            e.preventDefault();

            enviar();

        }

    }
);


// ==========================================
// LIMPIAR RESPUESTAS DE LA IA
// ==========================================

function limpiarRespuesta(texto) {

    let limpio = String(texto);


    // ------------------------------------------
    // Eliminar negrita Markdown
    // ------------------------------------------

    limpio = limpio.replace(
        /\\?\*\\?\*/g,
        ""
    );


    // ------------------------------------------
    // Eliminar cursiva Markdown
    // ------------------------------------------

    limpio = limpio.replace(
        /\\?\*/g,
        ""
    );


    // ------------------------------------------
    // Eliminar títulos Markdown
    // ------------------------------------------

    limpio = limpio.replace(
        /^#{1,6}\s*/gm,
        ""
    );


    // ------------------------------------------
    // Eliminar código inline
    // ------------------------------------------

    limpio = limpio.replace(
        /`/g,
        ""
    );


    // ------------------------------------------
    // Eliminar algunos formatos
    // ------------------------------------------

    limpio = limpio.replace(
        /__([^_]+)__/g,
        "$1"
    );


    limpio = limpio.replace(
        /_([^_]+)_/g,
        "$1"
    );


    // ------------------------------------------
    // Limpiar caracteres de escape
    // ------------------------------------------

    limpio = limpio.replace(
        /\\([*_#`])/g,
        "$1"
    );


    // ------------------------------------------
    // Eliminar líneas con separadores Markdown
    // ------------------------------------------

    limpio = limpio.replace(
        /^\s*[-*_]{3,}\s*$/gm,
        ""
    );


    // ------------------------------------------
    // Evitar demasiados saltos de línea
    // ------------------------------------------

    limpio = limpio.replace(
        /\n{3,}/g,
        "\n\n"
    );


    return limpio.trim();

}


// ==========================================
// AGREGAR MENSAJE
// ==========================================

function agregarMensaje(texto, tipo) {

    const mensaje =
        document.createElement("div");

    mensaje.className =
        "mensaje " + tipo;


    // ======================================
    // MENSAJE DEL BOT
    // ======================================

    if (tipo === "bot") {

        const avatar =
            document.createElement("img");

        avatar.src = "logo.png";

        avatar.className =
            "avatar";

        avatar.alt =
            "NeuroLearn AI";


        const burbuja =
            document.createElement("div");

        burbuja.className =
            "burbuja";


        // Limpiar texto recibido
        const textoLimpio =
            limpiarRespuesta(texto);


        // Usamos textContent para que
        // la respuesta sea solamente texto
        burbuja.textContent =
            textoLimpio;


        mensaje.appendChild(
            avatar
        );

        mensaje.appendChild(
            burbuja
        );

    }


    // ======================================
    // MENSAJE DEL USUARIO
    // ======================================

    else {

        const burbuja =
            document.createElement("div");

        burbuja.className =
            "burbuja";


        burbuja.textContent =
            texto;


        mensaje.appendChild(
            burbuja
        );

    }


    // ======================================
    // AGREGAR AL CHAT
    // ======================================

    mensajes.appendChild(
        mensaje
    );


    // Bajar automáticamente
    mensajes.scrollTop =
        mensajes.scrollHeight;

}


// ==========================================
// MOSTRAR "NEUROLEARN AI ESTÁ PENSANDO"
// ==========================================

function mostrarEscribiendo() {

    escribiendo.style.display =
        "flex";

    mensajes.scrollTop =
        mensajes.scrollHeight;

}


// ==========================================
// OCULTAR "PENSANDO"
// ==========================================

function ocultarEscribiendo() {

    escribiendo.style.display =
        "none";

}


// ==========================================
// ENVIAR PREGUNTA
// ==========================================

async function enviar() {

    const pregunta =
        input.value.trim();


    // No enviar vacío
    if (pregunta === "") {

        return;

    }


    // --------------------------------------
    // Mostrar pregunta del usuario
    // --------------------------------------

    agregarMensaje(
        pregunta,
        "user"
    );


    // Limpiar input
    input.value = "";

    input.focus();


    // Desactivar mientras responde
    botonEnviar.disabled =
        true;

    input.disabled =
        true;


    // Mostrar indicador
    mostrarEscribiendo();


    try {


        // ==================================
        // ENVIAR AL SERVIDOR
        // ==================================

        const respuesta =
            await fetch(

                `${API_URL}/preguntar`,

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        pregunta:
                            pregunta

                    })

                }

            );


        // ==================================
        // LEER RESPUESTA
        // ==================================

        const datos =
            await respuesta.json()
                .catch(() => ({}));


        console.log(
            "Respuesta del servidor:",
            datos
        );


        // ==================================
        // ERROR DEL SERVIDOR
        // ==================================

        if (!respuesta.ok) {

            throw new Error(

                datos.respuesta ||
                `Error del servidor: ${respuesta.status}`

            );

        }


        // Ocultar indicador
        ocultarEscribiendo();


        // ==================================
        // MOSTRAR RESPUESTA
        // ==================================

        agregarMensaje(

            datos.respuesta ||
            "No recibí una respuesta.",

            "bot"

        );

    }


    catch (error) {

        console.error(
            "❌ Error:",
            error
        );


        ocultarEscribiendo();


        agregarMensaje(

            "❌ No pude conectarme con NeuroLearn AI. Intentá nuevamente.",

            "bot"

        );

    }


    finally {

        // Reactivar controles
        botonEnviar.disabled =
            false;

        input.disabled =
            false;

        input.focus();

    }

}


// ==========================================
// BAJAR CHAT
// ==========================================

function bajarChat() {

    mensajes.scrollTo({

        top:
            mensajes.scrollHeight,

        behavior:
            "smooth"

    });

}


// ==========================================
// AL CARGAR LA PÁGINA
// ==========================================

window.addEventListener(

    "load",

    () => {

        input.focus();

        bajarChat();

    }

);


// ==========================================
// BOTÓN ENVIAR
// ==========================================

botonEnviar.addEventListener(

    "click",

    enviar

);