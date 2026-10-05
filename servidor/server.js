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
app.use(express.json());


// ==================================================
// CONEXIÓN CON POSTGRESQL
// ==================================================

if (!process.env.DATABASE_URL) {

    console.error(
        "❌ ERROR: DATABASE_URL no está configurada."
    );

}


// Crear conexión con PostgreSQL
const pool = new Pool({

    connectionString:
        process.env.DATABASE_URL,

    ssl: {
        rejectUnauthorized: false
    }

});


// ==================================================
// PROBAR CONEXIÓN CON LA BASE DE DATOS
// ==================================================

async function probarBaseDeDatos() {

    try {

        const resultado =
            await pool.query("SELECT NOW()");

        console.log(
            "✅ PostgreSQL conectado correctamente."
        );

        console.log(
            "🕒 Hora de PostgreSQL:",
            resultado.rows[0].now
        );

    }

    catch (error) {

        console.error(
            "❌ No se pudo conectar con PostgreSQL:"
        );

        console.error(error.message);

    }

}


// ==================================================
// CREAR TABLAS
// ==================================================

async function crearTablas() {

    try {

        // ==========================================
        // TABLA USUARIOS
        // ==========================================

        await pool.query(`

            CREATE TABLE IF NOT EXISTS usuarios (

                id SERIAL PRIMARY KEY,

                nombre VARCHAR(100) NOT NULL,

                edad INTEGER,

                correo VARCHAR(255) UNIQUE NOT NULL,

                password_hash TEXT NOT NULL,

                fecha_registro TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP

            );

        `);


        // ==========================================
        // TABLA PERFILES
        // ==========================================

        await pool.query(`

            CREATE TABLE IF NOT EXISTS perfiles (

                id SERIAL PRIMARY KEY,

                usuario_id INTEGER UNIQUE NOT NULL,

                tipo_aprendizaje VARCHAR(50)
                DEFAULT 'Lectura',

                fecha_actualizacion TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT fk_perfil_usuario

                FOREIGN KEY (usuario_id)

                REFERENCES usuarios(id)

                ON DELETE CASCADE

            );

        `);


        // ==========================================
        // TABLA CONSULTAS
        // ==========================================

        await pool.query(`

            CREATE TABLE IF NOT EXISTS consultas (

                id SERIAL PRIMARY KEY,

                usuario_id INTEGER NOT NULL,

                pregunta TEXT NOT NULL,

                respuesta TEXT NOT NULL,

                tema VARCHAR(100)
                DEFAULT 'General',

                fecha TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT fk_consulta_usuario

                FOREIGN KEY (usuario_id)

                REFERENCES usuarios(id)

                ON DELETE CASCADE

            );

        `);


        // ==========================================
        // TABLA PROGRESO
        // ==========================================

        await pool.query(`

            CREATE TABLE IF NOT EXISTS progreso (

                id SERIAL PRIMARY KEY,

                usuario_id INTEGER UNIQUE NOT NULL,

                preguntas_realizadas INTEGER
                DEFAULT 0,

                temas_estudiados INTEGER
                DEFAULT 0,

                ultima_actividad TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT fk_progreso_usuario

                FOREIGN KEY (usuario_id)

                REFERENCES usuarios(id)

                ON DELETE CASCADE

            );

        `);


        console.log(
            "✅ Tablas de NeuroLearn AI creadas correctamente."
        );

    }

    catch (error) {

        console.error(
            "❌ Error creando las tablas:"
        );

        console.error(error);

    }

}


// ==================================================
// PÁGINA PRINCIPAL
// ==================================================

app.get("/", (req, res) => {

    res.status(200).json({

        ok: true,

        mensaje:
            "🧠 NeuroLearn AI funcionando correctamente"

    });

});


// ==================================================
// HEALTH CHECK
// ==================================================

app.get("/health", async (req, res) => {

    try {

        await pool.query(
            "SELECT 1"
        );

        res.status(200).json({

            ok: true,

            servidor:
                "NeuroLearn AI",

            base_de_datos:
                "PostgreSQL conectada",

            estado:
                "funcionando"

        });

    }

    catch (error) {

        res.status(500).json({

            ok: false,

            servidor:
                "NeuroLearn AI",

            base_de_datos:
                "Error de conexión",

            estado:
                "error"

        });

    }

});


// ==================================================
// REGISTRAR USUARIO
// ==================================================

app.post("/registrar", async (req, res) => {

    try {

        const {

            nombre,
            edad,
            correo,
            contraseña

        } = req.body;


        // ------------------------------------------
        // COMPROBAR DATOS
        // ------------------------------------------

        if (
            !nombre ||
            !correo ||
            !contraseña
        ) {

            return res.status(400).json({

                ok: false,

                mensaje:
                    "Completá todos los campos obligatorios."

            });

        }


        const correoNormalizado =
            String(correo)
                .trim()
                .toLowerCase();


        // ------------------------------------------
        // COMPROBAR SI YA EXISTE
        // ------------------------------------------

        const usuarioExistente =
            await pool.query(

                `

                SELECT id

                FROM usuarios

                WHERE correo = $1

                `,

                [correoNormalizado]

            );


        if (
            usuarioExistente.rows.length > 0
        ) {

            return res.status(409).json({

                ok: false,

                mensaje:
                    "Ese correo electrónico ya está registrado."

            });

        }


        // ------------------------------------------
        // PROTEGER CONTRASEÑA
        // ------------------------------------------

        const passwordHash =
            await bcrypt.hash(
                contraseña,
                10
            );


        // ------------------------------------------
        // CREAR USUARIO
        // ------------------------------------------

        const resultado =
            await pool.query(

                `

                INSERT INTO usuarios
                (
                    nombre,
                    edad,
                    correo,
                    password_hash
                )

                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4
                )

                RETURNING
                    id,
                    nombre,
                    edad,
                    correo,
                    fecha_registro

                `,

                [

                    nombre,

                    edad || null,

                    correoNormalizado,

                    passwordHash

                ]

            );


        const usuario =
            resultado.rows[0];


        // ------------------------------------------
        // CREAR PERFIL
        // ------------------------------------------

        await pool.query(

            `

            INSERT INTO perfiles
            (
                usuario_id,
                tipo_aprendizaje
            )

            VALUES
            (
                $1,
                $2
            )

            `,

            [

                usuario.id,

                "Lectura"

            ]

        );


        // ------------------------------------------
        // CREAR PROGRESO
        // ------------------------------------------

        await pool.query(

            `

            INSERT INTO progreso
            (
                usuario_id
            )

            VALUES
            (
                $1
            )

            `,

            [

                usuario.id

            ]

        );


        console.log(
            "👤 Usuario registrado:",
            usuario.correo
        );


        return res.status(201).json({

            ok: true,

            mensaje:
                "Usuario registrado correctamente.",

            usuario: usuario

        });

    }

    catch (error) {

        console.error(
            "❌ Error registrando usuario:",
            error
        );


        // Correo duplicado
        if (
            error.code === "23505"
        ) {

            return res.status(409).json({

                ok: false,

                mensaje:
                    "Ese correo electrónico ya está registrado."

            });

        }


        return res.status(500).json({

            ok: false,

            mensaje:
                "No se pudo registrar el usuario."

        });

    }

});


// ==================================================
// INICIAR SESIÓN
// ==================================================

app.post("/iniciar-sesion", async (req, res) => {

    try {

        const {

            correo,
            contraseña

        } = req.body;


        if (
            !correo ||
            !contraseña
        ) {

            return res.status(400).json({

                ok: false,

                mensaje:
                    "Ingresá el correo y la contraseña."

            });

        }


        const correoNormalizado =
            String(correo)
                .trim()
                .toLowerCase();


        // ------------------------------------------
        // BUSCAR USUARIO
        // ------------------------------------------

        const resultado =
            await pool.query(

                `

                SELECT

                    id,
                    nombre,
                    edad,
                    correo,
                    password_hash

                FROM usuarios

                WHERE correo = $1

                `,

                [correoNormalizado]

            );


        if (
            resultado.rows.length === 0
        ) {

            return res.status(401).json({

                ok: false,

                mensaje:
                    "Correo o contraseña incorrectos."

            });

        }


        const usuario =
            resultado.rows[0];


        // ------------------------------------------
        // COMPARAR CONTRASEÑA
        // ------------------------------------------

        const contraseñaCorrecta =
            await bcrypt.compare(

                contraseña,

                usuario.password_hash

            );


        if (!contraseñaCorrecta) {

            return res.status(401).json({

                ok: false,

                mensaje:
                    "Correo o contraseña incorrectos."

            });

        }


        console.log(
            "🔐 Inicio de sesión:",
            usuario.correo
        );


        return res.json({

            ok: true,

            mensaje:
                "Inicio de sesión correcto.",

            usuario: {

                id:
                    usuario.id,

                nombre:
                    usuario.nombre,

                edad:
                    usuario.edad,

                correo:
                    usuario.correo

            }

        });

    }

    catch (error) {

        console.error(
            "❌ Error iniciando sesión:",
            error
        );


        return res.status(500).json({

            ok: false,

            mensaje:
                "No se pudo iniciar sesión."

        });

    }

});


// ==================================================
// GUARDAR PREGUNTA Y RESPUESTA DEL CHAT
// ==================================================

app.post("/guardar-consulta", async (req, res) => {

    try {

        const {

            usuarioId,
            pregunta,
            respuesta,
            tema

        } = req.body;


        if (
            !usuarioId ||
            !pregunta ||
            !respuesta
        ) {

            return res.status(400).json({

                ok: false,

                mensaje:
                    "Faltan datos para guardar la consulta."

            });

        }


        // ------------------------------------------
        // GUARDAR CONSULTA
        // ------------------------------------------

        await pool.query(

            `

            INSERT INTO consultas
            (
                usuario_id,
                pregunta,
                respuesta,
                tema
            )

            VALUES
            (
                $1,
                $2,
                $3,
                $4
            )

            `,

            [

                usuarioId,

                pregunta,

                respuesta,

                tema || "General"

            ]

        );


        // ------------------------------------------
        // ACTUALIZAR PROGRESO
        // ------------------------------------------

        await pool.query(

            `

            UPDATE progreso

            SET

                preguntas_realizadas =
                    preguntas_realizadas + 1,

                ultima_actividad =
                    CURRENT_TIMESTAMP

            WHERE usuario_id = $1

            `,

            [

                usuarioId

            ]

        );


        return res.json({

            ok: true,

            mensaje:
                "Consulta guardada correctamente."

        });

    }

    catch (error) {

        console.error(
            "❌ Error guardando consulta:",
            error
        );


        return res.status(500).json({

            ok: false,

            mensaje:
                "No se pudo guardar la consulta."

        });

    }

});


// ==================================================
// OBTENER HISTORIAL DEL USUARIO
// ==================================================

app.get("/historial/:usuarioId", async (req, res) => {

    try {

        const usuarioId =
            Number(
                req.params.usuarioId
            );


        if (
            !usuarioId
        ) {

            return res.status(400).json({

                ok: false,

                mensaje:
                    "ID de usuario inválido."

            });

        }


        const resultado =
            await pool.query(

                `

                SELECT

                    id,
                    pregunta,
                    respuesta,
                    tema,
                    fecha

                FROM consultas

                WHERE usuario_id = $1

                ORDER BY fecha DESC

                `,

                [

                    usuarioId

                ]

            );


        return res.json({

            ok: true,

            consultas:
                resultado.rows

        });

    }

    catch (error) {

        console.error(
            "❌ Error obteniendo historial:",
            error
        );


        return res.status(500).json({

            ok: false,

            mensaje:
                "No se pudo obtener el historial."

        });

    }

});


// ==================================================
// CHAT CON GROQ
// ==================================================

app.post("/preguntar", async (req, res) => {

    try {

        const pregunta =
            String(
                req.body?.pregunta || ""
            ).trim();


        const usuarioId =
            req.body?.usuarioId || null;


        // ------------------------------------------
        // COMPROBAR PREGUNTA
        // ------------------------------------------

        if (!pregunta) {

            return res.status(400).json({

                respuesta:
                    "Escribí una pregunta."

            });

        }


        // ------------------------------------------
        // COMPROBAR API KEY
        // ------------------------------------------

        if (
            !process.env.GROQ_API_KEY
        ) {

            console.error(
                "❌ ERROR: GROQ_API_KEY no está configurada."
            );

            return res.status(500).json({

                respuesta:
                    "El servidor no tiene configurada la clave de inteligencia artificial."

            });

        }


        console.log("");
        console.log(
            "======================================"
        );
        console.log(
            "📤 Enviando pregunta a Groq..."
        );
        console.log(
            "======================================"
        );


        // ==========================================
        // PETICIÓN A GROQ
        // ==========================================

        const respuestaGroq =
            await fetch(

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

                        model:
                            "openai/gpt-oss-20b",

                        messages: [

                            {

                                role:
                                    "system",

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

No pongas palabras entre asteriscos.

Utiliza solamente texto normal,
párrafos, listas simples y emojis.

La respuesta debe verse como una
conversación natural entre NeuroLearn AI
y un niño.

`

                            },

                            {

                                role:
                                    "user",

                                content:
                                    pregunta

                            }

                        ],

                        temperature:
                            0.7,

                        max_completion_tokens:
                            1024

                    })

                }

            );


        // ==========================================
        // LEER RESPUESTA
        // ==========================================

        const textoRespuesta =
            await respuestaGroq.text();


        let datos;

        try {

            datos =
                JSON.parse(
                    textoRespuesta
                );

        }

        catch {

            datos = {

                respuesta_cruda:
                    textoRespuesta

            };

        }


        console.log(
            "📥 Respuesta de Groq:",
            respuestaGroq.status
        );


        // ==========================================
        // ERROR GROQ
        // ==========================================

        if (
            !respuestaGroq.ok
        ) {

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
        // OBTENER CONTENIDO
        // ==========================================

        const contenido =
            datos?.choices?.[0]?.message?.content;


        if (!contenido) {

            return res.status(502).json({

                respuesta:
                    "La inteligencia artificial no devolvió una respuesta válida."

            });

        }


        console.log(
            "✅ Groq respondió correctamente."
        );


        // ==========================================
        // GUARDAR AUTOMÁTICAMENTE
        // SI HAY USUARIO LOGUEADO
        // ==========================================

        if (usuarioId) {

            try {

                await pool.query(

                    `

                    INSERT INTO consultas
                    (
                        usuario_id,
                        pregunta,
                        respuesta,
                        tema
                    )

                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4
                    )

                    `,

                    [

                        usuarioId,

                        pregunta,

                        contenido,

                        "General"

                    ]

                );


                await pool.query(

                    `

                    UPDATE progreso

                    SET

                        preguntas_realizadas =
                            preguntas_realizadas + 1,

                        ultima_actividad =
                            CURRENT_TIMESTAMP

                    WHERE usuario_id = $1

                    `,

                    [

                        usuarioId

                    ]

                );


                console.log(
                    "💾 Consulta guardada en PostgreSQL."
                );

            }

            catch (error) {

                console.error(
                    "⚠️ No se pudo guardar la consulta:",
                    error.message
                );

            }

        }


        // ==========================================
        // ENVIAR RESPUESTA AL CHAT
        // ==========================================

        return res.json({

            respuesta:
                contenido

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


// ==================================================
// INICIAR SERVIDOR
// ==================================================

async function iniciarServidor() {

    await probarBaseDeDatos();

    await crearTablas();


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

}


iniciarServidor();