/* =========================================================
   SMARTSCHOOL360
   MAIN APPLICATION JAVASCRIPT
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =========================================
       MOBILE SIDEBAR
    ========================================== */

    const menuBtn = document.getElementById("menuBtn");
    const sidebar = document.querySelector(".sidebar");

    if (menuBtn && sidebar) {
        menuBtn.addEventListener("click", () => {
            sidebar.classList.toggle("mobile-open");
        });
    }


    /* =========================================
       SIDEBAR NAVIGATION
    ========================================== */

    const navItems = document.querySelectorAll(".nav-item");

    navItems.forEach((item) => {

        item.addEventListener("click", (event) => {

            event.preventDefault();

            navItems.forEach((nav) => {
                nav.classList.remove("active");
            });

            item.classList.add("active");

            if (window.innerWidth <= 800) {
                sidebar?.classList.remove("mobile-open");
            }

        });

    });


    /* =========================================
       SEARCH SHORTCUT
       CTRL + K
    ========================================== */

    const searchInput =
        document.querySelector(".search-box input");

    document.addEventListener("keydown", (event) => {

        if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "k"
        ) {

            event.preventDefault();

            if (searchInput) {
                searchInput.focus();
            }

        }

    });


    /* =========================================
       SEARCH
    ========================================== */

    if (searchInput) {

        searchInput.addEventListener("input", (event) => {

            const query =
                event.target.value.trim().toLowerCase();

            if (!query) {
                return;
            }

            console.log("Searching:", query);

        });

    }


    /* =========================================
       NOTIFICATION BUTTON
    ========================================== */

    const notificationBtn =
        document.querySelector(".notification-btn");

    if (notificationBtn) {

        notificationBtn.addEventListener("click", () => {

            alert(
                "Notifications module will be connected with the backend soon."
            );

        });

    }


    /* =========================================
       FULLSCREEN
    ========================================== */

    const fullscreenBtn =
        document.querySelector(
            '.icon-btn[title="Fullscreen"]'
        );

    if (fullscreenBtn) {

        fullscreenBtn.addEventListener("click", async () => {

            try {

                if (!document.fullscreenElement) {

                    await document.documentElement.requestFullscreen();

                } else {

                    await document.exitFullscreen();

                }

            } catch (error) {

                console.error(
                    "Fullscreen error:",
                    error
                );

            }

        });

    }


    /* =========================================
       ADD STUDENT BUTTON
    ========================================== */

    const addStudentButtons =
        document.querySelectorAll(
            ".primary-btn, .quick-actions button"
        );

    addStudentButtons.forEach((button) => {

        button.addEventListener("click", () => {

            const text =
                button.innerText.toLowerCase();

            if (text.includes("student")) {

                console.log(
                    "Student module will open here."
                );

            }

        });

    });


    /* =========================================
       EXPORT REPORT
    ========================================== */

    const exportButton =
        document.querySelector(".secondary-btn");

    if (exportButton) {

        exportButton.addEventListener("click", () => {

            alert(
                "Report export module will be connected later."
            );

        });

    }


    /* =========================================
       INITIALIZE
    ========================================== */

    console.log(
        "SmartSchool360 application initialized successfully."
    );

});
