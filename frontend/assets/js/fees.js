/* =========================================================
   SmartSchool360
   Fees Management
   File: fees.js

   Storage:
   smartschool_students
   smartschool_fees
   smartschool_fee_payments
   ========================================================= */

(function () {
    "use strict";

    const STUDENTS_KEY = "smartschool_students";
    const FEES_KEY = "smartschool_fees";
    const PAYMENTS_KEY = "smartschool_fee_payments";

    const state = {
        students: [],
        fees: [],
        payments: [],
        filteredFees: []
    };

    const $ = (id) => document.getElementById(id);

    /* =====================================================
       HELPERS
       ===================================================== */

    function text(value) {
        return String(value ?? "").trim();
    }

    function safeJSON(value, fallback) {
        try {
            return JSON.parse(value);
        } catch (error) {
            return fallback;
        }
    }

    function money(value) {
        const amount = Number(value) || 0;

        return "₹" + amount.toLocaleString("en-IN", {
            maximumFractionDigits: 2
        });
    }

    function number(value) {
        const parsed = Number(value);

        return Number.isFinite(parsed)
            ? parsed
            : 0;
    }

    function cleanClass(value) {
        return text(value)
            .replace(/^class\s*/i, "")
            .trim();
    }

    function cleanSection(value) {
        return text(value)
            .replace(/^section\s*/i, "")
            .trim();
    }

    function todayISO() {
        const date = new Date();

        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    }

    function formatDate(value) {
        if (!value) return "—";

        const date = new Date(
            `${value}T00:00:00`
        );

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function getInitials(name) {
        const parts = text(name)
            .split(/\s+/)
            .filter(Boolean);

        if (!parts.length) {
            return "ST";
        }

        if (parts.length === 1) {
            return parts[0]
                .slice(0, 2)
                .toUpperCase();
        }

        return (
            parts[0][0] +
            parts[parts.length - 1][0]
        ).toUpperCase();
    }

    function generateReceiptNumber() {
        const datePart =
            todayISO().replace(/-/g, "");

        const randomPart =
            Math.floor(
                1000 +
                Math.random() * 9000
            );

        return `SSREC-${datePart}-${randomPart}`;
    }

    function generateFeeId() {
        return (
            "FEE-" +
            Date.now() +
            "-" +
            Math.floor(
                Math.random() * 1000
            )
        );
    }

    function generatePaymentId() {
        return (
            "PAY-" +
            Date.now() +
            "-" +
            Math.floor(
                Math.random() * 1000
            )
        );
    }

    /* =====================================================
       TOAST
       ===================================================== */

    function showToast(message) {
        const toast = $("feesToast");

        if (!toast) return;

        toast.textContent = message;

        toast.classList.add("show");

        clearTimeout(
            showToast.timer
        );

        showToast.timer =
            setTimeout(() => {
                toast.classList.remove("show");
            }, 2800);
    }

    /* =====================================================
       LOAD STUDENTS
       ===================================================== */

    function loadStudents() {
        const raw =
            localStorage.getItem(
                STUDENTS_KEY
            );

        if (!raw) {
            state.students = [];
            return;
        }

        const parsed =
            safeJSON(raw, []);

        if (Array.isArray(parsed)) {
            state.students = parsed;
        } else if (
            parsed &&
            Array.isArray(parsed.students)
        ) {
            state.students =
                parsed.students;
        } else {
            state.students = [];
        }
    }

    /* =====================================================
       LOAD FEES
       ===================================================== */

    function loadFees() {
        const raw =
            localStorage.getItem(
                FEES_KEY
            );

        if (!raw) {
            state.fees = [];
            return;
        }

        const parsed =
            safeJSON(raw, []);

        if (Array.isArray(parsed)) {
            state.fees = parsed;
        } else if (
            parsed &&
            Array.isArray(parsed.records)
        ) {
            state.fees =
                parsed.records;
        } else {
            state.fees = [];
        }

        state.fees =
            state.fees.map(
                normalizeFee
            );
    }

    /* =====================================================
       LOAD PAYMENTS
       ===================================================== */

    function loadPayments() {
        const raw =
            localStorage.getItem(
                PAYMENTS_KEY
            );

        if (!raw) {
            state.payments = [];
            return;
        }

        const parsed =
            safeJSON(raw, []);

        if (Array.isArray(parsed)) {
            state.payments =
                parsed;
        } else if (
            parsed &&
            Array.isArray(parsed.payments)
        ) {
            state.payments =
                parsed.payments;
        } else {
            state.payments = [];
        }

        state.payments =
            state.payments.map(
                normalizePayment
            );
    }

    /* =====================================================
       NORMALIZE FEE
       ===================================================== */

    function normalizeFee(fee) {
        const total =
            number(
                fee.totalFee ??
                fee.total ??
                fee.amount ??
                0
            );

        const paid =
            number(
                fee.paidAmount ??
                fee.paid ??
                0
            );

        const due =
            Math.max(
                0,
                total - paid
            );

        let status =
            text(
                fee.status
            ).toLowerCase();

        if (!status) {
            status =
                calculateStatus(
                    total,
                    paid,
                    fee.dueDate
                );
        }

        return {
            id:
                fee.id ||
                generateFeeId(),

            studentId:
                text(
                    fee.studentId
                ),

            totalFee:
                total,

            paidAmount:
                paid,

            dueAmount:
                due,

            status,

            dueDate:
                text(
                    fee.dueDate
                ),

            academicYear:
                text(
                    fee.academicYear
                ),

            feeType:
                text(
                    fee.feeType
                ) ||
                "Annual Fee",

            createdAt:
                fee.createdAt ||
                new Date().toISOString(),

            updatedAt:
                fee.updatedAt ||
                new Date().toISOString()
        };
    }

    /* =====================================================
       NORMALIZE PAYMENT
       ===================================================== */

    function normalizePayment(payment) {
        return {
            id:
                payment.id ||
                generatePaymentId(),

            receiptNumber:
                payment.receiptNumber ||
                generateReceiptNumber(),

            feeId:
                text(
                    payment.feeId
                ),

            studentId:
                text(
                    payment.studentId
                ),

            amount:
                number(
                    payment.amount
                ),

            paymentMethod:
                text(
                    payment.paymentMethod
                ) ||
                "Cash",

            date:
                text(
                    payment.date
                ) ||
                todayISO(),

            note:
                text(
                    payment.note
                ),

            createdAt:
                payment.createdAt ||
                new Date().toISOString()
        };
    }

    /* =====================================================
       SAVE
       ===================================================== */

    function saveFees() {
        localStorage.setItem(
            FEES_KEY,
            JSON.stringify(
                state.fees
            )
        );
    }

    function savePayments() {
        localStorage.setItem(
            PAYMENTS_KEY,
            JSON.stringify(
                state.payments
            )
        );
    }

    /* =====================================================
       STUDENT LOOKUP
       ===================================================== */

    function getStudent(studentId) {
        return state.students.find(
            (student) =>
                text(student.id) ===
                text(studentId)
        );
    }

    function getStudentName(studentId) {
        const student =
            getStudent(studentId);

        return (
            student?.name ||
            student?.fullName ||
            "Unknown Student"
        );
    }

    function getStudentClass(studentId) {
        const student =
            getStudent(studentId);

        return (
            cleanClass(
                student?.className
            ) ||
            "—"
        );
    }

    function getStudentSection(studentId) {
        const student =
            getStudent(studentId);

        return (
            cleanSection(
                student?.section
            ) ||
            "—"
        );
    }

    /* =====================================================
       STATUS
       ===================================================== */

    function calculateStatus(
        total,
        paid,
        dueDate
    ) {
        total = number(total);
        paid = number(paid);

        if (total <= 0) {
            return "pending";
        }

        if (paid >= total) {
            return "paid";
        }

        if (paid > 0) {
            if (
                dueDate &&
                dueDate < todayISO()
            ) {
                return "overdue";
            }

            return "partial";
        }

        if (
            dueDate &&
            dueDate < todayISO()
        ) {
            return "overdue";
        }

        return "pending";
    }

    function refreshFeeStatuses() {
        state.fees =
            state.fees.map(
                (fee) => {
                    const paid =
                        number(
                            fee.paidAmount
                        );

                    const total =
                        number(
                            fee.totalFee
                        );

                    fee.dueAmount =
                        Math.max(
                            0,
                            total - paid
                        );

                    fee.status =
                        calculateStatus(
                            total,
                            paid,
                            fee.dueDate
                        );

                    fee.updatedAt =
                        new Date()
                            .toISOString();

                    return fee;
                }
            );

        saveFees();
    }

    /* =====================================================
       FILTER OPTIONS
       ===================================================== */

    function populateClassOptions() {
        const select =
            $("feeClass");

        if (!select) return;

        const previous =
            select.value;

        const classes =
            new Set();

        state.students.forEach(
            (student) => {
                const value =
                    cleanClass(
                        student.className
                    );

                if (value) {
                    classes.add(value);
                }
            }
        );

        state.fees.forEach(
            (fee) => {
                const value =
                    getStudentClass(
                        fee.studentId
                    );

                if (
                    value &&
                    value !== "—"
                ) {
                    classes.add(value);
                }
            }
        );

        select.innerHTML =
            `<option value="">All Classes</option>`;

        [...classes]
            .sort(
                (a, b) =>
                    a.localeCompare(
                        b,
                        undefined,
                        {
                            numeric: true
                        }
                    )
            )
            .forEach(
                (value) => {
                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        value;

                    option.textContent =
                        `Class ${value}`;

                    select.appendChild(
                        option
                    );
                }
            );

        if (
            [...select.options]
                .some(
                    (option) =>
                        option.value ===
                        previous
                )
        ) {
            select.value =
                previous;
        }
    }

    function populateSectionOptions() {
        const select =
            $("feeSection");

        if (!select) return;

        const previous =
            select.value;

        const sections =
            new Set();

        state.students.forEach(
            (student) => {
                const value =
                    cleanSection(
                        student.section
                    );

                if (value) {
                    sections.add(value);
                }
            }
        );

        state.fees.forEach(
            (fee) => {
                const value =
                    getStudentSection(
                        fee.studentId
                    );

                if (
                    value &&
                    value !== "—"
                ) {
                    sections.add(value);
                }
            }
        );

        select.innerHTML =
            `<option value="">All Sections</option>`;

        [...sections]
            .sort(
                (a, b) =>
                    a.localeCompare(b)
            )
            .forEach(
                (value) => {
                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        value;

                    option.textContent =
                        `Section ${value}`;

                    select.appendChild(
                        option
                    );
                }
            );

        if (
            [...select.options]
                .some(
                    (option) =>
                        option.value ===
                        previous
                )
        ) {
            select.value =
                previous;
        }
    }

    /* =====================================================
       SUMMARY
       ===================================================== */

    function calculateSummary(
        fees
    ) {
        let totalFees = 0;
        let collected = 0;
        let pending = 0;
        let overdue = 0;

        let paymentCount = 0;

        const pendingStudents =
            new Set();

        const overdueStudents =
            new Set();

        fees.forEach(
            (fee) => {
                totalFees +=
                    number(
                        fee.totalFee
                    );

                collected +=
                    number(
                        fee.paidAmount
                    );

                if (
                    fee.dueAmount > 0
                ) {
                    pending +=
                        fee.dueAmount;

                    pendingStudents.add(
                        fee.studentId
                    );
                }

                if (
                    fee.status ===
                    "overdue"
                ) {
                    overdue +=
                        fee.dueAmount;

                    overdueStudents.add(
                        fee.studentId
                    );
                }
            }
        );

        state.payments.forEach(
            (payment) => {
                const belongsToFee =
                    fees.some(
                        (fee) =>
                            fee.id ===
                            payment.feeId
                    );

                if (
                    belongsToFee
                ) {
                    paymentCount++;
                }
            }
        );

        return {
            totalFees,
            collected,
            pending,
            overdue,
            paymentCount,
            pendingStudents:
                pendingStudents.size,
            overdueStudents:
                overdueStudents.size
        };
    }

    function renderSummary() {
        const summary =
            calculateSummary(
                state.filteredFees
            );

        if ($("totalFeesAmount")) {
            $("totalFeesAmount")
                .textContent =
                money(
                    summary.totalFees
                );
        }

        if ($("collectedFeesAmount")) {
            $("collectedFeesAmount")
                .textContent =
                money(
                    summary.collected
                );
        }

        if ($("pendingFeesAmount")) {
            $("pendingFeesAmount")
                .textContent =
                money(
                    summary.pending
                );
        }

        if ($("overdueFeesAmount")) {
            $("overdueFeesAmount")
                .textContent =
                money(
                    summary.overdue
                );
        }

        if ($("collectedFeesCount")) {
            $("collectedFeesCount")
                .textContent =
                `${summary.paymentCount} ${
                    summary.paymentCount === 1
                        ? "payment"
                        : "payments"
                }`;
        }

        if ($("pendingFeesCount")) {
            $("pendingFeesCount")
                .textContent =
                `${summary.pendingStudents} ${
                    summary.pendingStudents === 1
                        ? "student"
                        : "students"
                }`;
        }

        if ($("overdueFeesCount")) {
            $("overdueFeesCount")
                .textContent =
                `${summary.overdueStudents} ${
                    summary.overdueStudents === 1
                        ? "student"
                        : "students"
                }`;
        }
    }

    /* =====================================================
       FILTERING
       ===================================================== */

    function applyFilters() {
        const search =
            text(
                $("feeSearch")?.value
            ).toLowerCase();

        const classValue =
            cleanClass(
                $("feeClass")?.value
            );

        const sectionValue =
            cleanSection(
                $("feeSection")?.value
            );

        const statusValue =
            text(
                $("feeStatus")?.value
            ).toLowerCase();

        state.filteredFees =
            state.fees.filter(
                (fee) => {
                    const name =
                        getStudentName(
                            fee.studentId
                        ).toLowerCase();

                    const id =
                        text(
                            fee.studentId
                        ).toLowerCase();

                    const className =
                        getStudentClass(
                            fee.studentId
                        );

                    const section =
                        getStudentSection(
                            fee.studentId
                        );

                    const matchesSearch =
                        !search ||
                        name.includes(search) ||
                        id.includes(search);

                    const matchesClass =
                        !classValue ||
                        className ===
                        classValue;

                    const matchesSection =
                        !sectionValue ||
                        section ===
                        sectionValue;

                    const matchesStatus =
                        !statusValue ||
                        fee.status ===
                        statusValue;

                    return (
                        matchesSearch &&
                        matchesClass &&
                        matchesSection &&
                        matchesStatus
                    );
                }
            );

        renderAll();
    }

    function clearFilters() {
        if ($("feeSearch")) {
            $("feeSearch").value =
                "";
        }

        if ($("feeClass")) {
            $("feeClass").value =
                "";
        }

        if ($("feeSection")) {
            $("feeSection").value =
                "";
        }

        if ($("feeStatus")) {
            $("feeStatus").value =
                "";
        }

        state.filteredFees =
            state.fees.slice();

        renderAll();

        showToast(
            "Fee filters cleared."
        );
    }

    /* =====================================================
       FEE TABLE
       ===================================================== */

    function renderFeeTable() {
        const body =
            $("feesTableBody");

        if (!body) return;

        body.innerHTML = "";

        const records =
            state.filteredFees;

        if (!records.length) {
            body.innerHTML = `
                <tr>
                    <td
                        colspan="8"
                        class="table-empty"
                    >
                        <div class="empty-icon">
                            💰
                        </div>

                        <h3>
                            No Fee Records
                        </h3>

                        <p>
                            No configured fee records
                            match the current filters.
                            Use Record Payment to configure
                            a student's fee and record payment.
                        </p>
                    </td>
                </tr>
            `;

            updateRecordCount(0);

            return;
        }

        records.forEach(
            (fee) => {
                const student =
                    getStudent(
                        fee.studentId
                    );

                const name =
                    getStudentName(
                        fee.studentId
                    );

                const row =
                    document.createElement(
                        "tr"
                    );

                row.innerHTML = `
                    <td>
                        <div class="fee-student-cell">

                            <div class="fee-student-avatar">
                                ${escapeHTML(
                                    getInitials(name)
                                )}
                            </div>

                            <div>
                                <strong>
                                    ${escapeHTML(name)}
                                </strong>

                                <small>
                                    ${escapeHTML(
                                        fee.studentId
                                    )}
                                </small>
                            </div>

                        </div>
                    </td>

                    <td>
                        Class ${escapeHTML(
                            getStudentClass(
                                fee.studentId
                            )
                        )}
                    </td>

                    <td>
                        Section ${escapeHTML(
                            getStudentSection(
                                fee.studentId
                            )
                        )}
                    </td>

                    <td>
                        <span class="amount">
                            ${money(
                                fee.totalFee
                            )}
                        </span>
                    </td>

                    <td>
                        <span class="amount paid">
                            ${money(
                                fee.paidAmount
                            )}
                        </span>
                    </td>

                    <td>
                        <span class="amount due">
                            ${money(
                                fee.dueAmount
                            )}
                        </span>
                    </td>

                    <td>
                        <span class="fee-status ${escapeHTML(
                            fee.status
                        )}">
                            ${escapeHTML(
                                statusLabel(
                                    fee.status
                                )
                            )}
                        </span>
                    </td>

                    <td>
                        <button
                            type="button"
                            class="table-action"
                            data-fee-action="payment"
                            data-fee-id="${escapeHTML(
                                fee.id
                            )}"
                        >
                            💳 Payment
                        </button>
                    </td>
                `;

                body.appendChild(
                    row
                );
            }
        );

        updateRecordCount(
            records.length
        );
    }

    function statusLabel(status) {
        const labels = {
            paid: "Paid",
            partial: "Partially Paid",
            pending: "Pending",
            overdue: "Overdue"
        };

        return (
            labels[status] ||
            "Pending"
        );
    }

    function updateRecordCount(
        count
    ) {
        if (!$("feeRecordCount")) {
            return;
        }

        $("feeRecordCount")
            .textContent =
            `${count} ${
                count === 1
                    ? "Record"
                    : "Records"
            }`;

        if ($("feeTableSubtitle")) {
            $("feeTableSubtitle")
                .textContent =
                count
                    ? `${count} configured student fee ${
                        count === 1
                            ? "record"
                            : "records"
                    }`
                    : "No configured fee records found.";
        }
    }

    /* =====================================================
       RECENT PAYMENTS
       ===================================================== */

    function renderRecentPayments() {
        const body =
            $("recentPaymentsBody");

        if (!body) return;

        body.innerHTML = "";

        const recent =
            state.payments
                .slice()
                .sort(
                    (a, b) =>
                        (
                            b.createdAt ||
                            ""
                        ).localeCompare(
                            a.createdAt ||
                            ""
                        )
                )
                .slice(0, 10);

        if (!recent.length) {
            body.innerHTML = `
                <tr>
                    <td
                        colspan="6"
                        class="table-empty"
                    >
                        <div class="empty-icon">
                            🧾
                        </div>

                        <h3>
                            No Payments Yet
                        </h3>

                        <p>
                            Recorded fee payments will
                            appear here.
                        </p>
                    </td>
                </tr>
            `;

            return;
        }

        recent.forEach(
            (payment) => {
                const row =
                    document.createElement(
                        "tr"
                    );

                row.innerHTML = `
                    <td>
                        <strong>
                            ${escapeHTML(
                                payment.receiptNumber
                            )}
                        </strong>
                    </td>

                    <td>
                        <div class="fee-student-cell">

                            <div class="fee-student-avatar">
                                ${escapeHTML(
                                    getInitials(
                                        getStudentName(
                                            payment.studentId
                                        )
                                    )
                                )}
                            </div>

                            <div>
                                <strong>
                                    ${escapeHTML(
                                        getStudentName(
                                            payment.studentId
                                        )
                                    )}
                                </strong>

                                <small>
                                    ${escapeHTML(
                                        payment.studentId
                                    )}
                                </small>
                            </div>

                        </div>
                    </td>

                    <td>
                        ${escapeHTML(
                            formatDate(
                                payment.date
                            )
                        )}
                    </td>

                    <td>
                        <span class="amount paid">
                            ${money(
                                payment.amount
                            )}
                        </span>
                    </td>

                    <td>
                        ${escapeHTML(
                            payment.paymentMethod
                        )}
                    </td>

                    <td>
                        <span class="fee-status paid">
                            Paid
                        </span>
                    </td>
                `;

                body.appendChild(
                    row
                );
            }
        );
    }

    /* =====================================================
       MODAL
       ===================================================== */

    function createPaymentModal(
        selectedFeeId = ""
    ) {
        removePaymentModal();

        const modal =
            document.createElement(
                "div"
            );

        modal.id =
            "feePaymentModal";

        modal.className =
            "fee-modal-overlay";

        const fee =
            state.fees.find(
                (item) =>
                    item.id ===
                    selectedFeeId
            );

        const defaultStudent =
            fee?.studentId ||
            "";

        const defaultTotal =
            fee?.totalFee ||
            "";

        const defaultDueDate =
            fee?.dueDate ||
            "";

        modal.innerHTML = `
            <div
                class="fee-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="feeModalTitle"
            >

                <div class="fee-modal-header">

                    <div>
                        <span class="section-eyebrow">
                            FEE PAYMENT
                        </span>

                        <h2 id="feeModalTitle">
                            Record Payment
                        </h2>

                        <p>
                            Configure the student's fee
                            and record an actual payment.
                        </p>
                    </div>

                    <button
                        type="button"
                        class="fee-modal-close"
                        id="closeFeeModalBtn"
                    >
                        ✕
                    </button>

                </div>


                <form
                    id="feePaymentForm"
                    class="fee-modal-form"
                >

                    <div class="fee-modal-field">

                        <label for="modalFeeStudent">
                            Student *
                        </label>

                        <select
                            id="modalFeeStudent"
                            required
                        >

                            <option value="">
                                Select Student
                            </option>

                        </select>

                    </div>


                    <div class="fee-modal-grid">

                        <div class="fee-modal-field">

                            <label for="modalTotalFee">
                                Total Fee *
                            </label>

                            <input
                                type="number"
                                id="modalTotalFee"
                                min="0"
                                step="0.01"
                                value="${escapeHTML(
                                    defaultTotal
                                )}"
                                placeholder="e.g. 25000"
                                required
                            >

                        </div>


                        <div class="fee-modal-field">

                            <label for="modalPaymentAmount">
                                Payment Amount *
                            </label>

                            <input
                                type="number"
                                id="modalPaymentAmount"
                                min="0"
                                step="0.01"
                                placeholder="e.g. 5000"
                                required
                            >

                        </div>

                    </div>


                    <div class="fee-modal-grid">

                        <div class="fee-modal-field">

                            <label for="modalPaymentDate">
                                Payment Date *
                            </label>

                            <input
                                type="date"
                                id="modalPaymentDate"
                                value="${todayISO()}"
                                required
                            >

                        </div>


                        <div class="fee-modal-field">

                            <label for="modalDueDate">
                                Fee Due Date
                            </label>

                            <input
                                type="date"
                                id="modalDueDate"
                                value="${escapeHTML(
                                    defaultDueDate
                                )}"
                            >

                        </div>

                    </div>


                    <div class="fee-modal-field">

                        <label for="modalPaymentMethod">
                            Payment Method *
                        </label>

                        <select
                            id="modalPaymentMethod"
                            required
                        >

                            <option value="Cash">
                                Cash
                            </option>

                            <option value="UPI">
                                UPI
                            </option>

                            <option value="Bank Transfer">
                                Bank Transfer
                            </option>

                            <option value="Card">
                                Card
                            </option>

                            <option value="Cheque">
                                Cheque
                            </option>

                            <option value="Other">
                                Other
                            </option>

                        </select>

                    </div>


                    <div class="fee-modal-field">

                        <label for="modalPaymentNote">
                            Note
                        </label>

                        <textarea
                            id="modalPaymentNote"
                            rows="3"
                            placeholder="Optional payment note..."
                        ></textarea>

                    </div>


                    <div
                        class="fee-modal-summary"
                        id="feeModalSummary"
                    >
                        Enter the fee and payment amount.
                    </div>


                    <div class="fee-modal-actions">

                        <button
                            type="button"
                            class="secondary-btn"
                            id="cancelFeeModalBtn"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            class="primary-btn"
                        >
                            💳 Save Payment
                        </button>

                    </div>

                </form>

            </div>
        `;

        document.body.appendChild(
            modal
        );

        populateModalStudents(
            defaultStudent
        );

        bindModalEvents();

        updateModalSummary();

        setTimeout(() => {
            $("modalFeeStudent")?.focus();
        }, 50);
    }

    function populateModalStudents(
        selectedStudentId
    ) {
        const select =
            $("modalFeeStudent");

        if (!select) return;

        state.students
            .slice()
            .sort(
                (a, b) =>
                    text(a.name).localeCompare(
                        text(b.name)
                    )
            )
            .forEach(
                (student) => {
                    if (!student.id) {
                        return;
                    }

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        student.id;

                    option.textContent =
                        `${student.name || "Unnamed"} — ${student.id}`;

                    select.appendChild(
                        option
                    );
                }
            );

        if (selectedStudentId) {
            select.value =
                selectedStudentId;
        }
    }

    function updateModalSummary() {
        const summary =
            $("feeModalSummary");

        if (!summary) return;

        const total =
            number(
                $("modalTotalFee")
                    ?.value
            );

        const payment =
            number(
                $("modalPaymentAmount")
                    ?.value
            );

        const existingFee =
            state.fees.find(
                (fee) =>
                    fee.studentId ===
                    $("modalFeeStudent")
                        ?.value
            );

        const existingPaid =
            existingFee
                ? number(
                    existingFee.paidAmount
                )
                : 0;

        const newTotal =
            total > 0
                ? total
                : existingFee?.totalFee ||
                  0;

        const newPaid =
            existingPaid +
            payment;

        const due =
            Math.max(
                0,
                newTotal - newPaid
            );

        const status =
            calculateStatus(
                newTotal,
                newPaid,
                $("modalDueDate")
                    ?.value
            );

        summary.innerHTML = `
            <div>
                <span>Total Fee</span>
                <strong>${money(
                    newTotal
                )}</strong>
            </div>

            <div>
                <span>Already Paid</span>
                <strong>${money(
                    existingPaid
                )}</strong>
            </div>

            <div>
                <span>New Payment</span>
                <strong>${money(
                    payment
                )}</strong>
            </div>

            <div>
                <span>Remaining Due</span>
                <strong>${money(
                    due
                )}</strong>
            </div>

            <div class="fee-modal-status">
                Status:
                <b>
                    ${escapeHTML(
                        statusLabel(status)
                    )}
                </b>
            </div>
        `;
    }

    function bindModalEvents() {
        const close =
            $("closeFeeModalBtn");

        const cancel =
            $("cancelFeeModalBtn");

        close?.addEventListener(
            "click",
            removePaymentModal
        );

        cancel?.addEventListener(
            "click",
            removePaymentModal
        );

        const modal =
            $("feePaymentModal");

        modal?.addEventListener(
            "click",
            (event) => {
                if (
                    event.target ===
                    modal
                ) {
                    removePaymentModal();
                }
            }
        );

        [
            "modalFeeStudent",
            "modalTotalFee",
            "modalPaymentAmount",
            "modalDueDate"
        ].forEach(
            (id) => {
                $(id)?.addEventListener(
                    "input",
                    updateModalSummary
                );

                $(id)?.addEventListener(
                    "change",
                    updateModalSummary
                );
            }
        );

        $("feePaymentForm")
            ?.addEventListener(
                "submit",
                handlePaymentSubmit
            );
    }

    function removePaymentModal() {
        const modal =
            $("feePaymentModal");

        if (modal) {
            modal.remove();
        }
    }

    /* =====================================================
       SAVE PAYMENT
       ===================================================== */

    function handlePaymentSubmit(
        event
    ) {
        event.preventDefault();

        const studentId =
            text(
                $("modalFeeStudent")
                    ?.value
            );

        const totalFee =
            number(
                $("modalTotalFee")
                    ?.value
            );

        const amount =
            number(
                $("modalPaymentAmount")
                    ?.value
            );

        const paymentDate =
            text(
                $("modalPaymentDate")
                    ?.value
            );

        const dueDate =
            text(
                $("modalDueDate")
                    ?.value
            );

        const paymentMethod =
            text(
                $("modalPaymentMethod")
                    ?.value
            );

        const note =
            text(
                $("modalPaymentNote")
                    ?.value
            );

        if (!studentId) {
            showToast(
                "Please select a student."
            );

            return;
        }

        if (totalFee <= 0) {
            showToast(
                "Please enter a valid total fee."
            );

            return;
        }

        if (amount <= 0) {
            showToast(
                "Please enter a valid payment amount."
            );

            return;
        }

        if (amount > totalFee) {
            showToast(
                "Payment cannot be greater than the total fee."
            );

            return;
        }

        const student =
            getStudent(
                studentId
            );

        if (!student) {
            showToast(
                "Selected student was not found."
            );

            return;
        }

        let fee =
            state.fees.find(
                (item) =>
                    item.studentId ===
                    studentId
            );

        /*
         * Create fee record if it does
         * not already exist.
         */
        if (!fee) {
            fee = {
                id:
                    generateFeeId(),

                studentId,

                totalFee,

                paidAmount:
                    0,

                dueAmount:
                    totalFee,

                status:
                    "pending",

                dueDate,

                academicYear:
                    "2026-27",

                feeType:
                    "Annual Fee",

                createdAt:
                    new Date()
                        .toISOString(),

                updatedAt:
                    new Date()
                        .toISOString()
            };

            state.fees.push(
                fee
            );
        } else {
            /*
             * Allow fee amount to be
             * updated when recording payment.
             */
            fee.totalFee =
                totalFee;

            if (dueDate) {
                fee.dueDate =
                    dueDate;
            }
        }

        const remainingBefore =
            Math.max(
                0,
                fee.totalFee -
                fee.paidAmount
            );

        if (
            amount >
            remainingBefore
        ) {
            showToast(
                `Maximum remaining due is ${money(
                    remainingBefore
                )}.`
            );

            return;
        }

        fee.paidAmount +=
            amount;

        fee.dueAmount =
            Math.max(
                0,
                fee.totalFee -
                fee.paidAmount
            );

        fee.status =
            calculateStatus(
                fee.totalFee,
                fee.paidAmount,
                fee.dueDate
            );

        fee.updatedAt =
            new Date()
                .toISOString();

        const payment = {
            id:
                generatePaymentId(),

            receiptNumber:
                generateReceiptNumber(),

            feeId:
                fee.id,

            studentId,

            amount,

            paymentMethod,

            date:
                paymentDate ||
                todayISO(),

            note,

            createdAt:
                new Date()
                    .toISOString()
        };

        state.payments.push(
            payment
        );

        saveFees();
        savePayments();

        removePaymentModal();

        refreshData();

        showToast(
            `Payment saved. Receipt ${payment.receiptNumber}`
        );
    }

    /* =====================================================
       PAYMENT FOR EXISTING FEE
       ===================================================== */

    function openPaymentForFee(
        feeId
    ) {
        const fee =
            state.fees.find(
                (item) =>
                    item.id ===
                    feeId
            );

        if (!fee) {
            showToast(
                "Fee record not found."
            );

            return;
        }

        if (
            number(
                fee.dueAmount
            ) <= 0
        ) {
            showToast(
                "This fee is already fully paid."
            );

            return;
        }

        createPaymentModal(
            fee.id
        );
    }

    /* =====================================================
       RECEIPTS
       ===================================================== */

    function viewReceipts() {
        if (!state.payments.length) {
            showToast(
                "No fee receipts available yet."
            );

            return;
        }

        createReceiptsModal();
    }

    function createReceiptsModal() {
        removeGenericModal(
            "feeReceiptsModal"
        );

        const modal =
            document.createElement(
                "div"
            );

        modal.id =
            "feeReceiptsModal";

        modal.className =
            "fee-modal-overlay";

        const receipts =
            state.payments
                .slice()
                .sort(
                    (a, b) =>
                        (
                            b.createdAt ||
                            ""
                        ).localeCompare(
                            a.createdAt ||
                            ""
                        )
                );

        modal.innerHTML = `
            <div class="fee-modal">

                <div class="fee-modal-header">

                    <div>
                        <span class="section-eyebrow">
                            PAYMENT HISTORY
                        </span>

                        <h2>
                            Fee Receipts
                        </h2>

                        <p>
                            Recorded fee payment receipts.
                        </p>
                    </div>

                    <button
                        type="button"
                        class="fee-modal-close"
                        id="closeReceiptsBtn"
                    >
                        ✕
                    </button>

                </div>

                <div class="fee-receipts-list">

                    ${receipts.map(
                        (payment) => `
                            <div class="fee-receipt-item">

                                <div>
                                    <strong>
                                        ${escapeHTML(
                                            payment.receiptNumber
                                        )}
                                    </strong>

                                    <small>
                                        ${escapeHTML(
                                            getStudentName(
                                                payment.studentId
                                            )
                                        )}
                                        ·
                                        ${escapeHTML(
                                            payment.studentId
                                        )}
                                    </small>
                                </div>

                                <div>
                                    <strong class="amount paid">
                                        ${money(
                                            payment.amount
                                        )}
                                    </strong>

                                    <small>
                                        ${escapeHTML(
                                            formatDate(
                                                payment.date
                                            )
                                        )}
                                        ·
                                        ${escapeHTML(
                                            payment.paymentMethod
                                        )}
                                    </small>
                                </div>

                                <button
                                    type="button"
                                    class="table-action"
                                    data-receipt-id="${escapeHTML(
                                        payment.id
                                    )}"
                                >
                                    🧾 Receipt
                                </button>

                            </div>
                        `
                    ).join("")}

                </div>

            </div>
        `;

        document.body.appendChild(
            modal
        );

        $("closeReceiptsBtn")
            ?.addEventListener(
                "click",
                () =>
                    removeGenericModal(
                        "feeReceiptsModal"
                    )
            );

        modal.addEventListener(
            "click",
            (event) => {
                if (
                    event.target ===
                    modal
                ) {
                    removeGenericModal(
                        "feeReceiptsModal"
                    );
                }
            }
        );
    }

    /* =====================================================
       DUES
       ===================================================== */

    function viewDues() {
        const dues =
            state.fees.filter(
                (fee) =>
                    number(
                        fee.dueAmount
                    ) > 0
            );

        if (!dues.length) {
            showToast(
                "No pending fee dues found."
            );

            return;
        }

        createDuesModal(
            dues
        );
    }

    function createDuesModal(
        dues
    ) {
        removeGenericModal(
            "feeDuesModal"
        );

        const modal =
            document.createElement(
                "div"
            );

        modal.id =
            "feeDuesModal";

        modal.className =
            "fee-modal-overlay";

        modal.innerHTML = `
            <div class="fee-modal">

                <div class="fee-modal-header">

                    <div>
                        <span class="section-eyebrow">
                            OUTSTANDING FEES
                        </span>

                        <h2>
                            Pending Dues
                        </h2>

                        <p>
                            Students with remaining fee balances.
                        </p>
                    </div>

                    <button
                        type="button"
                        class="fee-modal-close"
                        id="closeDuesBtn"
                    >
                        ✕
                    </button>

                </div>


                <div class="fee-receipts-list">

                    ${dues.map(
                        (fee) => `
                            <div class="fee-receipt-item">

                                <div>
                                    <strong>
                                        ${escapeHTML(
                                            getStudentName(
                                                fee.studentId
                                            )
                                        )}
                                    </strong>

                                    <small>
                                        ${escapeHTML(
                                            fee.studentId
                                        )}
                                        ·
                                        Class ${escapeHTML(
                                            getStudentClass(
                                                fee.studentId
                                            )
                                        )}
                                        ·
                                        Section ${escapeHTML(
                                            getStudentSection(
                                                fee.studentId
                                            )
                                        )}
                                    </small>
                                </div>

                                <div>
                                    <strong class="amount due">
                                        ${money(
                                            fee.dueAmount
                                        )}
                                    </strong>

                                    <small>
                                        ${escapeHTML(
                                            statusLabel(
                                                fee.status
                                            )
                                        )}
                                    </small>
                                </div>

                                <button
                                    type="button"
                                    class="table-action"
                                    data-due-fee-id="${escapeHTML(
                                        fee.id
                                    )}"
                                >
                                    💳 Pay
                                </button>

                            </div>
                        `
                    ).join("")}

                </div>

            </div>
        `;

        document.body.appendChild(
            modal
        );

        $("closeDuesBtn")
            ?.addEventListener(
                "click",
                () =>
                    removeGenericModal(
                        "feeDuesModal"
                    )
            );

        modal.addEventListener(
            "click",
            (event) => {
                if (
                    event.target ===
                    modal
                ) {
                    removeGenericModal(
                        "feeDuesModal"
                    );
                }
            }
        );
    }

    function removeGenericModal(
        id
    ) {
        const modal =
            $(id);

        if (modal) {
            modal.remove();
        }
    }

    /* =====================================================
       RECEIPT PRINT
       ===================================================== */

    function printReceipt(
        paymentId
    ) {
        const payment =
            state.payments.find(
                (item) =>
                    item.id ===
                    paymentId
            );

        if (!payment) {
            showToast(
                "Receipt not found."
            );

            return;
        }

        const fee =
            state.fees.find(
                (item) =>
                    item.id ===
                    payment.feeId
            );

        const student =
            getStudent(
                payment.studentId
            );

        const receiptWindow =
            window.open(
                "",
                "_blank",
                "width=800,height=900"
            );

        if (!receiptWindow) {
            showToast(
                "Please allow pop-ups to print the receipt."
            );

            return;
        }

        receiptWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>

                <title>
                    Fee Receipt ${escapeHTML(
                        payment.receiptNumber
                    )}
                </title>

                <style>

                    * {
                        box-sizing: border-box;
                    }

                    body {
                        margin: 0;
                        padding: 35px;
                        background: #f5f7fb;
                        color: #111827;
                        font-family:
                            Arial,
                            Helvetica,
                            sans-serif;
                    }

                    .receipt {
                        max-width: 720px;
                        margin: auto;
                        padding: 35px;
                        background: #ffffff;
                        border: 1px solid #e5e7eb;
                    }

                    .brand {
                        display: flex;
                        justify-content: space-between;
                        gap: 20px;
                        padding-bottom: 22px;
                        border-bottom: 2px solid #4f46e5;
                    }

                    .brand h1 {
                        margin: 0;
                        color: #4f46e5;
                        font-size: 25px;
                    }

                    .brand p {
                        margin: 5px 0 0;
                        color: #6b7280;
                        font-size: 12px;
                    }

                    .receipt-title {
                        text-align: right;
                    }

                    .receipt-title h2 {
                        margin: 0;
                        font-size: 18px;
                    }

                    .receipt-title p {
                        margin: 6px 0 0;
                        font-size: 11px;
                        color: #6b7280;
                    }

                    .student {
                        margin-top: 25px;
                        padding: 18px;
                        background: #f8fafc;
                        border-radius: 10px;
                    }

                    .student-grid {
                        display: grid;
                        grid-template-columns:
                            repeat(2, 1fr);
                        gap: 12px;
                    }

                    .label {
                        color: #6b7280;
                        font-size: 10px;
                        margin-bottom: 4px;
                    }

                    .value {
                        font-weight: 700;
                        font-size: 13px;
                    }

                    table {
                        width: 100%;
                        margin-top: 25px;
                        border-collapse: collapse;
                    }

                    th,
                    td {
                        padding: 12px;
                        border-bottom:
                            1px solid #e5e7eb;
                        text-align: left;
                        font-size: 12px;
                    }

                    th {
                        background: #f8fafc;
                        font-size: 10px;
                        text-transform: uppercase;
                    }

                    .total {
                        margin-top: 20px;
                        display: flex;
                        justify-content: flex-end;
                    }

                    .total-box {
                        min-width: 230px;
                        padding: 15px;
                        border-radius: 10px;
                        background: #eef2ff;
                    }

                    .total-row {
                        display: flex;
                        justify-content:
                            space-between;
                        gap: 20px;
                        margin: 6px 0;
                        font-size: 12px;
                    }

                    .grand {
                        margin-top: 10px;
                        padding-top: 10px;
                        border-top:
                            1px solid #c7d2fe;
                        font-size: 17px;
                        font-weight: 800;
                        color: #4f46e5;
                    }

                    .footer {
                        margin-top: 35px;
                        padding-top: 15px;
                        border-top:
                            1px solid #e5e7eb;
                        text-align: center;
                        color: #6b7280;
                        font-size: 10px;
                    }

                    @media print {

                        body {
                            padding: 0;
                            background: #ffffff;
                        }

                        .receipt {
                            border: 0;
                        }

                    }

                </style>

            </head>

            <body>

                <div class="receipt">

                    <div class="brand">

                        <div>
                            <h1>
                                SmartSchool360
                            </h1>

                            <p>
                                School Management System
                            </p>
                        </div>

                        <div class="receipt-title">
                            <h2>
                                FEE RECEIPT
                            </h2>

                            <p>
                                ${escapeHTML(
                                    payment.receiptNumber
                                )}
                            </p>
                        </div>

                    </div>


                    <div class="student">

                        <div class="student-grid">

                            <div>
                                <div class="label">
                                    Student Name
                                </div>

                                <div class="value">
                                    ${escapeHTML(
                                        student?.name ||
                                        "Unknown Student"
                                    )}
                                </div>
                            </div>

                            <div>
                                <div class="label">
                                    Student ID
                                </div>

                                <div class="value">
                                    ${escapeHTML(
                                        payment.studentId
                                    )}
                                </div>
                            </div>

                            <div>
                                <div class="label">
                                    Class
                                </div>

                                <div class="value">
                                    Class ${escapeHTML(
                                        getStudentClass(
                                            payment.studentId
                                        )
                                    )}
                                </div>
                            </div>

                            <div>
                                <div class="label">
                                    Section
                                </div>

                                <div class="value">
                                    Section ${escapeHTML(
                                        getStudentSection(
                                            payment.studentId
                                        )
                                    )}
                                </div>
                            </div>

                        </div>

                    </div>


                    <table>

                        <thead>

                            <tr>
                                <th>
                                    Description
                                </th>

                                <th>
                                    Payment Date
                                </th>

                                <th>
                                    Method
                                </th>

                                <th>
                                    Amount
                                </th>
                            </tr>

                        </thead>

                        <tbody>

                            <tr>

                                <td>
                                    ${escapeHTML(
                                        fee?.feeType ||
                                        "School Fee"
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        formatDate(
                                            payment.date
                                        )
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        payment.paymentMethod
                                    )}
                                </td>

                                <td>
                                    ${money(
                                        payment.amount
                                    )}
                                </td>

                            </tr>

                        </tbody>

                    </table>


                    <div class="total">

                        <div class="total-box">

                            <div class="total-row">
                                <span>
                                    Total Fee
                                </span>

                                <strong>
                                    ${money(
                                        fee?.totalFee ||
                                        payment.amount
                                    )}
                                </strong>
                            </div>

                            <div class="total-row">
                                <span>
                                    Total Paid
                                </span>

                                <strong>
                                    ${money(
                                        fee?.paidAmount ||
                                        payment.amount
                                    )}
                                </strong>
                            </div>

                            <div class="total-row">
                                <span>
                                    Balance Due
                                </span>

                                <strong>
                                    ${money(
                                        fee?.dueAmount ||
                                        0
                                    )}
                                </strong>
                            </div>

                            <div class="total-row grand">
                                <span>
                                    Paid Now
                                </span>

                                <strong>
                                    ${money(
                                        payment.amount
                                    )}
                                </strong>
                            </div>

                        </div>

                    </div>


                    ${
                        payment.note
                            ? `
                                <div
                                    style="
                                        margin-top:20px;
                                        font-size:12px;
                                    "
                                >
                                    <strong>
                                        Note:
                                    </strong>

                                    ${escapeHTML(
                                        payment.note
                                    )}
                                </div>
                            `
                            : ""
                    }


                    <div class="footer">

                        SmartSchool360 ·
                        School Management System

                        <br>

                        © 2026 SmartSchool360 ·
                        Built by Priyanshu Kumar

                    </div>

                </div>


                <script>

                    window.onload = function () {
                        window.print();
                    };

                <\/script>

            </body>
            </html>
        `);

        receiptWindow.document.close();
    }

    /* =====================================================
       REFRESH
       ===================================================== */

    function refreshData() {
        loadStudents();
        loadFees();
        loadPayments();

        refreshFeeStatuses();

        populateClassOptions();
        populateSectionOptions();

        /*
         * Preserve current filters.
         */
        const search =
            $("feeSearch")?.value ||
            "";

        const classValue =
            $("feeClass")?.value ||
            "";

        const sectionValue =
            $("feeSection")?.value ||
            "";

        const statusValue =
            $("feeStatus")?.value ||
            "";

        state.filteredFees =
            state.fees.slice();

        if (search) {
            $("feeSearch").value =
                search;
        }

        if (classValue) {
            $("feeClass").value =
                classValue;
        }

        if (sectionValue) {
            $("feeSection").value =
                sectionValue;
        }

        if (statusValue) {
            $("feeStatus").value =
                statusValue;
        }

        applyFilters();
    }

    /* =====================================================
       RENDER ALL
       ===================================================== */

    function renderAll() {
        renderSummary();

        renderFeeTable();

        renderRecentPayments();
    }

    /* =====================================================
       EVENT DELEGATION
       ===================================================== */

    function setupTableEvents() {
        const body =
            $("feesTableBody");

        body?.addEventListener(
            "click",
            (event) => {
                const button =
                    event.target.closest(
                        "[data-fee-action]"
                    );

                if (!button) return;

                const feeId =
                    button.dataset.feeId;

                if (
                    button.dataset
                        .feeAction ===
                    "payment"
                ) {
                    openPaymentForFee(
                        feeId
                    );
                }
            }
        );
    }

    function setupModalDelegation() {
        document.addEventListener(
            "click",
            (event) => {
                const receiptButton =
                    event.target.closest(
                        "[data-receipt-id]"
                    );

                if (receiptButton) {
                    printReceipt(
                        receiptButton.dataset
                            .receiptId
                    );

                    return;
                }

                const dueButton =
                    event.target.closest(
                        "[data-due-fee-id]"
                    );

                if (dueButton) {
                    const feeId =
                        dueButton.dataset
                            .dueFeeId;

                    removeGenericModal(
                        "feeDuesModal"
                    );

                    openPaymentForFee(
                        feeId
                    );
                }
            }
        );
    }

    /* =====================================================
       TOUCH-SAFE BUTTON BINDING
       ===================================================== */

    function bindButton(
        id,
        handler
    ) {
        const element =
            $(id);

        if (!element) return;

        element.addEventListener(
            "click",
            handler
        );
    }

    /* =====================================================
       NAVIGATION
       ===================================================== */

    function goBack() {
        /*
         * If a dashboard exists at root,
         * return there. Otherwise use browser history.
         */
        if (
            document.referrer &&
            document.referrer.includes(
                "SmartSchool360"
            )
        ) {
            window.history.back();
        } else {
            window.location.href =
                "../index.html";
        }
    }

    /* =====================================================
       INITIALIZE
       ===================================================== */

    function initialize() {
        loadStudents();
        loadFees();
        loadPayments();

        refreshFeeStatuses();

        populateClassOptions();
        populateSectionOptions();

        state.filteredFees =
            state.fees.slice();

        renderAll();

        bindButton(
            "backToDashboardBtn",
            goBack
        );

        bindButton(
            "refreshFeesBtn",
            () => {
                refreshData();

                showToast(
                    "Fee data refreshed."
                );
            }
        );

        bindButton(
            "recordPaymentBtn",
            () => {
                createPaymentModal();
            }
        );

        bindButton(
            "viewReceiptsBtn",
            viewReceipts
        );

        bindButton(
            "viewDuesBtn",
            viewDues
        );

        bindButton(
            "viewAllPaymentsBtn",
            viewReceipts
        );

        bindButton(
            "applyFeeFilterBtn",
            applyFilters
        );

        bindButton(
            "clearFeeFilterBtn",
            clearFilters
        );

        $("feeSearch")
            ?.addEventListener(
                "input",
                applyFilters
            );

        $("feeClass")
            ?.addEventListener(
                "change",
                applyFilters
            );

        $("feeSection")
            ?.addEventListener(
                "change",
                applyFilters
            );

        $("feeStatus")
            ?.addEventListener(
                "change",
                applyFilters
            );

        setupTableEvents();

        setupModalDelegation();

        /*
         * Recalculate if another SmartSchool360
         * page changes localStorage.
         */
        window.addEventListener(
            "storage",
            (event) => {
                if (
                    event.key ===
                        STUDENTS_KEY ||
                    event.key ===
                        FEES_KEY ||
                    event.key ===
                        PAYMENTS_KEY
                ) {
                    refreshData();
                }
            }
        );
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );
    } else {
        initialize();
    }

})();
