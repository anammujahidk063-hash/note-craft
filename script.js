/* ==============================
   2 SECOND INTRO
============================== */

window.addEventListener("load", function () {

    const splash = document.getElementById("splashScreen");
    const login = document.getElementById("loginPage");

    setTimeout(function () {

        splash.classList.add("hide");

        login.classList.add("show");

    }, 2000);

});


/* ==============================
   PASSWORD SHOW / HIDE
============================== */

const password = document.getElementById("password");
const eyeButton = document.getElementById("eyeButton");

eyeButton.addEventListener("click", function () {

    if (password.type === "password") {

        password.type = "text";

        eyeButton.textContent = "🙈";

    } else {

        password.type = "password";

        eyeButton.textContent = "👁";

    }

});


/* ==============================
   LOGIN BUTTON
============================== */

const loginButton = document.getElementById("loginButton");

loginButton.addEventListener("click", function () {

    const email = document.getElementById("email").value.trim();
    const passwordValue = password.value.trim();

    if (email === "" || passwordValue === "") {

        alert("Please enter your Email/Username and Password.");

        return;
    }

window.location.href = "dashboard.html";
});


/* ==============================
   CREATE ACCOUNT
============================== */

const registerButton =
    document.getElementById("registerButton");

registerButton.addEventListener("click", function () {

    window.location.href = "register.html";

});


/* ==============================
   FORGOT PASSWORD
============================== */

const forgotPassword =
    document.getElementById("forgotPassword");

forgotPassword.addEventListener("click", function (event) {

    event.preventDefault();

    alert("Password recovery page will open here.");

});