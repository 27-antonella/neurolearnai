
const API_URL = "https://neurolearnai-1.onrender.com";

async function guardarPerfil() {
    const nombre = document.getElementById("nombre").value.trim();
    const edad = document.getElementById("edad").value;
    const correo = document.getElementById("correo").value.trim().toLowerCase();
    const password = document.getElementById("password").value;

    const boton = document.querySelector(".siguiente");

    if (!nombre || !edad || !correo || !password) {
        alert("Completá todos los campos.");
        return;
    }

    if (!Number.isFinite(Number(edad)) || Number(edad) < 1 || Number(edad) > 100) {
        alert("Ingresá una edad válida.");
        return;
    }

    if (password.length < 6) {
        alert("La contraseña debe tener al menos 6 caracteres.");
        return;
    }

    boton.disabled = true;
    boton.textContent = "Registrando...";

    try {
        const respuesta = await fetch(`${API_URL}/registrar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nombre: nombre,
                edad: Number(edad),
                correo: correo,
                contraseña: password
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.ok) {
            alert(datos.mensaje || "No se pudo crear la cuenta.");
            return;
        }

        // Guardar los datos básicos del usuario.
        // Nunca guardar la contraseña en el navegador.
        localStorage.removeItem("password");
        localStorage.removeItem("contraseña");

        localStorage.setItem("usuarioId", String(datos.usuario.id));
        localStorage.setItem("nombre", datos.usuario.nombre);
        localStorage.setItem("edad", String(datos.usuario.edad ?? edad));
        localStorage.setItem("correo", datos.usuario.correo);

        alert("¡Cuenta creada correctamente! Bienvenido a NeuroLearn AI.");

        window.location.href = "aprendizaje.html";

    } catch (error) {
        console.error("Error al registrar:", error);
        alert(
            "No pudimos conectar con el servidor. " +
            "Revisá tu conexión e intentá nuevamente."
        );
    } finally {
        boton.disabled = false;
        boton.textContent = "Continuar →";
    }
}
