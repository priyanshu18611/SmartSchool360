/* =========================================================
   SMARTSCHOOL360 — FEE REPORTS QUICK LINK
   Adds a professional Fee Reports action to Fees Dashboard
   Built by Priyanshu Kumar
   ========================================================= */

(() => {
    "use strict";

    function addFeeReportsAction() {

        const quickActionsGrid =
            document.querySelector(
                ".quick-actions-grid"
            );

        if (!quickActionsGrid) {
            return;
        }


        /*
         * Prevent duplicate button
         */

        if (
            document.getElementById(
                "openFeeReportsBtn"
            )
        ) {
            return;
        }


        /*
         * Create button
         */

        const button =
            document.createElement(
                "button"
            );

        button.type = "button";

        button.className =
            "quick-action fee-reports-action";

        button.id =
            "openFeeReportsBtn";


        button.innerHTML = `
            <span class="quick-action-icon">
                📊
            </span>

            <span class="quick-action-content">

                <strong>
                    Fee Reports
                </strong>

                <small>
                    Analytics, reports & exports
                </small>

            </span>

            <span class="quick-action-arrow">
                →
            </span>
        `;


        /*
         * Open reports page
         */

        const openReports = () => {

            window.location.href =
                "fee-reports.html";
        };


        button.addEventListener(
            "click",
            openReports
        );


        /*
         * Mobile touch support
         */

        button.addEventListener(
            "touchend",
            (event) => {

                event.preventDefault();

                openReports();
            },
            {
                passive: false
            }
        );


        /*
         * Add button after existing
         * quick actions
         */

        quickActionsGrid.appendChild(
            button
        );
    }


    /*
     * Start after DOM is ready
     */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            addFeeReportsAction
        );

    } else {

        addFeeReportsAction();
    }


    console.log(
        "SmartSchool360: Fee Reports quick action ready."
    );

})();
