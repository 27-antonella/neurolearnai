
const API_URL = "https://neurolearnai-1.onrender.com";

const formulario = document.getElementById("formLogin");
const campoCorreo = document.getElementById("correo");
const campoContrasena = document.getElementById("contrasena");
const boton = document.getElementById("btnLogin");
const mensaje = document.getElementById("mensaje");

formulario.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    const correo = campoCorreo.value.trim().toLowerCase();
    const contraseña = campoContrasena.value;

    mensaje.textContent = "";
    mensaje.className = "";

    if (!correo || !contraseña) {
        mensaje.textContent = "Completá el correo y la contraseña.";
        mensaje.className = "error";
        return;
    }

    boton.disabled = true;
    boton.textContent = "Verificando...";

    try {
        const respuesta = await fetch(`${API_URL}/iniciar-sesion`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                correo: correo,
                contraseña: contraseña
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.ok) {
            mensaje.textContent =
                datos.mensaje || "Correo o contraseña incorrectos.";
            mensaje.className = "error";
            return;
        }

        // Guardar únicamente los datos básicos del usuario.
        // No guardar la contraseña en el navegador.
        localStorage.removeItem("password");
        localStorage.removeItem("contraseña");

        localStorage.setItem("usuarioId", String(datos.usuario.id));
        localStorage.setItem("nombre", datos.usuario.nombre);
        localStorage.setItem("correo", datos.usuario.correo);

        if (datos.usuario.edad != null) {
            localStorage.setItem("edad", String(datos.usuario.edad));
        }

        mensaje.textContent = "¡Inicio de sesión correcto! Entrando...";
        mensaje.className = "exito";

        window.location.href = "aprendizaje.html";

    } catch (error) {
        console.error("Error al iniciar sesión:", error);

        mensaje.textContent =
            "No pudimos conectar con el servidor. Intentá nuevamente.";
        mensaje.className = "error";

    } finally {
        boton.disabled = false;
        boton.textContent = "Iniciar sesión";
    }
});
