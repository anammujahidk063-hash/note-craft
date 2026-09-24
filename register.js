const registerForm =
    document.getElementById("registerForm");

const studentName =
    document.getElementById("studentName");

const studentEmail =
    document.getElementById("studentEmail");

const studentPassword =
    document.getElementById("studentPassword");

const studentPhone =
    document.getElementById("studentPhone");

const showPassword =
    document.getElementById("showPassword");

const formMessage =
    document.getElementById("formMessage");


// Show or hide password
showPassword.addEventListener("click", function () {

    if (studentPassword.type === "password") {

        studentPassword.type = "text";
        showPassword.textContent = "🙈";

    } else {

        studentPassword.type = "password";
        showPassword.textContent = "👁";

    }

});


// Allow numbers only in phone field
studentPhone.addEventListener("input", function () {

    studentPhone.value =
        studentPhone.value.replace(/\D/g, "");

});


// Register form
registerForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const name =
        studentName.value.trim();

    const email =
        studentEmail.value.trim();

    const password =
        studentPassword.value.trim();

    const phone =
        studentPhone.value.trim();

    formMessage.className = "";
    formMessage.textContent = "";


    // Check student name
    if (name.length < 3) {

        formMessage.textContent =
            "Please enter your complete student name.";

        studentName.focus();

        return;
    }


    // Check email
    if (
        !email.includes("@") ||
        !email.includes(".")
    ) {

        formMessage.textContent =
            "Please enter a valid email ID.";

        studentEmail.focus();

        return;
    }


    // Check password
    if (password.length < 6) {

        formMessage.textContent =
            "Password must contain at least 6 characters.";

        studentPassword.focus();

        return;
    }


    // Check phone number
    if (phone.length !== 10) {

        formMessage.textContent =
            "Phone number must contain exactly 10 digits.";

        studentPhone.focus();

        return;
    }


    // Save only non-sensitive details temporarily
    const studentProfile = {
        name: name,
        email: email,
        phone: phone
    };

    localStorage.setItem(
        "notecraftStudentProfile",
        JSON.stringify(studentProfile)
    );


    // Success message
    formMessage.className = "success";

    formMessage.textContent =
        "Registration successful! Opening login page...";


    // Return to Student login page
    setTimeout(function () {

        window.location.href =
            "login.html?registered=true";

    }, 1500);

});
