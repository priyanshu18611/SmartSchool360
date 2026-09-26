/* =========================================================
   SmartSchool360 - Fee Receipt
   File: frontend/assets/js/fee-receipt.js
   ========================================================= */

(function () {
    "use strict";

    const STORAGE = {
        students: "smartschool_students",
        fees: "smartschool_fees",
        payments: "smartschool_fee_payments"
    };

    const $ = (id) => document.getElementById(id);

    function safeParse(value, fallback) {
        try {
            return JSON.parse(value);
        } catch (error) {
            return fallback;
        }
    }

    function readStorage(key, fallback = []) {
        const raw = localStorage.getItem(key);

        if (!raw) {
            return fallback;
        }

        const parsed = safeParse(raw, fallback);

        if (Array.isArray(parsed)) {
            return parsed;
        }

        if (parsed && typeof parsed === "object") {
            if (Array.isArray(parsed.data)) return parsed.data;
            if (Array.isArray(parsed.items)) return parsed.items;
            if (Array.isArray(parsed.records)) return parsed.records;

            return Object.values(parsed);
        }

        return fallback;
    }

    function cleanClass(value) {
        return String(value ?? "")
            .replace(/^class\s*/i, "")
            .trim();
    }

    function cleanSection(value) {
        return String(value ?? "")
            .replace(/^section\s*/i, "")
            .trim();
    }

    function money(value) {
        const amount = Number(value) || 0;

        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }).format(amount);
    }

    function numberValue(value) {
        const amount = Number(value);
        return Number.isFinite(amount) ? amount : 0;
    }

    function formatDate(value) {
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function formatDateTime(value) {
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function getQueryParams() {
        const params = new URLSearchParams(window.location.search);

        return {
            id: params.get("id"),
            receiptNumber: params.get("receiptNumber")
        };
    }

    function getStudentId(student) {
        return String(
            student?.id ??
            student?.studentId ??
            student?.student_id ??
            ""
        ).trim();
    }

    function getStudentName(student) {
        return (
            student?.name ||
            student?.studentName ||
            student?.fullName ||
            "Unknown Student"
        );
    }

    function getFeeStudentId(fee) {
        return String(
            fee?.studentId ??
            fee?.student_id ??
            fee?.student?.id ??
            ""
        ).trim();
    }

    function getPaymentStudentId(payment) {
        return String(
            payment?.studentId ??
            payment?.student_id ??
            payment?.student?.id ??
            ""
        ).trim();
    }

    function getPaymentId(payment) {
        return String(
            payment?.id ??
            payment?.paymentId ??
            payment?.payment_id ??
            ""
        ).trim();
    }

    function getReceiptNumber(payment) {
        return (
            payment?.receiptNumber ||
            payment?.receiptNo ||
            payment?.receipt_number ||
            "—"
        );
    }

    function getPaymentDate(payment) {
        return (
            payment?.date ||
            payment?.paymentDate ||
            payment?.payment_date ||
            payment?.createdAt ||
            payment?.created_at ||
            ""
        );
    }

    function getPaymentMethod(payment) {
        const method =
            payment?.paymentMethod ||
            payment?.method ||
            payment?.payment_mode ||
            "Cash";

        return String(method)
            .replace(/_/g, " ")
            .replace(/\b\w/g, (letter) => letter.toUpperCase());
    }

    function getPaymentNote(payment) {
        return (
            payment?.note ||
            payment?.notes ||
            payment?.remarks ||
            payment?.remark ||
            ""
        );
    }

    function getFeeType(fee) {
        return (
            fee?.feeType ||
            fee?.type ||
            fee?.fee_type ||
            "School Fee"
        );
    }

    function getAcademicYear(student, fee) {
        return (
            fee?.academicYear ||
            fee?.academic_year ||
            student?.session ||
            student?.academicYear ||
            "—"
        );
    }

    function getTotalFee(fee) {
        return numberValue(
            fee?.totalFee ??
            fee?.totalAmount ??
            fee?.amount ??
            fee?.feeAmount ??
            0
        );
    }

    function getPaidAmount(fee) {
        return numberValue(
            fee?.paidAmount ??
            fee?.paid ??
            fee?.amountPaid ??
            0
        );
    }

    function getDueAmount(fee) {
        const directDue = fee?.dueAmount ?? fee?.due ?? fee?.balance;

        if (directDue !== undefined && directDue !== null) {
            return Math.max(0, numberValue(directDue));
        }

        return Math.max(0, getTotalFee(fee) - getPaidAmount(fee));
    }

    function getPaymentAmount(payment) {
        return numberValue(
            payment?.amount ??
            payment?.paidAmount ??
            payment?.paymentAmount ??
            0
        );
    }

    function getInitials(name) {
        const words = String(name || "Student")
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (!words.length) return "ST";

        if (words.length === 1) {
            return words[0].slice(0, 2).toUpperCase();
        }

        return (
            words[0].charAt(0) +
            words[words.length - 1].charAt(0)
        ).toUpperCase();
    }

    function setText(id, value) {
        const element = $(id);

        if (!element) return;

        element.textContent =
            value === undefined ||
            value === null ||
            value === ""
                ? "—"
                : String(value);
    }

    function showToast(message, type = "info") {
        const toast = $("receiptToast");

        if (!toast) return;

        toast.textContent = message;
        toast.className = `receipt-toast show ${type}`;

        clearTimeout(showToast.timer);

        showToast.timer = setTimeout(() => {
            toast.className = "receipt-toast";
        }, 3000);
    }

    function showError(message) {
        const receipt = $("officialReceipt");
        const error = $("receiptError");

        if (receipt) {
            receipt.style.display = "none";
        }

        if (error) {
            error.style.display = "flex";

            const messageElement =
                error.querySelector("[data-error-message]") ||
                error.querySelector(".error-message") ||
                error.querySelector("p");

            if (messageElement) {
                messageElement.textContent = message;
            }
        }

        showToast(message, "error");
    }

    function showReceipt() {
        const receipt = $("officialReceipt");
        const error = $("receiptError");

        if (receipt) {
            receipt.style.display = "";
        }

        if (error) {
            error.style.display = "none";
        }
    }

    function findPayment(payments, query) {
        if (!payments.length) return null;

        if (query.id) {
            const exact = payments.find(
                (payment) =>
                    getPaymentId(payment) === String(query.id).trim()
            );

            if (exact) return exact;
        }

        if (query.receiptNumber) {
            const receiptNumber = String(query.receiptNumber).trim();

            const exact = payments.find(
                (payment) =>
                    String(getReceiptNumber(payment)).trim() ===
                    receiptNumber
            );

            if (exact) return exact;
        }

        return null;
    }

    function findStudent(students, payment, fee) {
        const studentId =
            getPaymentStudentId(payment) ||
            getFeeStudentId(fee);

        if (!studentId) return null;

        return (
            students.find(
                (student) =>
                    getStudentId(student) === studentId
            ) || null
        );
    }

    function findFee(fees, payment, student) {
        const feeId = String(
            payment?.feeId ??
            payment?.fee_id ??
            payment?.fee?.id ??
            ""
        ).trim();

        if (feeId) {
            const byId = fees.find(
                (fee) =>
                    String(
                        fee?.id ??
                        fee?.feeId ??
                        fee?.fee_id ??
                        ""
                    ).trim() === feeId
            );

            if (byId) return byId;
        }

        const studentId =
            getPaymentStudentId(payment) ||
            getStudentId(student);

        if (studentId) {
            const studentFees = fees.filter(
                (fee) => getFeeStudentId(fee) === studentId
            );

            if (studentFees.length === 1) {
                return studentFees[0];
            }

            if (studentFees.length > 1) {
                const latest = [...studentFees].sort(
                    (a, b) =>
                        new Date(
                            b.updatedAt ||
                            b.createdAt ||
                            0
                        ).getTime() -
                        new Date(
                            a.updatedAt ||
                            a.createdAt ||
                            0
                        ).getTime()
                );

                return latest[0];
            }
        }

        return null;
    }

    function renderStudent(student) {
        const name = getStudentName(student);
        const studentId = getStudentId(student);

        setText("receiptStudentName", name);
        setText("receiptStudentId", studentId || "—");
        setText(
            "receiptClass",
            cleanClass(
                student?.className ||
                student?.class ||
                student?.class_name
            ) || "—"
        );
        setText(
            "receiptSection",
            cleanSection(
                student?.section ||
                student?.sectionName
            ) || "—"
        );

        setText(
            "receiptSession",
            student?.session ||
            student?.academicYear ||
            "—"
        );

        const avatar = $("receiptStudentAvatar");

        if (!avatar) return;

        const photo =
            student?.photo ||
            student?.photoUrl ||
            student?.profilePhoto ||
            "";

        if (photo) {
            avatar.innerHTML = "";
            avatar.style.backgroundImage = `url("${String(photo).replace(/"/g, '\\"')}")`;
            avatar.classList.add("has-photo");
            avatar.textContent = "";
        } else {
            avatar.style.backgroundImage = "";
            avatar.classList.remove("has-photo");
            avatar.textContent = getInitials(name);
        }
    }

    function renderPayment(payment, fee, student) {
        const receiptNumber = getReceiptNumber(payment);
        const paymentDate = getPaymentDate(payment);
        const method = getPaymentMethod(payment);
        const amount = getPaymentAmount(payment);
        const note = getPaymentNote(payment);

        const totalFee = fee
            ? getTotalFee(fee)
            : amount;

        const paidBefore =
            fee
                ? Math.max(
                    0,
                    getPaidAmount(fee) - amount
                )
                : 0;

        const totalPaid =
            fee
                ? getPaidAmount(fee)
                : amount;

        const balance =
            fee
                ? getDueAmount(fee)
                : Math.max(
                    0,
                    totalFee - totalPaid
                );

        setText("receiptNumber", receiptNumber);
        setText("paymentDate", formatDate(paymentDate));
        setText("paymentMethod", method);

        setText(
            "receiptFeeType",
            fee ? getFeeType(fee) : "School Fee"
        );

        setText(
            "receiptFeeDescription",
            fee?.description ||
            fee?.remarks ||
            "School fee payment"
        );

        setText("receiptTotalFee", money(totalFee));
        setText("receiptPaidNow", money(amount));
        setText("receiptBalance", money(balance));

        setText("summaryTotal", money(totalFee));
        setText("summaryPaid", money(totalPaid));
        setText("summaryDue", money(balance));
        setText("summaryCurrentPayment", money(amount));

        const statusElement = $("receiptStatus");

        if (statusElement) {
            let status = "Paid";

            if (balance > 0 && totalPaid > 0) {
                status = "Partial";
            } else if (balance > 0 && totalPaid <= 0) {
                status = "Pending";
            }

            statusElement.textContent = status;
            statusElement.className =
                `receipt-status ${status.toLowerCase()}`;
        }

        const noteSection = $("receiptNoteSection");
        const noteElement = $("receiptNote");

        if (note) {
            if (noteSection) {
                noteSection.style.display = "";
            }

            if (noteElement) {
                noteElement.textContent = note;
            }
        } else {
            if (noteSection) {
                noteSection.style.display = "none";
            }
        }

        const generatedElement = $("receiptGeneratedAt");

        if (generatedElement) {
            generatedElement.textContent =
                `Generated: ${formatDateTime(new Date())}`;
        }

        if (student) {
            renderStudent(student);
        }

        // Keep these values available for debugging / future backend integration.
        window.smartSchoolCurrentReceipt = {
            payment,
            fee,
            student,
            amount,
            totalFee,
            paidBefore,
            totalPaid,
            balance
        };
    }

    function loadReceipt() {
        const query = getQueryParams();

        if (!query.id && !query.receiptNumber) {
            showError(
                "Receipt ID is missing. Please open the receipt from the Fees module."
            );
            return;
        }

        const students = readStorage(STORAGE.students, []);
        const fees = readStorage(STORAGE.fees, []);
        const payments = readStorage(STORAGE.payments, []);

        const payment = findPayment(payments, query);

        if (!payment) {
            showError(
                "Receipt not found. The payment may have been removed or is not available on this device."
            );
            return;
        }

        const fee = findFee(fees, payment, null);
        const student = findStudent(students, payment, fee);

        if (!student && !getPaymentStudentId(payment)) {
            showError(
                "Student information for this receipt could not be found."
            );
            return;
        }

        renderPayment(payment, fee, student);
        showReceipt();
    }

    function printReceipt() {
        const receipt = $("officialReceipt");

        if (!receipt || receipt.style.display === "none") {
            showToast("Receipt is not available to print.", "error");
            return;
        }

        window.print();
    }

    function goToFees() {
        window.location.href = "fees.html";
    }

    function goBack() {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            goToFees();
        }
    }

    function bindEvents() {
        const printButtons = [
            $("printReceiptBtn"),
            $("printReceiptBottomBtn")
        ].filter(Boolean);

        printButtons.forEach((button) => {
            button.addEventListener("click", (event) => {
                event.preventDefault();
                printReceipt();
            });
        });

        const backButton = $("backToFeesBtn");

        if (backButton) {
            backButton.addEventListener("click", (event) => {
                event.preventDefault();
                goBack();
            });
        }

        const feesButton = $("goToFeesBtn");

        if (feesButton) {
            feesButton.addEventListener("click", (event) => {
                event.preventDefault();
                goToFees();
            });
        }

        const retryButton = $("retryReceiptBtn");

        if (retryButton) {
            retryButton.addEventListener("click", (event) => {
                event.preventDefault();
                loadReceipt();
            });
        }
    }

    function init() {
        bindEvents();
        loadReceipt();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    window.SmartSchoolFeeReceipt = {
        loadReceipt,
        printReceipt
    };

})();
