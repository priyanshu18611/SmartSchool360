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

    /* =====================================================
       STORAGE
       ===================================================== */

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
            if (Array.isArray(parsed.data)) {
                return parsed.data;
            }

            if (Array.isArray(parsed.items)) {
                return parsed.items;
            }

            if (Array.isArray(parsed.records)) {
                return parsed.records;
            }

            return Object.values(parsed);
        }

        return fallback;
    }

    function writeStorage(key, value) {
        localStorage.setItem(
            key,
            JSON.stringify(value)
        );
    }

    /* =====================================================
       HELPERS
       ===================================================== */

    function numberValue(value) {
        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : 0;
    }

    function money(value) {
        return new Intl.NumberFormat(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2
            }
        ).format(numberValue(value));
    }

    function formatDate(value) {
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    }

    function todayISO() {
        const date = new Date();

        const year = date.getFullYear();
        const month = String(
            date.getMonth() + 1
        ).padStart(2, "0");
        const day = String(
            date.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
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

    function createId(prefix) {
        return (
            prefix +
            "_" +
            Date.now().toString(36) +
            "_" +
            Math.random()
                .toString(36)
                .slice(2, 9)
        );
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

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
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
            words[
                words.length - 1
            ].charAt(0)
        ).toUpperCase();
    }

    /* =====================================================
       FEE HELPERS
       ===================================================== */

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
            getTotalFee(fee) -
            getPaidAmount(fee)
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

    function calculateStatus(fee) {
        const total =
            getTotalFee(fee);

        const paid =
            getPaidAmount(fee);

        const due =
            getDueAmount(fee);

        const dueDate =
            getDueDate(fee);

        if (total <= 0) {
            return "pending";
        }

        if (
            due <= 0 ||
            paid >= total
        ) {
            return "paid";
        }

        if (paid > 0) {
            if (
                dueDate &&
                new Date(
                    dueDate
                ).getTime() <
                    new Date()
                        .setHours(
                            0,
                            0,
                            0,
                            0
                        )
            ) {
                return "overdue";
            }

            return "partial";
        }

        if (
            dueDate &&
            new Date(
                dueDate
            ).getTime() <
                new Date()
                    .setHours(
                        0,
                        0,
                        0,
                        0
                    )
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

        return (
            labels[status] ||
            "Pending"
        );
    }

    function getStudent(id) {
        return students.find(
            (student) =>
                studentId(student) ===
                String(id).trim()
        );
    }

    function getFee(id) {
        return fees.find(
            (fee) =>
                feeId(fee) ===
                String(id).trim()
        );
    }

    /* =====================================================
       TOAST
       ===================================================== */

    function showToast(
        message,
        type = "info"
    ) {
        const toast =
            $("feesToast");

        if (!toast) return;

        toast.textContent =
            message;

        toast.className =
            `fees-toast show ${type}`;

        clearTimeout(
            showToast.timer
        );

        showToast.timer =
            setTimeout(() => {
                toast.className =
                    "fees-toast";
            }, 3000);
    }

    /* =====================================================
       CREATE FEE RECORD
       ===================================================== */

    function populateStudentSelect() {
        const select =
            $("createFeeStudent");

        if (!select) return;

        const current =
            select.value;

        const sortedStudents =
            [...students].sort(
                (a, b) =>
                    studentName(a).localeCompare(
                        studentName(b)
                    )
            );

        select.innerHTML = `
            <option value="">
                Select Student
            </option>
        `;

        sortedStudents.forEach(
            (student) => {
                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    studentId(student);

                option.textContent =
                    `${studentName(
                        student
                    )} — ${studentId(
                        student
                    )}`;

                select.appendChild(
                    option
                );
            }
        );

        if (
            current &&
            sortedStudents.some(
                (student) =>
                    studentId(
                        student
                    ) === current
            )
        ) {
            select.value =
                current;
        }
    }

    function updateCreateFeeStudentPreview() {
        const id =
            $("createFeeStudent")
                ?.value || "";

        const student =
            getStudent(id);

        const avatar =
            $("createFeeStudentAvatar");

        const name =
            $("createFeeStudentName");

        const details =
            $("createFeeStudentDetails");

        if (!student) {
            if (avatar) {
                avatar.textContent =
                    "ST";

                avatar.style.backgroundImage =
                    "";
            }

            if (name) {
                name.textContent =
                    "Select a student";
            }

            if (details) {
                details.textContent =
                    "Student details will appear here.";
            }

            return;
        }

        const photo =
            student.photo ||
            student.photoUrl ||
            student.profilePhoto ||
            "";

        if (avatar) {
            if (photo) {
                avatar.textContent =
                    "";

                avatar.style.backgroundImage =
                    `url("${String(
                        photo
                    ).replace(
                        /"/g,
                        '\\"'
                    )}")`;

                avatar.classList.add(
                    "has-photo"
                );
            } else {
                avatar.style.backgroundImage =
                    "";

                avatar.classList.remove(
                    "has-photo"
                );

                avatar.textContent =
                    getInitials(
                        studentName(
                            student
                        )
                    );
            }
        }

        if (name) {
            name.textContent =
                studentName(
                    student
                );
        }

        if (details) {
            const className =
                cleanClass(
                    student.className ||
                    student.class
                ) || "—";

            const section =
                cleanSection(
                    student.section ||
                    student.sectionName
                ) || "—";

            const session =
                student.session ||
                student.academicYear ||
                "—";

            details.textContent =
                `ID: ${studentId(
                    student
                )} · Class ${className} · Section ${section} · Session ${session}`;
        }
    }

    function updateCreateFeeSummary() {
        const total =
            numberValue(
                $("createFeeTotal")
                    ?.value
            );

        const initial =
            numberValue(
                $("createFeeInitialPayment")
                    ?.value
            );

        const safeInitial =
            Math.min(
                Math.max(
                    0,
                    initial
                ),
                Math.max(
                    0,
                    total
                )
            );

        const due =
            Math.max(
                0,
                total -
                safeInitial
            );

        setText(
            "createFeeSummaryTotal",
            money(total)
        );

        setText(
            "createFeeSummaryPaid",
            money(safeInitial)
        );

        setText(
            "createFeeSummaryDue",
            money(due)
        );
    }

    function updateCustomFeeType() {
        const type =
            $("createFeeType")
                ?.value || "";

        const group =
            $("customFeeTypeGroup");

        const input =
            $("createFeeCustomType");

        if (!group) return;

        if (type === "Other") {
            group.style.display =
                "";

            if (input) {
                input.required =
                    true;
            }
        } else {
            group.style.display =
                "none";

            if (input) {
                input.required =
                    false;
                input.value =
                    "";
            }
        }
    }

    function openCreateFeeModal() {
        const modal =
            $("createFeeModal");

        if (!modal) {
            showToast(
                "Create Fee modal is not available.",
                "error"
            );

            return;
        }

        populateStudentSelect();

        if ($("createFeeForm")) {
            $("createFeeForm").reset();
        }

        if ($("createFeeAcademicYear")) {
            $("createFeeAcademicYear")
                .value = "2026-27";
        }

        if ($("createFeeDueDate")) {
            const dueDate =
                new Date();

            dueDate.setDate(
                dueDate.getDate() +
                30
            );

            $("createFeeDueDate")
                .value =
                dueDate
                    .toISOString()
                    .slice(0, 10);
        }

        if ($("createFeeInitialPayment")) {
            $("createFeeInitialPayment")
                .value = "0";
        }

        if ($("customFeeTypeGroup")) {
            $("customFeeTypeGroup")
                .style.display =
                "none";
        }

        updateCreateFeeStudentPreview();
        updateCreateFeeSummary();

        modal.classList.add(
            "show"
        );

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );

        setTimeout(() => {
            $("createFeeStudent")
                ?.focus();
        }, 100);
    }

    function closeCreateFeeModal() {
        const modal =
            $("createFeeModal");

        if (!modal) return;

        modal.classList.remove(
            "show"
        );

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-open"
        );
    }

    function saveFeeRecord(event) {
        if (event) {
            event.preventDefault();
        }

        const studentIdValue =
            $("createFeeStudent")
                ?.value || "";

        const student =
            getStudent(
                studentIdValue
            );

        if (!student) {
            showToast(
                "Please select a student.",
                "error"
            );

            return;
        }

        let feeType =
            $("createFeeType")
                ?.value || "";

        if (feeType === "Other") {
            feeType =
                $("createFeeCustomType")
                    ?.value
                    ?.trim() || "";

            if (!feeType) {
                showToast(
                    "Enter a custom fee type.",
                    "error"
                );

                return;
            }
        }

        const academicYear =
            $("createFeeAcademicYear")
                ?.value
                ?.trim() || "";

        const dueDate =
            $("createFeeDueDate")
                ?.value || "";

        const totalFee =
            numberValue(
                $("createFeeTotal")
                    ?.value
            );

        const initialPayment =
            numberValue(
                $("createFeeInitialPayment")
                    ?.value
            );

        const description =
            $("createFeeDescription")
                ?.value
                ?.trim() || "";

        if (!academicYear) {
            showToast(
                "Enter the academic year.",
                "error"
            );

            return;
        }

        if (!dueDate) {
            showToast(
                "Select a due date.",
                "error"
            );

            return;
        }

        if (totalFee <= 0) {
            showToast(
                "Total fee must be greater than ₹0.",
                "error"
            );

            return;
        }

        if (initialPayment < 0) {
            showToast(
                "Initial payment cannot be negative.",
                "error"
            );

            return;
        }

        if (
            initialPayment >
            totalFee
        ) {
            showToast(
                "Initial payment cannot exceed the total fee.",
                "error"
            );

            return;
        }

        const duplicate =
            fees.find(
                (fee) =>
                    feeStudentId(
                        fee
                    ) ===
                        studentIdValue &&
                    String(
                        fee.academicYear ||
                        fee.academic_year ||
                        ""
                    ) ===
                        academicYear &&
                    String(
                        fee.feeType ||
                        fee.type ||
                        ""
                    ).toLowerCase() ===
                        feeType.toLowerCase()
            );

        if (duplicate) {
            const confirmed =
                window.confirm(
                    `A ${feeType} record already exists for ${studentName(
                        student
                    )} in ${academicYear}.\n\nDo you still want to create another fee record?`
                );

            if (!confirmed) {
                return;
            }
        }

        const now =
            new Date().toISOString();

        const newFee = {
            id: createId("fee"),

            studentId:
                studentIdValue,

            totalFee:
                totalFee,

            paidAmount:
                initialPayment,

            dueAmount:
                Math.max(
                    0,
                    totalFee -
                    initialPayment
                ),

            status:
                initialPayment >=
                totalFee
                    ? "paid"
                    : initialPayment > 0
                        ? "partial"
                        : "pending",

            dueDate:
                dueDate,

            academicYear:
                academicYear,

            feeType:
                feeType,

            description:
                description,

            createdAt:
                now,

            updatedAt:
                now
        };

        fees.push(
            newFee
        );

        let createdPayment =
            null;

        if (
            initialPayment > 0
        ) {
            createdPayment = {
                id:
                    createId(
                        "payment"
                    ),

                receiptNumber:
                    createReceiptNumber(),

                feeId:
                    newFee.id,

                studentId:
                    studentIdValue,

                amount:
                    initialPayment,

                paymentMethod:
                    "Cash",

                date:
                    todayISO(),

                note:
                    "Initial payment at fee record creation.",

                createdAt:
                    now
            };

            payments.push(
                createdPayment
            );
        }

        writeStorage(
            STORAGE.fees,
            fees
        );

        writeStorage(
            STORAGE.payments,
            payments
        );

        closeCreateFeeModal();

        renderAll();

        showToast(
            `Fee record created for ${studentName(
                student
            )}.`,
            "success"
        );

        if (createdPayment) {
            setTimeout(() => {
                const shouldOpen =
                    window.confirm(
                        `Initial payment of ${money(
                            initialPayment
                        )} was recorded.\n\nOpen the payment receipt now?`
                    );

                if (shouldOpen) {
                    openReceiptPage(
                        createdPayment.id
                    );
                }
            }, 350);
        }
    }

    /* =====================================================
       CLASS / SECTION FILTERS
       ===================================================== */

    function populateClassFilter() {
        const select =
            $("feeClass");

        if (!select) return;

        const current =
            select.value;

        const classes = [
            ...new Set(
                students
                    .map(
                        (student) =>
                            cleanClass(
                                student.className ||
                                student.class
                            )
                    )
                    .filter(Boolean)
            )
        ].sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    undefined,
                    {
                        numeric: true
                    }
                )
        );

        select.innerHTML =
            `
                <option value="">
                    All Classes
                </option>
            ` +
            classes
                .map(
                    (value) =>
                        `
                            <option value="${escapeHtml(
                                value
                            )}">
                                ${escapeHtml(
                                    value
                                )}
                            </option>
                        `
                )
                .join("");

        if (
            classes.includes(
                current
            )
        ) {
            select.value =
                current;
        }
    }

    function populateSectionFilter() {
        const select =
            $("feeSection");

        if (!select) return;

        const selectedClass =
            $("feeClass")
                ?.value || "";

        const current =
            select.value;

        const sections = [
            ...new Set(
                students
                    .filter(
                        (student) => {
                            if (
                                !selectedClass
                            ) {
                                return true;
                            }

                            return (
                                cleanClass(
                                    student.className ||
                                    student.class
                                ) ===
                                selectedClass
                            );
                        }
                    )
                    .map(
                        (student) =>
                            cleanSection(
                                student.section ||
                                student.sectionName
                            )
                    )
                    .filter(Boolean)
            )
        ].sort();

        select.innerHTML =
            `
                <option value="">
                    All Sections
                </option>
            ` +
            sections
                .map(
                    (value) =>
                        `
                            <option value="${escapeHtml(
                                value
                            )}">
                                ${escapeHtml(
                                    value
                                )}
                            </option>
                        `
                )
                .join("");

        if (
            sections.includes(
                current
            )
        ) {
            select.value =
                current;
        }
    }

    /* =====================================================
       FILTERS
       ===================================================== */

    function matchesFilters(
        fee,
        student
    ) {
        const search =
            activeFilters.search
                .toLowerCase();

        const className =
            cleanClass(
                student?.className ||
                student?.class
            );

        const section =
            cleanSection(
                student?.section ||
                student?.sectionName
            );

        const status =
            calculateStatus(
                fee
            );

        if (search) {
            const searchable = [
                studentName(student),
                studentId(student),
                getFeeType(fee),
                feeId(fee)
            ]
                .join(" ")
                .toLowerCase();

            if (
                !searchable.includes(
                    search
                )
            ) {
                return false;
            }
        }

        if (
            activeFilters.className &&
            className !==
                activeFilters.className
        ) {
            return false;
        }

        if (
            activeFilters.section &&
            section !==
                activeFilters.section
        ) {
            return false;
        }

        if (
            activeFilters.status &&
            status !==
                activeFilters.status
        ) {
            return false;
        }

        return true;
    }

    function getFilteredFees() {
        return fees.filter(
            (fee) => {
                const student =
                    getStudent(
                        feeStudentId(
                            fee
                        )
                    );

                return matchesFilters(
                    fee,
                    student
                );
            }
        );
    }

    /* =====================================================
       KPI
       ===================================================== */

    function renderKPIs() {
        const total =
            fees.reduce(
                (sum, fee) =>
                    sum +
                    getTotalFee(
                        fee
                    ),
                0
            );

        const collected =
            fees.reduce(
                (sum, fee) =>
                    sum +
                    getPaidAmount(
                        fee
                    ),
                0
            );

        const pending =
            fees.reduce(
                (sum, fee) => {
                    const status =
                        calculateStatus(
                            fee
                        );

                    return (
                        sum +
                        (
                            status ===
                                "pending" ||
                            status ===
                                "partial"
                                ? getDueAmount(
                                      fee
                                  )
                                : 0
                        )
                    );
                },
                0
            );

        const overdue =
            fees.reduce(
                (sum, fee) =>
                    sum +
                    (
                        calculateStatus(
                            fee
                        ) ===
                        "overdue"
                            ? getDueAmount(
                                  fee
                              )
                            : 0
                    ),
                0
            );

        const collectedCount =
            fees.filter(
                (fee) =>
                    getPaidAmount(
                        fee
                    ) > 0
            ).length;

        const pendingCount =
            fees.filter(
                (fee) =>
                    calculateStatus(
                        fee
                    ) === "pending" ||
                    calculateStatus(
                        fee
                    ) === "partial"
            ).length;

        const overdueCount =
            fees.filter(
                (fee) =>
                    calculateStatus(
                        fee
                    ) === "overdue"
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
                collectedCount === 1
                    ? ""
                    : "s"
            }`
        );

        setText(
            "pendingFeesAmount",
            money(pending)
        );

        setText(
            "pendingFeesCount",
            `${pendingCount} due record${
                pendingCount === 1
                    ? ""
                    : "s"
            }`
        );

        setText(
            "overdueFeesAmount",
            money(overdue)
        );

        setText(
            "overdueFeesCount",
            `${overdueCount} overdue record${
                overdueCount === 1
                    ? ""
                    : "s"
            }`
        );
    }

    /* =====================================================
       FEE TABLE
       ===================================================== */

    function renderFeesTable() {
        const body =
            $("feesTableBody");

        if (!body) return;

        const filtered =
            getFilteredFees();

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
                            <div class="empty-icon">
                                💰
                            </div>

                            <h3>
                                No fee records found
                            </h3>

                            <p>
                                Create a fee record to get started.
                            </p>
                        </div>
                    </td>
                </tr>
            `;

            return;
        }

        body.innerHTML =
            filtered
                .map(
                    (fee) => {
                        const student =
                            getStudent(
                                feeStudentId(
                                    fee
                                )
                            );

                        const status =
                            calculateStatus(
                                fee
                            );

                        const total =
                            getTotalFee(
                                fee
                            );

                        const paid =
                            getPaidAmount(
                                fee
                            );

                        const due =
                            getDueAmount(
                                fee
                            );

                        const photo =
                            student?.photo ||
                            student?.photoUrl ||
                            "";

                        const avatar =
                            photo
                                ? `
                                    <img
                                        src="${escapeHtml(
                                            photo
                                        )}"
                                        alt="${escapeHtml(
                                            studentName(
                                                student
                                            )
                                        )}"
                                        class="fee-avatar"
                                    >
                                `
                                : `
                                    <div class="fee-avatar fee-avatar-initials">
                                        ${escapeHtml(
                                            getInitials(
                                                studentName(
                                                    student
                                                )
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
                                                    studentName(
                                                        student
                                                    )
                                                )}
                                            </strong>

                                            <span>
                                                ${escapeHtml(
                                                    studentId(
                                                        student
                                                    ) ||
                                                    feeStudentId(
                                                        fee
                                                    )
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
                                        ) ||
                                        "—"
                                    )}
                                </td>

                                <td>
                                    ${escapeHtml(
                                        cleanSection(
                                            student?.section ||
                                            student?.sectionName
                                        ) ||
                                        "—"
                                    )}
                                </td>

                                <td>
                                    ${escapeHtml(
                                        getFeeType(
                                            fee
                                        )
                                    )}
                                </td>

                                <td>
                                    <strong>
                                        ${money(
                                            total
                                        )}
                                    </strong>
                                </td>

                                <td>
                                    ${money(
                                        paid
                                    )}
                                </td>

                                <td>
                                    <strong>
                                        ${money(
                                            due
                                        )}
                                    </strong>
                                </td>

                                <td>
                                    <span class="fee-status ${status}">
                                        ${statusLabel(
                                            status
                                        )}
                                    </span>
                                </td>

                                <td>

                                    <button
                                        type="button"
                                        class="fee-action-btn"
                                        data-action="open-payment"
                                        data-fee-id="${escapeHtml(
                                            feeId(
                                                fee
                                            )
                                        )}"
                                    >
                                        💳 Payment
                                    </button>

                                </td>

                            </tr>
                        `;
                    }
                )
                .join("");
    }

    /* =====================================================
       PAYMENT HISTORY
       ===================================================== */

    function getRecentPayments() {
        return [
            ...payments
        ]
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
            .slice(
                0,
                10
            );
    }

    function formatPaymentMethod(
        payment
    ) {
        return String(
            payment?.paymentMethod ||
            payment?.method ||
            "Cash"
        )
            .replace(
                /_/g,
                " "
            )
            .replace(
                /\b\w/g,
                (letter) =>
                    letter.toUpperCase()
            );
    }

    function renderRecentPayments() {
        const body =
            $("recentPaymentsBody");

        if (!body) return;

        const recent =
            getRecentPayments();

        if (!recent.length) {
            body.innerHTML = `
                <tr>
                    <td colspan="7">

                        <div class="fees-empty-state compact">

                            <div class="empty-icon">
                                🧾
                            </div>

                            <h3>
                                No payments yet
                            </h3>

                            <p>
                                Recorded payments will appear here.
                            </p>

                        </div>

                    </td>
                </tr>
            `;

            return;
        }

        body.innerHTML =
            recent
                .map(
                    (payment) => {
                        const student =
                            getStudent(
                                paymentStudentId(
                                    payment
                                )
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
                                        studentName(
                                            student
                                        )
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
                                            ? getFeeType(
                                                  fee
                                              )
                                            : "School Fee"
                                    )}
                                </td>

                                <td>

                                    <button
                                        type="button"
                                        class="fee-action-btn secondary"
                                        data-action="open-receipt"
                                        data-payment-id="${escapeHtml(
                                            paymentId(
                                                payment
                                            )
                                        )}"
                                    >
                                        🧾 Receipt
                                    </button>

                                </td>

                            </tr>
                        `;
                    }
                )
                .join("");
    }

    /* =====================================================
       PAYMENT MODAL
       ===================================================== */

    function openPaymentModal(
        fee
    ) {
        const modal =
            $("feePaymentModal");

        if (!modal) {
            showToast(
                "Payment modal is not available.",
                "error"
            );

            return;
        }

        const student =
            getStudent(
                feeStudentId(
                    fee
                )
            );

        const total =
            getTotalFee(
                fee
            );

        const paid =
            getPaidAmount(
                fee
            );

        const due =
            getDueAmount(
                fee
            );

        if ($("paymentFeeId")) {
            $("paymentFeeId")
                .value =
                feeId(fee);
        }

        if ($("paymentStudentId")) {
            $("paymentStudentId")
                .value =
                feeStudentId(
                    fee
                );
        }

        setText(
            "paymentStudentName",
            studentName(
                student
            )
        );

        setText(
            "paymentStudentIdDisplay",
            studentId(
                student
            )
        );

        setText(
            "paymentFeeType",
            getFeeType(
                fee
            )
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

        if ($("paymentAmount")) {
            $("paymentAmount")
                .value = "";

            $("paymentAmount")
                .max =
                String(due);
        }

        if ($("paymentDate")) {
            $("paymentDate")
                .value =
                todayISO();
        }

        if ($("paymentMethod")) {
            $("paymentMethod")
                .value =
                "Cash";
        }

        if ($("paymentNote")) {
            $("paymentNote")
                .value = "";
        }

        modal.classList.add(
            "show"
        );

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

        modal.classList.remove(
            "show"
        );

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-open"
        );
    }

    /* =====================================================
       SAVE PAYMENT
       ===================================================== */

    function savePayment(event) {
        if (event) {
            event.preventDefault();
        }

        const feeIdValue =
            $("paymentFeeId")
                ?.value || "";

        const studentIdValue =
            $("paymentStudentId")
                ?.value || "";

        const amount =
            numberValue(
                $("paymentAmount")
                    ?.value
            );

        const paymentMethod =
            $("paymentMethod")
                ?.value ||
            "Cash";

        const date =
            $("paymentDate")
                ?.value ||
            todayISO();

        const note =
            $("paymentNote")
                ?.value
                ?.trim() || "";

        const fee =
            getFee(
                feeIdValue
            );

        if (!fee) {
            showToast(
                "Fee record not found.",
                "error"
            );

            return;
        }

        const due =
            getDueAmount(
                fee
            );

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
            id:
                createId(
                    "payment"
                ),

            receiptNumber:
                createReceiptNumber(),

            feeId:
                feeIdValue,

            studentId:
                studentIdValue ||
                feeStudentId(
                    fee
                ),

            amount:
                amount,

            paymentMethod:
                paymentMethod,

            date:
                date,

            note:
                note,

            createdAt:
                new Date()
                    .toISOString()
        };

        payments.push(
            payment
        );

        const newPaid =
            getPaidAmount(
                fee
            ) + amount;

        fee.paidAmount =
            newPaid;

        fee.dueAmount =
            Math.max(
                0,
                getTotalFee(
                    fee
                ) -
                newPaid
            );

        fee.status =
            fee.dueAmount <= 0
                ? "paid"
                : newPaid > 0
                    ? "partial"
                    : "pending";

        fee.updatedAt =
            new Date()
                .toISOString();

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

        setTimeout(
            () => {
                openReceiptPage(
                    payment.id
                );
            },
            500
        );
    }

    /* =====================================================
       RECEIPT PAGE
       ===================================================== */

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

    /* =====================================================
       RECEIPTS MODAL
       ===================================================== */

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

        modal.classList.add(
            "show"
        );

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

        modal.classList.remove(
            "show"
        );

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

        const list =
            getRecentPayments();

        if (!list.length) {
            body.innerHTML = `
                <div class="fees-empty-state">

                    <div class="empty-icon">
                        🧾
                    </div>

                    <h3>
                        No receipts available
                    </h3>

                    <p>
                        Receipts will appear after payments are recorded.
                    </p>

                </div>
            `;

            return;
        }

        body.innerHTML =
            list
                .map(
                    (payment) => {
                        const student =
                            getStudent(
                                paymentStudentId(
                                    payment
                                )
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
                                            studentName(
                                                student
                                            )
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
                                            paymentId(
                                                payment
                                            )
                                        )}"
                                    >
                                        View
                                    </button>

                                </div>

                            </div>
                        `;
                    }
                )
                .join("");
    }

    /* =====================================================
       DUES MODAL
       ===================================================== */

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

        modal.classList.add(
            "show"
        );

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

        modal.classList.remove(
            "show"
        );

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

        const dues =
            fees
                .map(
                    (fee) => ({
                        fee,
                        student:
                            getStudent(
                                feeStudentId(
                                    fee
                                )
                            ),
                        due:
                            getDueAmount(
                                fee
                            )
                    })
                )
                .filter(
                    (item) =>
                        item.due > 0
                )
                .sort(
                    (a, b) =>
                        b.due -
                        a.due
                );

        if (!dues.length) {
            body.innerHTML = `
                <div class="fees-empty-state">

                    <div class="empty-icon">
                        ✅
                    </div>

                    <h3>
                        No pending dues
                    </h3>

                    <p>
                        All current fee records are settled.
                    </p>

                </div>
            `;

            return;
        }

        body.innerHTML =
            dues
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
                                        studentName(
                                            student
                                        )
                                    )}
                                </strong>

                                <span>
                                    ${escapeHtml(
                                        studentId(
                                            student
                                        )
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
                                        getFeeType(
                                            fee
                                        )
                                    )}
                                </small>

                            </div>

                            <div>

                                <strong>
                                    ${money(
                                        due
                                    )}
                                </strong>

                                <button
                                    type="button"
                                    class="fee-action-btn"
                                    data-action="open-payment"
                                    data-fee-id="${escapeHtml(
                                        feeId(
                                            fee
                                        )
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

    /* =====================================================
       FILTER ACTIONS
       ===================================================== */

    function applyFilters() {
        activeFilters = {
            search:
                $("feeSearch")
                    ?.value
                    ?.trim() ||
                "",

            className:
                $("feeClass")
                    ?.value ||
                "",

            section:
                $("feeSection")
                    ?.value ||
                "",

            status:
                $("feeStatus")
                    ?.value ||
                ""
        };

        renderFeesTable();

        showToast(
            "Fee filters applied.",
            "success"
        );
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

        populateSectionFilter();

        if ($("feeSection")) {
            $("feeSection").value =
                "";
        }

        if ($("feeStatus")) {
            $("feeStatus").value =
                "";
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

    /* =====================================================
       REFRESH
       ===================================================== */

    function refreshData(
        showMessage = true
    ) {
        students =
            readStorage(
                STORAGE.students,
                []
            );

        fees =
            readStorage(
                STORAGE.fees,
                []
            );

        payments =
            readStorage(
                STORAGE.payments,
                []
            );

        populateStudentSelect();
        populateClassFilter();
        populateSectionFilter();

        renderAll();

        if (showMessage) {
            showToast(
                "Fees data refreshed.",
                "success"
            );
        }
    }

    function renderAll() {
        renderKPIs();
        renderFeesTable();
        renderRecentPayments();
    }

    /* =====================================================
       EVENT BINDING
       ===================================================== */

    function bindEvents() {

        /* Create Fee */

        const createFeeButton =
            $("createFeeRecordBtn");

        if (createFeeButton) {
            createFeeButton.addEventListener(
                "click",
                (event) => {
                    event.preventDefault();

                    openCreateFeeModal();
                }
            );
        }

        const closeCreateFee =
            $("closeCreateFeeModal");

        if (closeCreateFee) {
            closeCreateFee.addEventListener(
                "click",
                closeCreateFeeModal
            );
        }

        const cancelCreateFee =
            $("cancelCreateFeeBtn");

        if (cancelCreateFee) {
            cancelCreateFee.addEventListener(
                "click",
                closeCreateFeeModal
            );
        }

        const createFeeForm =
            $("createFeeForm");

        if (createFeeForm) {
            createFeeForm.addEventListener(
                "submit",
                saveFeeRecord
            );
        }

        const createFeeStudent =
            $("createFeeStudent");

        if (createFeeStudent) {
            createFeeStudent.addEventListener(
                "change",
                updateCreateFeeStudentPreview
            );
        }

        const createFeeType =
            $("createFeeType");

        if (createFeeType) {
            createFeeType.addEventListener(
                "change",
                updateCustomFeeType
            );
        }

        const createFeeTotal =
            $("createFeeTotal");

        if (createFeeTotal) {
            createFeeTotal.addEventListener(
                "input",
                updateCreateFeeSummary
            );
        }

        const createFeeInitial =
            $("createFeeInitialPayment");

        if (createFeeInitial) {
            createFeeInitial.addEventListener(
                "input",
                updateCreateFeeSummary
            );
        }

        /* Class */

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

        /* Filters */

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

        /* Refresh */

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

        /* Record Payment */

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
                                getDueAmount(
                                    fee
                                ) > 0
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

        /* Receipts */

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

        /* Dues */

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

        /* Payment Form */

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

        /* Receipt Modal */

        const closeReceipts =
            $("closeFeeReceiptsModal");

        if (closeReceipts) {
            closeReceipts.addEventListener(
                "click",
                closeReceiptsModal
            );
        }

        /* Dues Modal */

        const closeDues =
            $("closeFeeDuesModal");

        if (closeDues) {
            closeDues.addEventListener(
                "click",
                closeDuesModal
            );
        }

        /* Delegated Actions */

        document.addEventListener(
            "click",
            (event) => {

                const actionButton =
                    event.target.closest(
                        "[data-action]"
                    );

                if (!actionButton) {
                    return;
                }

                const action =
                    actionButton.dataset.action;

                /* Payment */

                if (
                    action ===
                    "open-payment"
                ) {
                    event.preventDefault();

                    const id =
                        actionButton
                            .dataset
                            .feeId;

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

                /* Receipt */

                if (
                    action ===
                    "open-receipt"
                ) {
                    event.preventDefault();

                    const id =
                        actionButton
                            .dataset
                            .paymentId;

                    closeReceiptsModal();

                    openReceiptPage(
                        id
                    );
                }
            }
        );

        /* Escape */

        document.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key !==
                    "Escape"
                ) {
                    return;
                }

                closeCreateFeeModal();
                closePaymentModal();
                closeReceiptsModal();
                closeDuesModal();
            }
        );

        /* Outside modal click */

        document.addEventListener(
            "click",
            (event) => {

                if (
                    event.target ===
                    $("createFeeModal")
                ) {
                    closeCreateFeeModal();
                }

                if (
                    event.target ===
                    $("feePaymentModal")
                ) {
                    closePaymentModal();
                }

                if (
                    event.target ===
                    $("feeReceiptsModal")
                ) {
                    closeReceiptsModal();
                }

                if (
                    event.target ===
                    $("feeDuesModal")
                ) {
                    closeDuesModal();
                }
            }
        );

        /* Storage Sync */

        window.addEventListener(
            "storage",
            (event) => {

                if (
                    Object.values(
                        STORAGE
                    ).includes(
                        event.key
                    )
                ) {
                    refreshData(
                        false
                    );
                }
            }
        );
    }

    /* =====================================================
       INIT
       ===================================================== */

    function init() {

        students =
            readStorage(
                STORAGE.students,
                []
            );

        fees =
            readStorage(
                STORAGE.fees,
                []
            );

        payments =
            readStorage(
                STORAGE.payments,
                []
            );

        bindEvents();

        populateStudentSelect();
        populateClassFilter();
        populateSectionFilter();

        renderAll();
    }

    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.SmartSchoolFees = {
        refresh:
            () =>
                refreshData(),

        openReceipt:
            (
                paymentIdValue
            ) =>
                openReceiptPage(
                    paymentIdValue
                ),

        openCreateFee:
            () =>
                openCreateFeeModal()
    };

    /* =====================================================
       START
       ===================================================== */

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
