const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 10000;

// ==========================================
// CONFIGURACIÓN
// ==========================================

app.use(cors());
app.use(express.json());


// ==========================================
// PÁGINA PRINCIPAL
// ==========================================

app.get("/", (req, res) => {

    res.status(200).json({
        ok: true,
        mensaje: "🧠 NeuroLearn AI funcionando correctamente"
    });

});


// ==========================================
// COMPROBAR SERVIDOR
// ==========================================

app.get("/health", (req, res) => {

    res.status(200).json({
        ok: true,
        servidor: "NeuroLearn AI",
        estado: "funcionando"
    });

});


// ==========================================
// CHAT CON GROQ
// ==========================================

app.post("/preguntar", async (req, res) => {

    try {

        const pregunta = String(
            req.body?.pregunta || ""
        ).trim();


        // ------------------------------------------
        // COMPROBAR PREGUNTA
        // ------------------------------------------

        if (!pregunta) {

            return res.status(400).json({
                respuesta: "Escribí una pregunta."
            });

        }


        // ------------------------------------------
        // COMPROBAR API KEY
        // ------------------------------------------

        if (!process.env.GROQ_API_KEY) {

            console.error(
                "❌ ERROR: GROQ_API_KEY no está configurada."
            );

            return res.status(500).json({

                respuesta:
                    "El servidor no tiene configurada la clave de inteligencia artificial."

            });

        }


        console.log("");
        console.log("======================================");
        console.log("📤 Enviando pregunta a Groq...");
        console.log("======================================");


        // ==========================================
        // PETICIÓN A GROQ
        // ==========================================

        const respuestaGroq = await fetch(

            "https://api.groq.com/openai/v1/chat/completions",

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${process.env.GROQ_API_KEY}`

                },

                body: JSON.stringify({

                    model: "openai/gpt-oss-20b",

                    messages: [

                        {
                            role: "system",

                            content: `
Eres NeuroLearn AI.

Eres un asistente educativo diseñado
para ayudar a niños y adolescentes
a aprender.

Tu objetivo es explicar los temas
de manera clara, sencilla, amable
y divertida.

Responde siempre en español.

Utiliza ejemplos fáciles de entender.

Adapta las explicaciones para que
sean apropiadas para niños.

Si el tema es complicado, divídelo
en pasos sencillos.

Utiliza ejemplos cotidianos cuando
ayuden a comprender mejor.

Puedes utilizar emojis cuando ayuden
a comprender la explicación.

IMPORTANTE SOBRE EL FORMATO:

Escribe únicamente texto limpio y natural.

NO utilices Markdown.

NO utilices dos asteriscos para negrita.

NO utilices un asterisco para cursiva.

NO utilices símbolos como:

**
*
#
###
\\*\\*

NO utilices títulos con #.

NO utilices bloques de código.

NO utilices etiquetas HTML.

NO escribas código de formato.

No pongas palabras entre asteriscos.

Utiliza solamente texto normal,
párrafos, listas simples y emojis.

Por ejemplo, escribe:

La Revolución Francesa comenzó
en 1789 y produjo grandes cambios
políticos y sociales.

NO escribas:

La **Revolución Francesa** comenzó
en 1789.

La respuesta debe verse como una
conversación natural entre NeuroLearn AI
y un niño.
`
                        },

                        {
                            role: "user",

                            content: pregunta
                        }

                    ],

                    temperature: 0.7,

                    max_completion_tokens: 1024

                })

            }

        );


        // ==========================================
        // LEER RESPUESTA DE GROQ
        // ==========================================

        const textoRespuesta =
            await respuestaGroq.text();


        let datos;

        try {

            datos = JSON.parse(textoRespuesta);

        } catch {

            datos = {
                respuesta_cruda: textoRespuesta
            };

        }


        // ==========================================
        // MOSTRAR INFORMACIÓN DEL RESULTADO
        // ==========================================

        console.log(
            "📥 Respuesta de Groq:",
            respuestaGroq.status
        );


        // ==========================================
        // ERROR DE GROQ
        // ==========================================

        if (!respuestaGroq.ok) {

            console.error(
                "❌ ERROR GROQ:",
                respuestaGroq.status
            );

            console.error(
                JSON.stringify(
                    datos,
                    null,
                    2
                )
            );

            return res.status(502).json({

                respuesta:
                    "La inteligencia artificial no pudo responder en este momento."

            });

        }


        // ==========================================
        // OBTENER RESPUESTA
        // ==========================================

        const contenido =
            datos?.choices?.[0]?.message?.content;


        if (!contenido) {

            console.error(
                "❌ Groq no devolvió contenido."
            );

            return res.status(502).json({

                respuesta:
                    "La inteligencia artificial no devolvió una respuesta válida."

            });

        }


        console.log(
            "✅ Groq respondió correctamente."
        );


        // ==========================================
        // ENVIAR RESPUESTA AL CHAT
        // ==========================================

        return res.json({

            respuesta: contenido

        });

    }

    catch (error) {

        console.error(
            "❌ ERROR EN /preguntar:",
            error
        );

        return res.status(500).json({

            respuesta:
                "Ocurrió un error en NeuroLearn AI."

        });

    }

});


// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(

    PORT,

    "0.0.0.0",

    () => {

        console.log("");
        console.log(
            "🧠 NeuroLearn AI iniciado correctamente"
        );

        console.log(
            `🚀 Servidor escuchando en 0.0.0.0:${PORT}`
        );

        console.log("");

    }

);