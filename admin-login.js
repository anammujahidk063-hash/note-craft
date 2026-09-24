const adminLoginForm =
    document.getElementById("adminLoginForm");

const adminUsername =
    document.getElementById("adminUsername");

const adminPassword =
    document.getElementById("adminPassword");

const showPassword =
    document.getElementById("showPassword");

const errorMessage =
    document.getElementById("errorMessage");


// Show and hide password
showPassword.addEventListener("click", function () {

    if (adminPassword.type === "password") {

        adminPassword.type = "text";
        showPassword.textContent = "🙈";

    } else {

        adminPassword.type = "password";
        showPassword.textContent = "👁";

    }

});


// Admin login
adminLoginForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const username =
        adminUsername.value.trim();

    const password =
        adminPassword.value.trim();

    errorMessage.textContent = "";


    // Temporary Admin login details
    if (
        username === "admin" &&
        password === "Admin@123"
    ) {

        sessionStorage.setItem(
            "notecraftAdminLoggedIn",
            "true"
        );

        
        window.location.href = "admin-dashboard.html";

    } else {

        errorMessage.textContent =
            "Incorrect Admin username or password.";

    }

});