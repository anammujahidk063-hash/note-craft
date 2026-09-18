const roleCards =
    document.querySelectorAll(".role-card");

roleCards.forEach((card) => {

    card.addEventListener("click", () => {

        const selectedRole =
            card.dataset.role;

        // Remember whether the user selected Student or Admin
        localStorage.setItem(
            "notecraftRole",
            selectedRole
        );

        // Closing animation
        document.body.classList.add(
            "page-exit"
        );

        // Open your existing login page
        setTimeout(() => {

            window.location.href =
                "login.html?role=" +
                selectedRole;

        }, 280);

    });

});