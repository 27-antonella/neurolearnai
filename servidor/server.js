
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 10000;

// ==================================================
// CONFIGURACIÓN
// ==================================================

app.use(cors());
app.use(express.json({ limit: "2mb" }));

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no está configurada.");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    connectionTimeoutMillis: 15000
});

// ==================================================
// PROBAR BASE DE DATOS
// ==================================================

async function probarBaseDeDatos() {
    const resultado = await pool.query("SELECT NOW()");

    console.log("✅ PostgreSQL conectado correctamente.");
    console.log("🕒 Hora de PostgreSQL:", resultado.rows[0].now);
}

// ==================================================
// CREAR TABLAS
// ==================================================

async function crearTablas() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            edad INTEGER,
            correo VARCHAR(255) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS perfiles (
            id SERIAL PRIMARY KEY,
            usuario_id INTEGER UNIQUE NOT NULL,
            tipo_aprendizaje VARCHAR(50) DEFAULT 'Lectura',
            fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_perfil_usuario
                FOREIGN KEY (usuario_id)
                REFERENCES usuarios(id)
                ON DELETE CASCADE
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS consultas (
            id SERIAL PRIMARY KEY,
            usuario_id INTEGER NOT NULL,
            pregunta TEXT NOT NULL,
            respuesta TEXT NOT NULL,
            tema VARCHAR(100) DEFAULT 'General',
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_consulta_usuario
                FOREIGN KEY (usuario_id)
                REFERENCES usuarios(id)
                ON DELETE CASCADE
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS progreso (
            id SERIAL PRIMARY KEY,
            usuario_id INTEGER UNIQUE NOT NULL,
            preguntas_realizadas INTEGER DEFAULT 0,
            temas_estudiados INTEGER DEFAULT 0,
            ultima_actividad TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_progreso_usuario
                FOREIGN KEY (usuario_id)
                REFERENCES usuarios(id)
                ON DELETE CASCADE
        );
    `);

    console.log("✅ Tablas de NeuroLearn AI creadas o verificadas.");
}

// ==================================================
// PÁGINA PRINCIPAL
// ==================================================

app.get("/", (req, res) => {
    res.json({
        ok: true,
        mensaje: "🧠 NeuroLearn AI funcionando correctamente"
    });
});

// ==================================================
// HEALTH CHECK
// ==================================================

app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.status(200).json({
            ok: true,
            servidor: "NeuroLearn AI",
            base_de_datos: "PostgreSQL conectada",
            estado: "funcionando"
        });

    } catch (error) {
        console.error("Error en health check:", error.message);

        res.status(500).json({
            ok: false,
            servidor: "NeuroLearn AI",
            base_de_datos: "Error de conexión",
            estado: "error"
        });
    }
});

// ==================================================
// REGISTRAR USUARIO
// ==================================================

app.post("/registrar", async (req, res) => {
    const client = await pool.connect();

    try {
        const { nombre, edad, correo, contraseña } = req.body;

        if (!nombre || !correo || !contraseña) {
            return res.status(400).json({
                ok: false,
                mensaje: "Completá todos los campos obligatorios."
            });
        }

        if (String(contraseña).length < 6) {
            return res.status(400).json({
                ok: false,
                mensaje: "La contraseña debe tener al menos 6 caracteres."
            });
        }

        const nombreNormalizado = String(nombre).trim();
        const correoNormalizado = String(correo).trim().toLowerCase();

        if (!nombreNormalizado || !correoNormalizado) {
            return res.status(400).json({
                ok: false,
                mensaje: "Ingresá un nombre y un correo válidos."
            });
        }

        const usuarioExistente = await client.query(
            "SELECT id FROM usuarios WHERE correo = $1",
            [correoNormalizado]
        );

        if (usuarioExistente.rows.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: "Ese correo electrónico ya está registrado."
            });
        }

        const passwordHash = await bcrypt.hash(contraseña, 10);

        await client.query("BEGIN");

        const resultado = await client.query(
            `INSERT INTO usuarios
                (nombre, edad, correo, password_hash)
             VALUES ($1, $2, $3, $4)
             RETURNING id, nombre, edad, correo, fecha_registro`,
            [
                nombreNormalizado,
                edad ? Number(edad) : null,
                correoNormalizado,
                passwordHash
            ]
        );

        const usuario = resultado.rows[0];

        await client.query(
            `INSERT INTO perfiles (usuario_id, tipo_aprendizaje)
             VALUES ($1, $2)`,
            [usuario.id, "Lectura"]
        );

        await client.query(
            "INSERT INTO progreso (usuario_id) VALUES ($1)",
            [usuario.id]
        );

        await client.query("COMMIT");

        console.log("👤 Usuario registrado:", usuario.correo);

        return res.status(201).json({
            ok: true,
            mensaje: "Usuario registrado correctamente.",
            usuario
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Error registrando usuario:", error.message);

        if (error.code === "23505") {
            return res.status(409).json({
                ok: false,
                mensaje: "Ese correo electrónico ya está registrado."
            });
        }

        return res.status(500).json({
            ok: false,
            mensaje: "No se pudo registrar el usuario."
        });

    } finally {
        client.release();
    }
});

// ==================================================
// INICIAR SESIÓN
// ==================================================

app.post("/iniciar-sesion", async (req, res) => {
    try {
        const { correo, contraseña } = req.body;

        if (!correo || !contraseña) {
            return res.status(400).json({
                ok: false,
                mensaje: "Ingresá el correo y la contraseña."
            });
        }

        const correoNormalizado = String(correo).trim().toLowerCase();

        const resultado = await pool.query(
            `SELECT id, nombre, edad, correo, password_hash
             FROM usuarios
             WHERE correo = $1`,
            [correoNormalizado]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({
                ok: false,
                mensaje: "Correo o contraseña incorrectos."
            });
        }

        const usuario = resultado.rows[0];

        const contraseñaCorrecta = await bcrypt.compare(
            contraseña,
            usuario.password_hash
        );

        if (!contraseñaCorrecta) {
            return res.status(401).json({
                ok: false,
                mensaje: "Correo o contraseña incorrectos."
            });
        }

        console.log("🔐 Inicio de sesión:", usuario.correo);

        return res.json({
            ok: true,
            mensaje: "Inicio de sesión correcto.",
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                edad: usuario.edad,
                correo: usuario.correo
            }
        });

    } catch (error) {
        console.error("Error iniciando sesión:", error.message);

        return res.status(500).json({
            ok: false,
            mensaje: "No se pudo iniciar sesión."
        });
    }
});

// ==================================================
// GUARDAR CONSULTA
// ==================================================

app.post("/guardar-consulta", async (req, res) => {
    try {
        const { usuarioId, pregunta, respuesta, tema } = req.body;

        if (!usuarioId || !pregunta || !respuesta) {
            return res.status(400).json({
                ok: false,
                mensaje: "Faltan datos para guardar la consulta."
            });
        }

        const resultado = await pool.query(
            `INSERT INTO consultas
                (usuario_id, pregunta, respuesta, tema)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [usuarioId, pregunta, respuesta, tema || "General"]
        );

        await pool.query(
            `INSERT INTO progreso
                (usuario_id, preguntas_realizadas, ultima_actividad)
             VALUES ($1, 1, CURRENT_TIMESTAMP)
             ON CONFLICT (usuario_id)
             DO UPDATE SET
                preguntas_realizadas = progreso.preguntas_realizadas + 1,
                ultima_actividad = CURRENT_TIMESTAMP`,
            [usuarioId]
        );

        return res.json({
            ok: true,
            mensaje: "Consulta guardada correctamente.",
            id: resultado.rows[0].id
        });

    } catch (error) {
        console.error("Error guardando consulta:", error.message);

        return res.status(500).json({
            ok: false,
            mensaje: "No se pudo guardar la consulta."
        });
    }
});

// ==================================================
// OBTENER HISTORIAL
// ==================================================

app.get("/historial/:usuarioId", async (req, res) => {
    try {
        const usuarioId = Number(req.params.usuarioId);

        if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
            return res.status(400).json({
                ok: false,
                mensaje: "ID de usuario inválido."
            });
        }

        const resultado = await pool.query(
            `SELECT id, pregunta, respuesta, tema, fecha
             FROM consultas
             WHERE usuario_id = $1
             ORDER BY fecha DESC`,
            [usuarioId]
        );

        return res.json({
            ok: true,
            consultas: resultado.rows
        });

    } catch (error) {
        console.error("Error obteniendo historial:", error.message);

        return res.status(500).json({
            ok: false,
            mensaje: "No se pudo obtener el historial."
        });
    }
});

// ==================================================
// CHAT CON GROQ Y MEMORIA
// ==================================================

app.post("/preguntar", async (req, res) => {
    try {
        const pregunta = String(req.body?.pregunta || "").trim();
        const usuarioId = req.body?.usuarioId || null;

        const historialRecibido = Array.isArray(req.body?.historial)
            ? req.body.historial
            : [];

        if (!pregunta) {
            return res.status(400).json({
                respuesta: "Escribí una pregunta."
            });
        }

        if (!process.env.GROQ_API_KEY) {
            console.error("GROQ_API_KEY no está configurada.");

            return res.status(500).json({
                respuesta: "El servidor no tiene configurada la inteligencia artificial."
            });
        }

        // Filtrar y limitar los mensajes anteriores.
        const historial = historialRecibido
            .filter(mensaje =>
                mensaje &&
                ["user", "assistant"].includes(mensaje.role) &&
                typeof mensaje.content === "string" &&
                mensaje.content.trim() !== ""
            )
            .slice(-12)
            .map(mensaje => ({
                role: mensaje.role,
                content: mensaje.content.slice(0, 4000)
            }));

        console.log("📤 Enviando pregunta a Groq...");
        console.log("🧠 Mensajes de contexto:", historial.length);
        console.log("📚 Historial recibido:", historial);

        const respuestaGroq = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: "openai/gpt-oss-20b",

                    messages: [
                        {
                            role: "system",
                            content: `
Eres NeuroLearn AI, un asistente educativo diseñado para ayudar a niños y adolescentes a aprender.

ESTILO DE RESPUESTA:

- Responde siempre en español.
- Utiliza palabras sencillas y fáciles de comprender.
- Sé amable, paciente y educativo.
- Responde normalmente entre 30 y 60 palabras.
- Ve directamente al punto.
- Evita introducciones largas y repeticiones.
- Divide las explicaciones en párrafos cortos.
- No utilices tablas.
- No agregues curiosidades innecesarias.
- Utiliza ejemplos cotidianos cuando ayuden a comprender.
- Usa emojis con moderación.
- Si el niño pide más detalles, amplía la explicación.
- Si la pregunta es sencilla, responde de forma sencilla.
- Prioriza que el niño comprenda antes que dar demasiada información.

MEMORIA DE CONVERSACIÓN:

- Utiliza los mensajes anteriores para comprender el contexto.
- Recuerda los temas y datos mencionados anteriormente.
- Si el niño pregunta "¿por qué?", "¿cómo?", "¿y eso?" o "¿para qué sirve?", identifica a qué se refiere utilizando el historial.
- Continúa la conversación sin pedirle que repita información que ya proporcionó.
- Relaciona las nuevas preguntas con las explicaciones anteriores cuando corresponda.
- Si el niño cambia de tema, responde al nuevo tema sin confundirlo con el anterior.

FORMATO:

- Escribe en texto natural.
- No utilices HTML.
- No utilices bloques de código salvo que sean necesarios.
- No termines todas las respuestas con preguntas innecesarias.
`
                        },

                        ...historial,

                        {
                            role: "user",
                            content: pregunta
                        }
                    ],

                    temperature: 0.5,
                    max_completion_tokens: 250
                })
            }
        );

        const textoRespuesta = await respuestaGroq.text();

        let datos;

        try {
            datos = JSON.parse(textoRespuesta);
        } catch {
            datos = {};
        }

        if (!respuestaGroq.ok) {
            console.error("Error de Groq:", respuestaGroq.status, datos);

            return res.status(502).json({
                respuesta: "La inteligencia artificial no pudo responder en este momento."
            });
        }

        const contenido = datos?.choices?.[0]?.message?.content;

        if (!contenido) {
            return res.status(502).json({
                respuesta: "La inteligencia artificial no devolvió una respuesta válida."
            });
        }

        console.log("✅ Groq respondió correctamente.");

        // Guardar consulta si hay un usuario identificado.
        if (usuarioId) {
            try {
                await pool.query(
                    `INSERT INTO consultas
                        (usuario_id, pregunta, respuesta, tema)
                     VALUES ($1, $2, $3, $4)`,
                    [usuarioId, pregunta, contenido, "General"]
                );

                await pool.query(
                    `INSERT INTO progreso
                        (usuario_id, preguntas_realizadas, ultima_actividad)
                     VALUES ($1, 1, CURRENT_TIMESTAMP)
                     ON CONFLICT (usuario_id)
                     DO UPDATE SET
                        preguntas_realizadas = progreso.preguntas_realizadas + 1,
                        ultima_actividad = CURRENT_TIMESTAMP`,
                    [usuarioId]
                );

                console.log("💾 Consulta guardada en PostgreSQL.");

            } catch (error) {
                console.error("No se pudo guardar la consulta:", error.message);
            }
        }

        return res.json({
            respuesta: contenido
        });

    } catch (error) {
        console.error("Error en /preguntar:", error.message);

        return res.status(500).json({
            respuesta: "Ocurrió un error en NeuroLearn AI."
        });
    }
});

// ==================================================
// INICIAR SERVIDOR
// ==================================================

async function iniciarServidor() {
    try {
        await probarBaseDeDatos();
        await crearTablas();

        app.listen(PORT, "0.0.0.0", () => {
            console.log("");
            console.log("🧠 NeuroLearn AI iniciado correctamente.");
            console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
            console.log("");
        });

    } catch (error) {
        console.error("❌ No se pudo iniciar NeuroLearn AI:");
        console.error(error.message);
        process.exit(1);
    }
}

iniciarServidor();

// Cerrar correctamente la conexión al detener el servidor.
process.on("SIGTERM", async () => {
    await pool.end();
    process.exit(0);
});
