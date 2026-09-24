"use strict";

// One shared listener for existing and newly created buttons.
document.addEventListener(
    "click",
    function (event) {
        if (!(event.target instanceof Element)) {
            return;
        }

        const control = event.target.closest(
            "button, a, input[type='submit'], " +
            "input[type='button'], [role='button'], .role-card"
        );

        if (!control) {
            return;
        }

        if (
            control.matches(":disabled") ||
            control.getAttribute("aria-disabled") === "true"
        ) {
            return;
        }

        if (
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches
        ) {
            return;
        }

        // Restart the effect when clicked again.
        control.classList.remove("nc-click-glow");

        void control.offsetWidth;

        control.classList.add("nc-click-glow");
    },
    true
);

// Clean up after the effect finishes.
document.addEventListener("animationend", function (event) {
    if (event.animationName === "notecraft-glow-focus") {
        event.target.classList.remove("nc-click-glow");
    }
});