/*const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

// =========================================
// CONFIGURACIÓN DEL ASISTENTE
// =========================================

/*const PROMPT = `
Eres NeuroLearn AI.

Tu misión es enseñar a niños y adolescentes.

Siempre debes:

- Explicar paso a paso.
- Usar lenguaje sencillo.
- Dar ejemplos fáciles.
- Evitar palabras demasiado técnicas.
- Si la pregunta es matemática, mostrar el procedimiento.
- Si es ciencia, explicar con ejemplos cotidianos.
- Si es historia, resumir claramente.
- Si el usuario no entiende, volver a explicar de otra forma.
- Ser amable y motivador.
- Nunca responder solamente "sí" o "no".
- Mantener respuestas claras, educativas y fáciles de comprender.
`;*/
/*
const PROMPT = `
Eres NeuroLearn AI, un profesor amigable para niños y adolescentes.

Reglas:
- Explica de forma sencilla.
- Usa ejemplos fáciles.
- Si es matemática, muestra los pasos.
- Si es ciencia, explica con ejemplos cotidianos.
- Responde en menos de 200 palabras.
- Usa un tono amable.
`;

// =========================================
// RECIBIR PREGUNTAS
// =========================================

app.post("/preguntar", async (req, res) => {
    console.log("================================");
    console.log("📨 Pregunta recibida:");
    console.log(req.body.pregunta);
    console.log("================================");

    try {

        const pregunta = req.body.pregunta;

        if (!pregunta || pregunta.trim() === "") {

            return res.json({
                respuesta: "Por favor escribe una pregunta."
            });

        }

       /* console.log("🤖 Modelo: Phi-3 Mini");
        const respuestaOllama = await axios.post(
           

           // "http://localhost:11434/api/generate",

     
    {
           

            {

                model: "phi3:mini",
                stream: false,

                prompt: `
${PROMPT}

Pregunta del estudiante:

${pregunta}

Responde únicamente como NeuroLearn AI.
`

            },

            {

                timeout: 300000
                

            }

        );*/

 /*   console.log("1️⃣ Enviando petición a Ollama...");

/*const respuestaOllama = await axios.post(
    "http://127.0.0.1:11434/api/generate",
    {
        model: "phi3:mini",
        stream: false,
        prompt: `${PROMPT}

Pregunta del estudiante:

${pregunta}



Responde únicamente como NeuroLearn AI.
`
    },
    {
        timeout: 300000
    }
);*/
/*const respuestaOllama = await axios({

    method: "post",

    url: "http://127.0.0.1:11434/api/generate",

    timeout: 0,

    headers: {

        "Content-Type": "application/json"

    },

    data: {

        model: "phi3:mini",

        prompt: `${PROMPT}

Pregunta:

${pregunta}`,

        stream: false

    }

});

console.log("2️⃣ Ollama respondió.");

        const respuesta = respuestaOllama.data.response;
       
        console.log("✅ Respuesta recibida");
        console.log(respuesta.substring(0,200));

        res.json({

            respuesta: respuesta

        });

    }

    catch (error) {

        console.error("ERROR OLLAMA:");

        if (error.response) {

            console.error(error.response.data);

        } else {

            console.error(error.message);

        }

        res.status(500).json({

            respuesta:
            "❌ No pude conectarme con la inteligencia artificial. Verifica que Ollama esté abierto."

        });

    }

});

// =========================================
// RUTA PRINCIPAL
// =========================================

app.get("/", (req, res) => {

    res.send(`
        <h2>🚀 NeuroLearn AI</h2>
        <p>Servidor funcionando correctamente.</p>
        <p>Modelo conectado: <b>Phi-3 Mini (Ollama)</b></p>
        `);

});

// =========================================
// INICIAR SERVIDOR
// =========================================

const PORT = 3000;

app.listen(PORT, () => {

    console.clear();

    console.log("========================================");
    console.log("🧠 NeuroLearn AI");
    console.log("========================================");
    console.log("✅ Servidor iniciado correctamente");
    console.log(`🌐 http://localhost:${PORT}`);
    console.log("🤖 Modelo: Phi-3 Mini");
    console.log("========================================");
    console.log("Esperando preguntas...");
    console.log("========================================");

});*/

const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

// =========================================
// CONFIGURACIÓN DE NEUROLEARN AI
// =========================================

const PROMPT = `
Eres NeuroLearn AI, un profesor amigable para niños y adolescentes.

Tu objetivo es ayudar a los estudiantes a aprender.

Reglas:
- Explica de forma sencilla.
- Usa lenguaje fácil de entender.
- Da ejemplos cotidianos.
- Si es matemática, muestra los pasos.
- Si es ciencia, explica de forma clara.
- Si es historia, resume los acontecimientos importantes.
- Si el estudiante no entiende, explica nuevamente de otra manera.
- Sé amable y motivador.
- No uses respuestas innecesariamente largas.
- Responde en un máximo aproximado de 120 palabras.
`;

// =========================================
// RECIBIR PREGUNTA DEL CHAT
// =========================================

app.post("/preguntar", async (req, res) => {

    console.log("========================================");
    console.log("📨 Pregunta recibida:");
    console.log(req.body.pregunta);
    console.log("========================================");

    const pregunta = req.body.pregunta;

    if (!pregunta || pregunta.trim() === "") {

        return res.json({
            respuesta: "Por favor escribe una pregunta."
        });

    }

    try {

        console.log("1️⃣ Enviando petición a Ollama...");

        const respuestaOllama = await axios.post(

            "http://127.0.0.1:11434/api/generate",

            {

                model: "phi3:mini",

                prompt: `
${PROMPT}

Pregunta del estudiante:

${pregunta}

Responde directamente al estudiante como NeuroLearn AI.
`,

                stream: false,

                keep_alive: "5m",

                options: {

                    temperature: 0.4,

                    num_predict: 120

                }

            },

            {

                timeout: 300000

            }

        );

        console.log("2️⃣ Ollama respondió.");

        const respuesta = respuestaOllama.data.response;

        console.log("✅ Respuesta recibida:");
        console.log(respuesta);

        // =========================================
        // ENVIAR RESPUESTA AL CHAT
        // =========================================

        res.json({

            respuesta: respuesta

        });

    }

    catch (error) {

        console.error("========================================");
        console.error("❌ ERROR OLLAMA");
        console.error("========================================");

        if (error.response) {

            console.error("Respuesta de Ollama:");
            console.error(error.response.data);

        }

        else {

            console.error(error.message);

        }

        res.status(500).json({

            respuesta:
                "❌ NeuroLearn AI no pudo obtener una respuesta de Ollama."

        });

    }

});

// =========================================
// COMPROBAR SERVIDOR
// =========================================

app.get("/", (req, res) => {

    res.send(`
        <h2>🚀 NeuroLearn AI</h2>
        <p>Servidor funcionando correctamente.</p>
        <p>Modelo conectado: <b>Phi-3 Mini</b></p>
    `);

});

// =========================================
// INICIAR SERVIDOR
// =========================================

const PORT = 3000;

app.listen(PORT, () => {

    console.clear();

    console.log("========================================");
    console.log("🧠 NeuroLearn AI");
    console.log("========================================");
    console.log("✅ Servidor iniciado correctamente");
    console.log("🌐 http://localhost:3000");
    console.log("🤖 Modelo: Phi-3 Mini");
    console.log("========================================");
    console.log("Esperando preguntas...");
    console.log("========================================");

});