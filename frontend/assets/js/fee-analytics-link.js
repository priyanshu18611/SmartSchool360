/* =========================================================
   SMARTSCHOOL360 — ADVANCED FEE ANALYTICS LINK
   Connects Fees Dashboard to Advanced Fee Analytics
   Built by Priyanshu Kumar
   ========================================================= */

(() => {
    "use strict";


    function createAnalyticsAction() {

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
                "openAdvancedFeeAnalyticsBtn"
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


        button.type =
            "button";


        button.className =
            "quick-action advanced-fee-analytics-action";


        button.id =
            "openAdvancedFeeAnalyticsBtn";


        button.innerHTML = `

            <span class="quick-action-icon">
                📈
            </span>


            <span class="quick-action-content">

                <strong>
                    Advanced Analytics
                </strong>

                <small>
                    Collection trends & insights
                </small>

            </span>


            <span class="quick-action-arrow">
                →
            </span>

        `;


        /*
         * Navigation
         */

        const openAnalytics =
            () => {

                window.location.href =
                    "fee-analytics.html";

            };


        button.addEventListener(
            "click",
            openAnalytics
        );


        /*
         * Mobile touch support
         */

        button.addEventListener(
            "touchend",
            event => {

                event.preventDefault();

                openAnalytics();

            },
            {
                passive: false
            }
        );


        /*
         * Add to Quick Actions
         */

        quickActionsGrid.appendChild(
            button
        );

    }


    /*
     * Initialize
     */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            createAnalyticsAction
        );

    } else {

        createAnalyticsAction();

    }


    console.log(
        "SmartSchool360: Advanced Fee Analytics link ready."
    );

})();
