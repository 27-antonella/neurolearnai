const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());


// ===============================
// INICIO
// ===============================

app.get("/", (req, res) => {
    res.status(200).json({
        ok: true,
        mensaje: "🧠 NeuroLearn AI funcionando correctamente"
    });
});


// ===============================
// SALUD DEL SERVIDOR
// ===============================

app.get("/health", (req, res) => {
    res.status(200).json({
        ok: true,
        servidor: "NeuroLearn AI"
    });
});


// ===============================
// CHAT CON GROQ
// ===============================

app.post("/preguntar", async (req, res) => {

    try {

        const pregunta = String(
            req.body?.pregunta || ""
        ).trim();


        // Verificar pregunta

        if (!pregunta) {

            return res.status(400).json({
                respuesta: "Escribí una pregunta."
            });

        }


        // Verificar API KEY

        if (!process.env.GROQ_API_KEY) {

            console.error(
                "❌ Falta GROQ_API_KEY en Render"
            );

            return res.status(500).json({
                respuesta:
                    "El servidor no tiene configurada la clave de IA."
            });

        }


        console.log(
            "📤 Enviando pregunta a Groq..."
        );


        // ===============================
        // PETICIÓN A GROQ
        // ===============================

        const respuestaGroq = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization":
                        `Bearer ${process.env.GROQ_API_KEY}`
                },

                body: JSON.stringify({

                    model: "openai/gpt-oss-20b",

                    messages: [

                        {
                            role: "system",

                            content:
                                "Eres NeuroLearn AI, " +
                                "un asistente educativo " +
                                "diseñado para niños. " +
                                "Responde siempre en español. " +
                                "Explica las cosas de manera clara, " +
                                "sencilla, amable y divertida. " +
                                "Adapta tus explicaciones para que " +
                                "sean fáciles de comprender."
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


        // Leer respuesta de Groq

        const datos = await respuestaGroq.json();


        console.log(
            "📥 Respuesta de Groq:",
            respuestaGroq.status
        );


        // ===============================
        // ERROR DE GROQ
        // ===============================

        if (!respuestaGroq.ok) {

            console.error(
                "❌ Error Groq:",
                datos
            );

            return res.status(502).json({

                respuesta:
                    "Groq no pudo responder en este momento."

            });

        }


        // ===============================
        // EXTRAER RESPUESTA
        // ===============================

        const contenido =
            datos?.choices?.[0]?.message?.content;


        if (!contenido) {

            console.error(
                "❌ Groq devolvió una respuesta inesperada:",
                datos
            );

            return res.status(502).json({

                respuesta:
                    "La inteligencia artificial no devolvió una respuesta."

            });

        }


        console.log(
            "✅ Groq respondió correctamente"
        );


        // ===============================
        // ENVIAR AL CHAT
        // ===============================

        res.json({

            respuesta: contenido

        });


    } catch (error) {

        console.error(
            "❌ ERROR /preguntar:",
            error
        );

        res.status(500).json({

            respuesta:
                "Ocurrió un error en el servidor."

        });

    }

});


// ===============================
// INICIAR SERVIDOR
// ===============================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `🧠 NeuroLearn AI escuchando en 0.0.0.0:${PORT}`
        );

    }
);