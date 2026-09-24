"use strict";

(() => {
    const dialog = document.getElementById("logoutDialog");

    const logoutButton =
        document.getElementById("adminLogoutBtn") ||
        document.getElementById("logoutBtn");

    const cancelButton =
        document.getElementById("cancelLogout");

    const confirmButton =
        document.getElementById("confirmLogout");

    if (
        !dialog ||
        !logoutButton ||
        !cancelButton ||
        !confirmButton
    ) {
        return;
    }

    // Logout button se popup kholo.
    logoutButton.addEventListener("click", function (event) {
        event.preventDefault();

        if (!dialog.open) {
            dialog.showModal();
        }
    });

    // No dabane par dashboard par raho.
    cancelButton.addEventListener("click", function () {
        dialog.close();
    });

    // Yes dabane par logout karke role-selection page kholo.
    confirmButton.addEventListener("click", function () {
        sessionStorage.removeItem("notecraftAdminLoggedIn");
        localStorage.removeItem("notecraftRole");

        window.location.replace("index.html");
    });

    // Popup band hone par focus Logout button par lao.
    dialog.addEventListener("close", function () {
        logoutButton.focus();
    });
})();