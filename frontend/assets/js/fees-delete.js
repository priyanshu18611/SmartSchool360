/* =========================================================
   SmartSchool360 - Fee Record Delete Manager
   File: frontend/assets/js/fees-delete.js

   Safe delete:
   - Confirmation required
   - Removes selected fee record
   - Removes only payments linked to that fee
   - Recalculates stored fee data
   - Refreshes Fees Dashboard
   ========================================================= */

(function () {
    "use strict";

    const STORAGE = {
        fees: "smartschool_fees",
        payments: "smartschool_fee_payments"
    };

    function readArray(key) {
        try {
            const raw = localStorage.getItem(key);

            if (!raw) {
                return [];
            }

            const parsed = JSON.parse(raw);

            if (Array.isArray(parsed)) {
                return parsed;
            }

            if (parsed && Array.isArray(parsed.data)) {
                return parsed.data;
            }

            if (parsed && Array.isArray(parsed.items)) {
                return parsed.items;
            }

            if (parsed && Array.isArray(parsed.records)) {
                return parsed.records;
            }

            return [];
        } catch (error) {
            console.error(
                "SmartSchool360 storage error:",
                error
            );

            return [];
        }
    }


    function saveArray(key, value) {
        localStorage.setItem(
            key,
            JSON.stringify(value)
        );
    }


    function getFeeId(fee) {
        return String(
            fee?.id ??
            fee?.feeId ??
            fee?.fee_id ??
            ""
        ).trim();
    }


    function getStudentId(fee) {
        return String(
            fee?.studentId ??
            fee?.student_id ??
            fee?.student?.id ??
            ""
        ).trim();
    }


    function getFeeType(fee) {
        return String(
            fee?.feeType ??
            fee?.type ??
            fee?.fee_type ??
            "School Fee"
        );
    }


    function getStudentName(fee) {
        const students =
            readArray(
                "smartschool_students"
            );

        const studentId =
            getStudentId(fee);

        const student =
            students.find(
                item =>
                    String(
                        item?.id ??
                        item?.studentId ??
                        item?.student_id ??
                        ""
                    ).trim() ===
                    studentId
            );

        return (
            student?.name ||
            student?.studentName ||
            student?.fullName ||
            "Unknown Student"
        );
    }


    function showDeleteToast(
        message,
        type = "success"
    ) {
        let toast =
            document.getElementById(
                "feesDeleteToast"
            );

        if (!toast) {
            toast =
                document.createElement(
                    "div"
                );

            toast.id =
                "feesDeleteToast";

            toast.style.position =
                "fixed";

            toast.style.left =
                "50%";

            toast.style.bottom =
                "24px";

            toast.style.transform =
                "translateX(-50%)";

            toast.style.zIndex =
                "99999";

            toast.style.padding =
                "12px 17px";

            toast.style.borderRadius =
                "12px";

            toast.style.fontSize =
                "12px";

            toast.style.fontWeight =
                "700";

            toast.style.maxWidth =
                "calc(100% - 30px)";

            toast.style.textAlign =
                "center";

            toast.style.boxShadow =
                "0 12px 30px rgba(0,0,0,.18)";

            document.body.appendChild(
                toast
            );
        }

        toast.textContent =
            message;

        toast.style.background =
            type === "error"
                ? "#fee2e2"
                : "#dcfce7";

        toast.style.color =
            type === "error"
                ? "#b91c1c"
                : "#166534";

        toast.style.opacity =
            "1";

        clearTimeout(
            showDeleteToast.timer
        );

        showDeleteToast.timer =
            setTimeout(() => {
                toast.style.opacity =
                    "0";
            }, 3000);
    }


    function deleteFeeRecord(
        feeId
    ) {
        const fees =
            readArray(
                STORAGE.fees
            );

        const payments =
            readArray(
                STORAGE.payments
            );

        const targetId =
            String(
                feeId || ""
            ).trim();

        if (!targetId) {
            showDeleteToast(
                "Fee record ID is missing.",
                "error"
            );

            return;
        }

        const feeIndex =
            fees.findIndex(
                fee =>
                    getFeeId(fee) ===
                    targetId
            );

        if (feeIndex === -1) {
            showDeleteToast(
                "Fee record not found.",
                "error"
            );

            return;
        }

        const fee =
            fees[feeIndex];

        const studentName =
            getStudentName(fee);

        const feeType =
            getFeeType(fee);

        const linkedPayments =
            payments.filter(
                payment =>
                    String(
                        payment?.feeId ??
                        payment?.fee_id ??
                        ""
                    ).trim() ===
                    targetId
            );

        let warning =
            `Delete fee record?\n\n` +
            `Student: ${studentName}\n` +
            `Fee Type: ${feeType}\n\n`;

        if (
            linkedPayments.length
        ) {
            warning +=
                `This record has ${linkedPayments.length} linked payment(s).\n` +
                `Those linked payment records and receipts will also be removed.\n\n`;
        } else {
            warning +=
                "No linked payment records were found.\n\n";
        }

        warning +=
            "This action cannot be undone.\n\n" +
            "Do you want to continue?";

        const confirmed =
            window.confirm(
                warning
            );

        if (!confirmed) {
            return;
        }

        const updatedFees =
            fees.filter(
                fee =>
                    getFeeId(fee) !==
                    targetId
            );

        const updatedPayments =
            payments.filter(
                payment =>
                    String(
                        payment?.feeId ??
                        payment?.fee_id ??
                        ""
                    ).trim() !==
                    targetId
            );

        saveArray(
            STORAGE.fees,
            updatedFees
        );

        saveArray(
            STORAGE.payments,
            updatedPayments
        );

        showDeleteToast(
            `Fee record for ${studentName} deleted successfully.`
        );

        /*
         * Ask the existing Fees Manager
         * to refresh itself.
         */
        if (
            window.SmartSchoolFees &&
            typeof window.SmartSchoolFees.refresh ===
                "function"
        ) {
            setTimeout(() => {
                window.SmartSchoolFees.refresh();
            }, 150);
        } else {
            setTimeout(() => {
                window.location.reload();
            }, 400);
        }
    }


    function handleAction(
        event
    ) {
        const button =
            event.target.closest(
                '[data-action="delete-fee"]'
            );

        if (!button) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const feeId =
            button.dataset.feeId;

        deleteFeeRecord(
            feeId
        );
    }


    function bindDeleteButtons() {
        document.addEventListener(
            "click",
            handleAction
        );

        document.addEventListener(
            "touchend",
            function (event) {
                const button =
                    event.target.closest(
                        '[data-action="delete-fee"]'
                    );

                if (!button) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();

                const feeId =
                    button.dataset.feeId;

                deleteFeeRecord(
                    feeId
                );
            },
            {
                passive: false
            }
        );
    }


    function init() {
        bindDeleteButtons();

        console.log(
            "SmartSchool360 Fee Delete Manager loaded."
        );
    }


    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            init
        );
    } else {
        init();
    }

})();
