/* =========================================================
   SmartSchool360 - Fees Management
   File: frontend/assets/js/fees.js
   ========================================================= */

(function () {
    "use strict";

    const STORAGE = {
        students: "smartschool_students",
        fees: "smartschool_fees",
        payments: "smartschool_fee_payments"
    };

    const $ = (id) => document.getElementById(id);

    let students = [];
    let fees = [];
    let payments = [];

    let activeFilters = {
        search: "",
        className: "",
        section: "",
        status: ""
    };

    function safeParse(value, fallback) {
        try {
            return JSON.parse(value);
        } catch (error) {
            return fallback;
        }
    }

    function readStorage(key, fallback = []) {
        const raw = localStorage.getItem(key);

        if (!raw) return fallback;

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

    function writeStorage(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function numberValue(value) {
        const number = Number(value);
        return Number.isFinite(number) ? number : 0;
    }

    function money(value) {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }).format(numberValue(value));
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

    function studentId(student) {
        return String(
            student?.id ??
            student?.studentId ??
            student?.student_id ??
            ""
        ).trim();
    }

    function studentName(student) {
        return (
            student?.name ||
            student?.studentName ||
            student?.fullName ||
            "Unknown Student"
        );
    }

    function feeStudentId(fee) {
        return String(
            fee?.studentId ??
            fee?.student_id ??
            fee?.student?.id ??
            ""
        ).trim();
    }

    function paymentStudentId(payment) {
        return String(
            payment?.studentId ??
            payment?.student_id ??
            payment?.student?.id ??
            ""
        ).trim();
    }

    function paymentId(payment) {
        return String(
            payment?.id ??
            payment?.paymentId ??
            payment?.payment_id ??
            ""
        ).trim();
    }

    function feeId(fee) {
        return String(
            fee?.id ??
            fee?.feeId ??
            fee?.fee_id ??
            ""
        ).trim();
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
        const directDue =
            fee?.dueAmount ??
            fee?.due ??
            fee?.balance;

        if (
            directDue !== undefined &&
            directDue !== null
        ) {
            return Math.max(
                0,
                numberValue(directDue)
            );
        }

        return Math.max(
            0,
            getTotalFee(fee) - getPaidAmount(fee)
        );
    }

    function getDueDate(fee) {
        return (
            fee?.dueDate ||
            fee?.due_date ||
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

    function getAcademicYear(fee, student) {
        return (
            fee?.academicYear ||
            fee?.academic_year ||
            student?.session ||
            "—"
        );
    }

    function calculateStatus(fee) {
        const total = getTotalFee(fee);
        const paid = getPaidAmount(fee);
        const due = getDueAmount(fee);
        const dueDate = getDueDate(fee);

        if (total <= 0) {
            return "pending";
        }

        if (due <= 0 || paid >= total) {
            return "paid";
        }

        if (paid > 0) {
            if (
                dueDate &&
                new Date(dueDate).getTime() <
                    new Date().setHours(0, 0, 0, 0)
            ) {
                return "overdue";
            }

            return "partial";
        }

        if (
            dueDate &&
            new Date(dueDate).getTime() <
                new Date().setHours(0, 0, 0, 0)
        ) {
            return "overdue";
        }

        return "pending";
    }

    function statusLabel(status) {
        const labels = {
            paid: "Paid",
            partial: "Partial",
            pending: "Pending",
            overdue: "Overdue"
        };

        return labels[status] || "Pending";
    }

    function getStudent(studentIdValue) {
        return students.find(
            (student) =>
                studentId(student) ===
                String(studentIdValue).trim()
        );
    }

    function getFee(feeIdValue) {
        return fees.find(
            (fee) =>
                feeId(fee) ===
                String(feeIdValue).trim()
        );
    }

    function showToast(message, type = "info") {
        const toast = $("feesToast");

        if (!toast) return;

        toast.textContent = message;
        toast.className = `fees-toast show ${type}`;

        clearTimeout(showToast.timer);

        showToast.timer = setTimeout(() => {
            toast.className = "fees-toast";
        }, 3000);
    }

    function populateClassFilter() {
        const select = $("feeClass");

        if (!select) return;

        const current = select.value;

        const classes = [
            ...new Set(
                students
                    .map((student) =>
                        cleanClass(
                            student?.className ||
                            student?.class
                        )
                    )
                    .filter(Boolean)
            )
        ].sort((a, b) =>
            a.localeCompare(b, undefined, {
                numeric: true
            })
        );

        select.innerHTML =
            `<option value="">All Classes</option>` +
            classes
                .map(
                    (value) =>
                        `<option value="${escapeHtml(value)}">${escapeHtml(
                            value
                        )}</option>`
                )
                .join("");

        if (classes.includes(current)) {
            select.value = current;
        }
    }

    function populateSectionFilter() {
        const select = $("feeSection");

        if (!select) return;

        const selectedClass =
            $("feeClass")?.value || "";

        const current = select.value;

        const sections = [
            ...new Set(
                students
                    .filter((student) => {
                        if (!selectedClass) return true;

                        return (
                            cleanClass(
                                student?.className ||
                                student?.class
                            ) === selectedClass
                        );
                    })
                    .map((student) =>
                        cleanSection(
                            student?.section ||
                            student?.sectionName
                        )
                    )
                    .filter(Boolean)
            )
        ].sort();

        select.innerHTML =
            `<option value="">All Sections</option>` +
            sections
                .map(
                    (value) =>
                        `<option value="${escapeHtml(value)}">${escapeHtml(
                            value
                        )}</option>`
                )
                .join("");

        if (sections.includes(current)) {
            select.value = current;
        }
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function matchesFilters(fee, student) {
        const search =
            activeFilters.search.toLowerCase();

        const className = cleanClass(
            student?.className ||
            student?.class
        );

        const section = cleanSection(
            student?.section ||
            student?.sectionName
        );

        const status = calculateStatus(fee);

        if (search) {
            const searchable = [
                studentName(student),
                studentId(student),
                getFeeType(fee),
                feeId(fee)
            ]
                .join(" ")
                .toLowerCase();

            if (!searchable.includes(search)) {
                return false;
            }
        }

        if (
            activeFilters.className &&
            className !== activeFilters.className
        ) {
            return false;
        }

        if (
            activeFilters.section &&
            section !== activeFilters.section
        ) {
            return false;
        }

        if (
            activeFilters.status &&
            status !== activeFilters.status
        ) {
            return false;
        }

        return true;
    }

    function getFilteredFees() {
        return fees.filter((fee) => {
            const student =
                getStudent(feeStudentId(fee));

            return matchesFilters(
                fee,
                student
            );
        });
    }

    function renderKPIs() {
        const total = fees.reduce(
            (sum, fee) =>
                sum + getTotalFee(fee),
            0
        );

        const collected = fees.reduce(
            (sum, fee) =>
                sum + getPaidAmount(fee),
            0
        );

        const pending = fees.reduce(
            (sum, fee) => {
                const status =
                    calculateStatus(fee);

                return (
                    sum +
                    (
                        status === "pending" ||
                        status === "partial"
                            ? getDueAmount(fee)
                            : 0
                    )
                );
            },
            0
        );

        const overdue = fees.reduce(
            (sum, fee) =>
                sum +
                (
                    calculateStatus(fee) ===
                    "overdue"
                        ? getDueAmount(fee)
                        : 0
                ),
            0
        );

        const collectedCount = fees.filter(
            (fee) =>
                getPaidAmount(fee) > 0
        ).length;

        const pendingCount = fees.filter(
            (fee) =>
                calculateStatus(fee) ===
                    "pending" ||
                calculateStatus(fee) ===
                    "partial"
        ).length;

        const overdueCount = fees.filter(
            (fee) =>
                calculateStatus(fee) ===
                "overdue"
        ).length;

        setText(
            "totalFeesAmount",
            money(total)
        );

        setText(
            "collectedFeesAmount",
            money(collected)
        );

        setText(
            "collectedFeesCount",
            `${collectedCount} payment record${
                collectedCount === 1 ? "" : "s"
            }`
        );

        setText(
            "pendingFeesAmount",
            money(pending)
        );

        setText(
            "pendingFeesCount",
            `${pendingCount} due record${
                pendingCount === 1 ? "" : "s"
            }`
        );

        setText(
            "overdueFeesAmount",
            money(overdue)
        );

        setText(
            "overdueFeesCount",
            `${overdueCount} overdue record${
                overdueCount === 1 ? "" : "s"
            }`
        );
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

    function renderFeesTable() {
        const body = $("feesTableBody");

        if (!body) return;

        const filtered = getFilteredFees();

        setText(
            "feeRecordCount",
            `${filtered.length} record${
                filtered.length === 1
                    ? ""
                    : "s"
            }`
        );

        setText(
            "feeTableSubtitle",
            filtered.length
                ? "Fee records matching the selected filters."
                : "No fee records match the selected filters."
        );

        if (!filtered.length) {
            body.innerHTML = `
                <tr>
                    <td colspan="9">
                        <div class="fees-empty-state">
                            <div class="empty-icon">💰</div>
                            <h3>No fee records found</h3>
                            <p>
                                Record a payment or adjust your filters
                                to see fee information.
                            </p>
                        </div>
                    </td>
                </tr>
            `;

            return;
        }

        body.innerHTML = filtered
            .map((fee) => {
                const student =
                    getStudent(
                        feeStudentId(fee)
                    );

                const status =
                    calculateStatus(fee);

                const total =
                    getTotalFee(fee);

                const paid =
                    getPaidAmount(fee);

                const due =
                    getDueAmount(fee);

                const photo =
                    student?.photo ||
                    student?.photoUrl ||
                    "";

                const avatar = photo
                    ? `
                        <img
                            src="${escapeHtml(photo)}"
                            alt="${escapeHtml(
                                studentName(student)
                            )}"
                            class="fee-avatar"
                        >
                    `
                    : `
                        <div class="fee-avatar fee-avatar-initials">
                            ${escapeHtml(
                                getInitials(
                                    studentName(student)
                                )
                            )}
                        </div>
                    `;

                return `
                    <tr>
                        <td>
                            <div class="fee-student-cell">
                                ${avatar}
                                <div>
                                    <strong>
                                        ${escapeHtml(
                                            studentName(student)
                                        )}
                                    </strong>
                                    <span>
                                        ${escapeHtml(
                                            studentId(student) ||
                                            feeStudentId(fee)
                                        )}
                                    </span>
                                </div>
                            </div>
                        </td>

                        <td>
                            ${escapeHtml(
                                cleanClass(
                                    student?.className ||
                                    student?.class
                                ) || "—"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                cleanSection(
                                    student?.section ||
                                    student?.sectionName
                                ) || "—"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                getFeeType(fee)
                            )}
                        </td>

                        <td>
                            <strong>
                                ${money(total)}
                            </strong>
                        </td>

                        <td>
                            ${money(paid)}
                        </td>

                        <td>
                            <strong>
                                ${money(due)}
                            </strong>
                        </td>

                        <td>
                            <span class="fee-status ${status}">
                                ${statusLabel(status)}
                            </span>
                        </td>

                        <td>
                            <button
                                type="button"
                                class="fee-action-btn"
                                data-action="open-payment"
                                data-fee-id="${escapeHtml(
                                    feeId(fee)
                                )}"
                            >
                                💳 Payment
                            </button>
                        </td>
                    </tr>
                `;
            })
            .join("");
    }

    function getRecentPayments() {
        return [...payments]
            .sort(
                (a, b) =>
                    new Date(
                        b.date ||
                        b.createdAt ||
                        0
                    ).getTime() -
                    new Date(
                        a.date ||
                        a.createdAt ||
                        0
                    ).getTime()
            )
            .slice(0, 10);
    }

    function renderRecentPayments() {
        const body = $("recentPaymentsBody");

        if (!body) return;

        const recent =
            getRecentPayments();

        if (!recent.length) {
            body.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="fees-empty-state compact">
                            <div class="empty-icon">🧾</div>
                            <h3>No payments yet</h3>
                            <p>
                                Recorded payments will appear here.
                            </p>
                        </div>
                    </td>
                </tr>
            `;

            return;
        }

        body.innerHTML = recent
            .map((payment) => {
                const student =
                    getStudent(
                        paymentStudentId(payment)
                    );

                const fee =
                    getFee(
                        payment?.feeId ||
                        payment?.fee_id
                    );

                return `
                    <tr>
                        <td>
                            <strong>
                                ${escapeHtml(
                                    payment.receiptNumber ||
                                    payment.receiptNo ||
                                    "—"
                                )}
                            </strong>
                        </td>

                        <td>
                            ${escapeHtml(
                                studentName(student)
                            )}
                        </td>

                        <td>
                            ${money(
                                payment.amount
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                formatPaymentMethod(
                                    payment
                                )
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                formatDate(
                                    payment.date ||
                                    payment.paymentDate ||
                                    payment.createdAt
                                )
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                fee
                                    ? getFeeType(fee)
                                    : "School Fee"
                            )}
                        </td>

                        <td>
                            <button
                                type="button"
                                class="fee-action-btn secondary"
                                data-action="open-receipt"
                                data-payment-id="${escapeHtml(
                                    paymentId(payment)
                                )}"
                            >
                                🧾 Receipt
                            </button>
                        </td>
                    </tr>
                `;
            })
            .join("");
    }

    function formatPaymentMethod(payment) {
        return String(
            payment?.paymentMethod ||
            payment?.method ||
            "Cash"
        )
            .replace(/_/g, " ")
            .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
            );
    }

    function getInitials(name) {
        const words = String(
            name || "Student"
        )
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (!words.length) return "ST";

        if (words.length === 1) {
            return words[0]
                .slice(0, 2)
                .toUpperCase();
        }

        return (
            words[0].charAt(0) +
            words[words.length - 1].charAt(0)
        ).toUpperCase();
    }

    function createReceiptNumber() {
        const date = new Date();

        const datePart =
            date.getFullYear().toString() +
            String(
                date.getMonth() + 1
            ).padStart(2, "0") +
            String(
                date.getDate()
            ).padStart(2, "0");

        const randomPart =
            Math.floor(
                1000 +
                Math.random() * 9000
            );

        return `SS-RCP-${datePart}-${randomPart}`;
    }

    function createId(prefix) {
        return (
            prefix +
            "_" +
            Date.now().toString(36) +
            "_" +
            Math.random()
                .toString(36)
                .slice(2, 8)
        );
    }

    function openPaymentModal(fee) {
        const modal = $("feePaymentModal");

        if (!modal) {
            showToast(
                "Payment modal is not available.",
                "error"
            );
            return;
        }

        const student =
            getStudent(
                feeStudentId(fee)
            );

        const total =
            getTotalFee(fee);

        const paid =
            getPaidAmount(fee);

        const due =
            getDueAmount(fee);

        const feeIdInput =
            $("paymentFeeId");

        const studentIdInput =
            $("paymentStudentId");

        if (feeIdInput) {
            feeIdInput.value =
                feeId(fee);
        }

        if (studentIdInput) {
            studentIdInput.value =
                feeStudentId(fee);
        }

        setText(
            "paymentStudentName",
            studentName(student)
        );

        setText(
            "paymentStudentIdDisplay",
            studentId(student)
        );

        setText(
            "paymentFeeType",
            getFeeType(fee)
        );

        setText(
            "paymentTotalFee",
            money(total)
        );

        setText(
            "paymentAlreadyPaid",
            money(paid)
        );

        setText(
            "paymentDueAmount",
            money(due)
        );

        const amountInput =
            $("paymentAmount");

        if (amountInput) {
            amountInput.value = "";
            amountInput.max =
                String(due);
        }

        const dateInput =
            $("paymentDate");

        if (dateInput) {
            dateInput.value =
                new Date()
                    .toISOString()
                    .slice(0, 10);
        }

        const methodInput =
            $("paymentMethod");

        if (methodInput) {
            methodInput.value = "Cash";
        }

        const noteInput =
            $("paymentNote");

        if (noteInput) {
            noteInput.value = "";
        }

        modal.classList.add("show");
        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );
    }

    function closePaymentModal() {
        const modal =
            $("feePaymentModal");

        if (!modal) return;

        modal.classList.remove("show");
        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-open"
        );
    }

    function savePayment(event) {
        if (event) {
            event.preventDefault();
        }

        const feeIdValue =
            $("paymentFeeId")?.value ||
            "";

        const studentIdValue =
            $("paymentStudentId")?.value ||
            "";

        const amount =
            numberValue(
                $("paymentAmount")?.value
            );

        const paymentMethod =
            $("paymentMethod")?.value ||
            "Cash";

        const date =
            $("paymentDate")?.value ||
            new Date()
                .toISOString()
                .slice(0, 10);

        const note =
            $("paymentNote")?.value
                ?.trim() || "";

        const fee =
            getFee(feeIdValue);

        if (!fee) {
            showToast(
                "Fee record not found.",
                "error"
            );
            return;
        }

        const due =
            getDueAmount(fee);

        if (amount <= 0) {
            showToast(
                "Enter a valid payment amount.",
                "error"
            );
            return;
        }

        if (amount > due) {
            showToast(
                `Payment cannot exceed the current due amount of ${money(
                    due
                )}.`,
                "error"
            );
            return;
        }

        const payment = {
            id: createId("payment"),
            receiptNumber:
                createReceiptNumber(),
            feeId: feeIdValue,
            studentId:
                studentIdValue ||
                feeStudentId(fee),
            amount,
            paymentMethod,
            date,
            note,
            createdAt:
                new Date().toISOString()
        };

        payments.push(payment);

        const newPaid =
            getPaidAmount(fee) + amount;

        fee.paidAmount = newPaid;
        fee.dueAmount = Math.max(
            0,
            getTotalFee(fee) - newPaid
        );

        fee.status =
            fee.dueAmount <= 0
                ? "paid"
                : newPaid > 0
                    ? "partial"
                    : "pending";

        fee.updatedAt =
            new Date().toISOString();

        writeStorage(
            STORAGE.fees,
            fees
        );

        writeStorage(
            STORAGE.payments,
            payments
        );

        closePaymentModal();

        renderAll();

        showToast(
            `Payment saved. Receipt ${payment.receiptNumber}`,
            "success"
        );

        setTimeout(() => {
            openReceiptPage(
                payment.id
            );
        }, 500);
    }

    function openReceiptPage(
        paymentIdValue
    ) {
        if (!paymentIdValue) {
            showToast(
                "Payment ID is missing.",
                "error"
            );
            return;
        }

        window.location.href =
            `fee-receipt.html?id=${encodeURIComponent(
                paymentIdValue
            )}`;
    }

    function openReceiptFromPayment(
        paymentIdValue
    ) {
        openReceiptPage(
            paymentIdValue
        );
    }

    function openReceiptsModal() {
        const modal =
            $("feeReceiptsModal");

        if (!modal) {
            showToast(
                "Receipts panel is not available.",
                "error"
            );
            return;
        }

        renderReceiptsModal();

        modal.classList.add("show");
        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );
    }

    function closeReceiptsModal() {
        const modal =
            $("feeReceiptsModal");

        if (!modal) return;

        modal.classList.remove("show");
        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-open"
        );
    }

    function renderReceiptsModal() {
        const body =
            $("feeReceiptsBody");

        if (!body) return;

        const list = getRecentPayments();

        if (!list.length) {
            body.innerHTML = `
                <div class="fees-empty-state">
                    <div class="empty-icon">🧾</div>
                    <h3>No receipts available</h3>
                    <p>
                        Receipts will appear after payments are recorded.
                    </p>
                </div>
            `;

            return;
        }

        body.innerHTML = list
            .map((payment) => {
                const student =
                    getStudent(
                        paymentStudentId(payment)
                    );

                return `
                    <div class="fee-receipt-list-item">
                        <div>
                            <strong>
                                ${escapeHtml(
                                    payment.receiptNumber ||
                                    "—"
                                )}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    studentName(student)
                                )}
                            </span>

                            <small>
                                ${escapeHtml(
                                    formatDate(
                                        payment.date ||
                                        payment.createdAt
                                    )
                                )}
                            </small>
                        </div>

                        <div class="receipt-list-right">
                            <strong>
                                ${money(
                                    payment.amount
                                )}
                            </strong>

                            <button
                                type="button"
                                class="fee-action-btn"
                                data-action="open-receipt"
                                data-payment-id="${escapeHtml(
                                    paymentId(payment)
                                )}"
                            >
                                View
                            </button>
                        </div>
                    </div>
                `;
            })
            .join("");
    }

    function openDuesModal() {
        const modal =
            $("feeDuesModal");

        if (!modal) {
            showToast(
                "Dues panel is not available.",
                "error"
            );
            return;
        }

        renderDuesModal();

        modal.classList.add("show");
        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );
    }

    function closeDuesModal() {
        const modal =
            $("feeDuesModal");

        if (!modal) return;

        modal.classList.remove("show");
        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-open"
        );
    }

    function renderDuesModal() {
        const body =
            $("feeDuesBody");

        if (!body) return;

        const dues = fees
            .map((fee) => ({
                fee,
                student:
                    getStudent(
                        feeStudentId(fee)
                    ),
                due:
                    getDueAmount(fee)
            }))
            .filter(
                (item) => item.due > 0
            )
            .sort(
                (a, b) =>
                    b.due - a.due
            );

        if (!dues.length) {
            body.innerHTML = `
                <div class="fees-empty-state">
                    <div class="empty-icon">✅</div>
                    <h3>No pending dues</h3>
                    <p>
                        All current fee records are settled.
                    </p>
                </div>
            `;

            return;
        }

        body.innerHTML = dues
            .map(
                ({
                    fee,
                    student,
                    due
                }) => `
                    <div class="fee-due-list-item">
                        <div>
                            <strong>
                                ${escapeHtml(
                                    studentName(student)
                                )}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    studentId(student)
                                )}
                                · Class
                                ${escapeHtml(
                                    cleanClass(
                                        student?.className ||
                                        student?.class
                                    ) || "—"
                                )}
                            </span>

                            <small>
                                ${escapeHtml(
                                    getFeeType(fee)
                                )}
                            </small>
                        </div>

                        <div>
                            <strong>
                                ${money(due)}
                            </strong>

                            <button
                                type="button"
                                class="fee-action-btn"
                                data-action="open-payment"
                                data-fee-id="${escapeHtml(
                                    feeId(fee)
                                )}"
                            >
                                Pay Now
                            </button>
                        </div>
                    </div>
                `
            )
            .join("");
    }

    function applyFilters() {
        activeFilters = {
            search:
                $("feeSearch")?.value
                    ?.trim() || "",

            className:
                $("feeClass")?.value || "",

            section:
                $("feeSection")?.value || "",

            status:
                $("feeStatus")?.value || ""
        };

        renderFeesTable();

        showToast(
            "Fee filters applied.",
            "success"
        );
    }

    function clearFilters() {
        if ($("feeSearch")) {
            $("feeSearch").value = "";
        }

        if ($("feeClass")) {
            $("feeClass").value = "";
        }

        populateSectionFilter();

        if ($("feeSection")) {
            $("feeSection").value = "";
        }

        if ($("feeStatus")) {
            $("feeStatus").value = "";
        }

        activeFilters = {
            search: "",
            className: "",
            section: "",
            status: ""
        };

        renderFeesTable();

        showToast(
            "Fee filters cleared.",
            "success"
        );
    }

    function refreshData() {
        students = readStorage(
            STORAGE.students,
            []
        );

        fees = readStorage(
            STORAGE.fees,
            []
        );

        payments = readStorage(
            STORAGE.payments,
            []
        );

        populateClassFilter();
        populateSectionFilter();

        renderAll();

        showToast(
            "Fees data refreshed.",
            "success"
        );
    }

    function renderAll() {
        renderKPIs();
        renderFeesTable();
        renderRecentPayments();
    }

    function bindEvents() {
        const classSelect =
            $("feeClass");

        if (classSelect) {
            classSelect.addEventListener(
                "change",
                () => {
                    populateSectionFilter();
                }
            );
        }

        const apply =
            $("applyFeeFilterBtn");

        if (apply) {
            apply.addEventListener(
                "click",
                (event) => {
                    event.preventDefault();
                    applyFilters();
                }
            );
        }

        const clear =
            $("clearFeeFilterBtn");

        if (clear) {
            clear.addEventListener(
                "click",
                (event) => {
                    event.preventDefault();
                    clearFilters();
                }
            );
        }

        const refresh =
            $("refreshFeesBtn");

        if (refresh) {
            refresh.addEventListener(
                "click",
                (event) => {
                    event.preventDefault();
                    refreshData();
                }
            );
        }

        const recordPayment =
            $("recordPaymentBtn");

        if (recordPayment) {
            recordPayment.addEventListener(
                "click",
                (event) => {
                    event.preventDefault();

                    if (!fees.length) {
                        showToast(
                            "Create a fee record first.",
                            "error"
                        );
                        return;
                    }

                    const pendingFee =
                        fees.find(
                            (fee) =>
                                getDueAmount(fee) >
                                0
                        );

                    if (pendingFee) {
                        openPaymentModal(
                            pendingFee
                        );
                    } else {
                        showToast(
                            "No pending fee record is available.",
                            "info"
                        );
                    }
                }
            );
        }

        const viewReceipts =
            $("viewReceiptsBtn");

        if (viewReceipts) {
            viewReceipts.addEventListener(
                "click",
                (event) => {
                    event.preventDefault();
                    openReceiptsModal();
                }
            );
        }

        const viewDues =
            $("viewDuesBtn");

        if (viewDues) {
            viewDues.addEventListener(
                "click",
                (event) => {
                    event.preventDefault();
                    openDuesModal();
                }
            );
        }

        const viewAllPayments =
            $("viewAllPaymentsBtn");

        if (viewAllPayments) {
            viewAllPayments.addEventListener(
                "click",
                (event) => {
                    event.preventDefault();
                    openReceiptsModal();
                }
            );
        }

        const saveForm =
            $("feePaymentForm");

        if (saveForm) {
            saveForm.addEventListener(
                "submit",
                savePayment
            );
        }

        const closePayment =
            $("closeFeePaymentModal");

        if (closePayment) {
            closePayment.addEventListener(
                "click",
                closePaymentModal
            );
        }

        const cancelPayment =
            $("cancelFeePaymentBtn");

        if (cancelPayment) {
            cancelPayment.addEventListener(
                "click",
                closePaymentModal
            );
        }

        const closeReceipts =
            $("closeFeeReceiptsModal");

        if (closeReceipts) {
            closeReceipts.addEventListener(
                "click",
                closeReceiptsModal
            );
        }

        const closeDues =
            $("closeFeeDuesModal");

        if (closeDues) {
            closeDues.addEventListener(
                "click",
                closeDuesModal
            );
        }

        document.addEventListener(
            "click",
            (event) => {
                const actionButton =
                    event.target.closest(
                        "[data-action]"
                    );

                if (!actionButton) return;

                const action =
                    actionButton.dataset.action;

                if (
                    action ===
                    "open-payment"
                ) {
                    event.preventDefault();

                    const id =
                        actionButton.dataset.feeId;

                    const fee =
                        getFee(id);

                    if (fee) {
                        closeDuesModal();
                        openPaymentModal(
                            fee
                        );
                    }

                    return;
                }

                if (
                    action ===
                    "open-receipt"
                ) {
                    event.preventDefault();

                    const id =
                        actionButton.dataset.paymentId;

                    closeReceiptsModal();
                    openReceiptFromPayment(
                        id
                    );
                }
            }
        );

        document.addEventListener(
            "keydown",
            (event) => {
                if (
                    event.key !== "Escape"
                ) {
                    return;
                }

                closePaymentModal();
                closeReceiptsModal();
                closeDuesModal();
            }
        );

        window.addEventListener(
            "storage",
            (event) => {
                if (
                    Object.values(
                        STORAGE
                    ).includes(event.key)
                ) {
                    refreshData();
                }
            }
        );
    }

    function init() {
        students = readStorage(
            STORAGE.students,
            []
        );

        fees = readStorage(
            STORAGE.fees,
            []
        );

        payments = readStorage(
            STORAGE.payments,
            []
        );

        bindEvents();

        populateClassFilter();
        populateSectionFilter();

        renderAll();
    }

    window.SmartSchoolFees = {
        refresh: refreshData,
        openReceipt: openReceiptFromPayment
    };

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
