function guardarPerfil(){

const nombre = document.getElementById("nombre").value;
const edad = document.getElementById("edad").value;
const correo = document.getElementById("correo").value;
const password = document.getElementById("password").value;

if(!nombre || !edad || !correo || !password){

    alert("Completa todos los campos");

    return;
}

localStorage.setItem("nombre", nombre);
localStorage.setItem("edad", edad);
localStorage.setItem("correo", correo);
localStorage.setItem("password", password);

location.href = "aprendizaje.html";
}