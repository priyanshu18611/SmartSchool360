/* =========================================================
   SmartSchool360 - Fees Management
   File: frontend/assets/js/fees.js

   Includes:
   - Fee dashboard
   - Create fee record
   - Edit fee record
   - Delete fee record
   - Record payment
   - Payment history
   - Receipts
   - Pending dues
   - Filters
   - KPI calculations
   - Mobile-safe modal handling
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       STORAGE
       ===================================================== */

    const STORAGE = {

        students:
            "smartschool_students",

        fees:
            "smartschool_fees",

        payments:
            "smartschool_fee_payments"

    };


    /* =====================================================
       HELPERS
       ===================================================== */

    const $ = (id) =>
        document.getElementById(id);


    let students = [];

    let fees = [];

    let payments = [];


    let activeFilters = {

        search: "",

        className: "",

        section: "",

        status: ""

    };


    let editingFeeId = "";


    /* =====================================================
       STORAGE HELPERS
       ===================================================== */

    function safeParse(value, fallback) {

        try {

            return JSON.parse(value);

        } catch (error) {

            return fallback;

        }

    }


    function readStorage(key, fallback = []) {

        const raw =
            localStorage.getItem(key);

        if (!raw) {

            return fallback;

        }


        const parsed =
            safeParse(
                raw,
                fallback
            );


        if (Array.isArray(parsed)) {

            return parsed;

        }


        if (
            parsed &&
            typeof parsed === "object"
        ) {

            if (
                Array.isArray(
                    parsed.data
                )
            ) {

                return parsed.data;

            }


            if (
                Array.isArray(
                    parsed.items
                )
            ) {

                return parsed.items;

            }


            if (
                Array.isArray(
                    parsed.records
                )
            ) {

                return parsed.records;

            }


            return Object.values(
                parsed
            );

        }


        return fallback;

    }


    function writeStorage(
        key,
        value
    ) {

        localStorage.setItem(

            key,

            JSON.stringify(value)

        );

    }


    /* =====================================================
       NUMBER / MONEY
       ===================================================== */

    function numberValue(value) {

        const number =
            Number(value);


        return Number.isFinite(
            number
        )
            ? number
            : 0;

    }


    function money(value) {

        return new Intl.NumberFormat(

            "en-IN",

            {

                style:
                    "currency",

                currency:
                    "INR",

                maximumFractionDigits:
                    2

            }

        ).format(
            numberValue(value)
        );

    }


    function todayISO() {

        const date =
            new Date();


        const year =
            date.getFullYear();


        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, "0");


        const day =
            String(
                date.getDate()
            ).padStart(2, "0");


        return (
            `${year}-${month}-${day}`
        );

    }


    function formatDate(value) {

        if (!value) {

            return "—";

        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return String(value);

        }


        return date.toLocaleDateString(

            "en-IN",

            {

                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric"

            }

        );

    }


    /* =====================================================
       TEXT HELPERS
       ===================================================== */

    function escapeHtml(value) {

        return String(
            value ?? ""
        )

            .replace(
                /&/g,
                "&amp;"
            )

            .replace(
                /</g,
                "&lt;"
            )

            .replace(
                />/g,
                "&gt;"
            )

            .replace(
                /"/g,
                "&quot;"
            )

            .replace(
                /'/g,
                "&#039;"
            );

    }


    function setText(
        id,
        value
    ) {

        const element =
            $(id);


        if (!element) {

            return;

        }


        element.textContent =

            value ===
                undefined ||

            value ===
                null ||

            value ===
                ""

                ? "—"

                : String(value);

    }


    function getInitials(name) {

        const words = String(

            name ||
            "Student"

        )

            .trim()

            .split(/\s+/)

            .filter(Boolean);


        if (!words.length) {

            return "ST";

        }


        if (
            words.length === 1
        ) {

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


    function cleanClass(value) {

        return String(
            value ?? ""
        )

            .replace(
                /^class\s*/i,
                ""
            )

            .trim();

    }


    function cleanSection(value) {

        return String(
            value ?? ""
        )

            .replace(
                /^section\s*/i,
                ""
            )

            .trim();

    }


    /* =====================================================
       ID HELPERS
       ===================================================== */

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


    function feeId(fee) {

        return String(

            fee?.id ??

            fee?.feeId ??

            fee?.fee_id ??

            ""

        ).trim();

    }


    function feeStudentId(fee) {

        return String(

            fee?.studentId ??

            fee?.student_id ??

            fee?.student?.id ??

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


    function paymentStudentId(
        payment
    ) {

        return String(

            payment?.studentId ??

            payment?.student_id ??

            payment?.student?.id ??

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

        const date =
            new Date();


        const datePart =

            date.getFullYear()

                .toString() +

            String(
                date.getMonth() + 1
            ).padStart(2, "0") +

            String(
                date.getDate()
            ).padStart(2, "0");


        const randomPart =

            Math.floor(

                1000 +

                Math.random() *
                    9000

            );


        return (

            `SS-RCP-${datePart}-${randomPart}`

        );

    }


    /* =====================================================
       LOOKUPS
       ===================================================== */

    function getStudent(id) {

        return students.find(

            student =>

                studentId(student) ===
                String(id).trim()

        );

    }


    function getFee(id) {

        return fees.find(

            fee =>

                feeId(fee) ===
                String(id).trim()

        );

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

        const total =
            getTotalFee(fee);


        const paid =
            getPaidAmount(fee);


        return Math.max(

            0,

            total - paid

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


        if (total <= 0) {

            return "pending";

        }


        if (due <= 0) {

            return "paid";

        }


        const dueDate =
            getDueDate(fee);


        if (dueDate) {

            const dueTime =
                new Date(
                    dueDate
                ).getTime();


            const today =
                new Date();


            today.setHours(
                0,
                0,
                0,
                0
            );


            if (
                Number.isFinite(
                    dueTime
                ) &&
                dueTime <
                    today.getTime()
            ) {

                return "overdue";

            }

        }


        if (paid > 0) {

            return "partial";

        }


        return "pending";

    }


    function statusLabel(status) {

        const labels = {

            paid:
                "Paid",

            partial:
                "Partial",

            pending:
                "Pending",

            overdue:
                "Overdue"

        };


        return (

            labels[status] ||
            "Pending"

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


        if (!toast) {

            return;

        }


        toast.textContent =
            message;


        toast.className =
            "fees-toast show";


        if (
            type === "success"
        ) {

            toast.style.background =
                "#15803d";

        }

        else if (
            type === "error"
        ) {

            toast.style.background =
                "#dc2626";

        }

        else {

            toast.style.background =
                "#111827";

        }


        clearTimeout(
            showToast.timer
        );


        showToast.timer =
            setTimeout(
                () => {

                    toast.className =
                        "fees-toast";

                },

                3000

            );

    }


    /* =====================================================
       MODAL HELPERS
       ===================================================== */

    function openModal(modal) {

        if (!modal) {

            return;

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


    function closeModal(modal) {

        if (!modal) {

            return;

        }


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


    function closeAllModals() {

        document
            .querySelectorAll(
                ".fee-modal-overlay.show"
            )
            .forEach(
                modal =>
                    closeModal(
                        modal
                    )
            );

        document.body.classList.remove(
            "modal-open"
        );

    }


    /* =====================================================
       CREATE FEE
       ===================================================== */

    function populateStudentSelect() {

        const select =
            $("createFeeStudent");


        if (!select) {

            return;

        }


        const current =
            select.value;


        const sorted =
            [...students].sort(

                (a, b) =>

                    studentName(a)
                        .localeCompare(
                            studentName(b)
                        )

            );


        select.innerHTML = `

            <option value="">
                Select Student
            </option>

        `;


        sorted.forEach(
            student => {

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
            sorted.some(
                student =>
                    studentId(
                        student
                    ) === current
            )
        ) {

            select.value =
                current;

        }

    }


    function updateCreateStudentPreview() {

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

            }

            else {

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


            details.textContent =

                `ID: ${studentId(
                    student
                )} · Class ${className} · Section ${section}`;

        }

    }


    function updateCreateSummary() {

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


        const paid =
            Math.min(
                Math.max(
                    0,
                    initial
                ),
                total
            );


        const due =
            Math.max(
                0,
                total - paid
            );


        setText(
            "createFeeSummaryTotal",
            money(total)
        );


        setText(
            "createFeeSummaryPaid",
            money(paid)
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


        if (!group) {

            return;

        }


        if (
            type === "Other"
        ) {

            group.style.display =
                "";

            if (input) {

                input.required =
                    true;

            }

        }

        else {

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


        const form =
            $("createFeeForm");


        if (form) {

            form.reset();

        }


        if (
            $("createFeeAcademicYear")
        ) {

            $("createFeeAcademicYear")
                .value =
                "2026-27";

        }


        if (
            $("createFeeDueDate")
        ) {

            const date =
                new Date();


            date.setDate(
                date.getDate() + 30
            );


            $("createFeeDueDate")
                .value =

                date
                    .toISOString()
                    .slice(
                        0,
                        10
                    );

        }


        if (
            $("createFeeInitialPayment")
        ) {

            $("createFeeInitialPayment")
                .value =
                "0";

        }


        updateCustomFeeType();

        updateCreateStudentPreview();

        updateCreateSummary();

        openModal(modal);

    }


    function closeCreateFeeModal() {

        closeModal(
            $("createFeeModal")
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


        if (
            feeType === "Other"
        ) {

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
                "Enter academic year.",
                "error"
            );

            return;

        }


        if (!dueDate) {

            showToast(
                "Select due date.",
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


        if (
            initialPayment >
            totalFee
        ) {

            showToast(
                "Initial payment cannot exceed total fee.",
                "error"
            );

            return;

        }


        const now =
            new Date().toISOString();


        const newFee = {

            id:
                createId("fee"),

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
                calculateStatus({

                    totalFee,

                    paidAmount:
                        initialPayment,

                    dueDate

                }),

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


        let payment =
            null;


        if (
            initialPayment > 0
        ) {

            payment = {

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
                payment
            );

        }


        saveAll();


        closeCreateFeeModal();

        renderAll();


        showToast(

            `Fee record created for ${studentName(
                student
            )}.`,

            "success"

        );


        if (payment) {

            setTimeout(
                () => {

                    const open =
                        window.confirm(

                            `Initial payment of ${money(
                                initialPayment
                            )} recorded.\n\nOpen receipt now?`

                        );


                    if (open) {

                        openReceiptPage(
                            payment.id
                        );

                    }

                },

                400

            );

        }

    }


    /* =====================================================
       FILTER OPTIONS
       ===================================================== */

    function populateClassFilter() {

        const select =
            $("feeClass");


        if (!select) {

            return;

        }


        const current =
            select.value;


        const classes = [

            ...new Set(

                students

                    .map(
                        student =>
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
                        numeric:
                            true
                    }
                )

        );


        select.innerHTML = `

            <option value="">
                All Classes
            </option>

            ${classes.map(
                value =>
                    `
                    <option value="${escapeHtml(
                        value
                    )}">
                        ${escapeHtml(
                            value
                        )}
                    </option>
                    `
            ).join("")}

        `;


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


        if (!select) {

            return;

        }


        const selectedClass =
            $("feeClass")
                ?.value || "";


        const current =
            select.value;


        const sections = [

            ...new Set(

                students

                    .filter(
                        student => {

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
                        student =>
                            cleanSection(
                                student.section ||
                                student.sectionName
                            )
                    )

                    .filter(Boolean)

            )

        ].sort();


        select.innerHTML = `

            <option value="">
                All Sections
            </option>

            ${sections.map(
                value =>
                    `
                    <option value="${escapeHtml(
                        value
                    )}">
                        ${escapeHtml(
                            value
                        )}
                    </option>
                    `
            ).join("")}

        `;


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

                studentName(
                    student
                ),

                studentId(
                    student
                ),

                getFeeType(
                    fee
                ),

                feeId(
                    fee
                )

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

            fee => {

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

        activeFilters = {

            search:
                "",

            className:
                "",

            section:
                "",

            status:
                ""

        };


        if ($("feeSearch")) {

            $("feeSearch").value =
                "";

        }


        if ($("feeClass")) {

            $("feeClass").value =
                "";

        }


        populateSectionFilter();


        if ($("feeStatus")) {

            $("feeStatus").value =
                "";

        }


        renderFeesTable();


        showToast(
            "Fee filters cleared.",
            "success"
        );

    }


    /* =====================================================
       KPI
       ===================================================== */

    function renderKPIs() {

        const total =
            fees.reduce(

                (
                    sum,
                    fee
                ) =>

                    sum +
                    getTotalFee(
                        fee
                    ),

                0

            );


        const collected =
            fees.reduce(

                (
                    sum,
                    fee
                ) =>

                    sum +
                    getPaidAmount(
                        fee
                    ),

                0

            );


        const pending =
            fees.reduce(

                (
                    sum,
                    fee
                ) =>

                    sum +
                    (

                        getDueAmount(
                            fee
                        ) > 0

                            ? getDueAmount(
                                fee
                            )

                            : 0

                    ),

                0

            );


        const overdue =
            fees.reduce(

                (
                    sum,
                    fee
                ) =>

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

                fee =>
                    getPaidAmount(
                        fee
                    ) > 0

            ).length;


        const pendingCount =
            fees.filter(

                fee =>
                    getDueAmount(
                        fee
                    ) > 0

            ).length;


        const overdueCount =
            fees.filter(

                fee =>

                    calculateStatus(
                        fee
                    ) ===
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


        if (!body) {

            return;

        }


        const list =
            getFilteredFees();


        setText(
            "feeRecordCount",

            `${list.length} record${
                list.length === 1
                    ? ""
                    : "s"
            }`

        );


        if (!list.length) {

            body.innerHTML = `

                <tr>

                    <td colspan="9">

                        <div
                            class="fees-empty-state"
                        >

                            <div
                                class="empty-icon"
                            >
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

            list.map(

                fee => {

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


                    const status =
                        calculateStatus(
                            fee
                        );


                    const className =
                        cleanClass(
                            student?.className ||
                            student?.class
                        ) || "—";


                    const section =
                        cleanSection(
                            student?.section ||
                            student?.sectionName
                        ) || "—";


                    return `

                        <tr>

                            <td>

                                <div
                                    class="fee-student-cell"
                                >

                                    <div
                                        class="fee-student-avatar"
                                    >
                                        ${escapeHtml(
                                            getInitials(
                                                studentName(
                                                    student
                                                )
                                            )
                                        )}
                                    </div>

                                    <div>

                                        <strong>
                                            ${escapeHtml(
                                                studentName(
                                                    student
                                                )
                                            )}
                                        </strong>

                                        <small>
                                            ${escapeHtml(
                                                studentId(
                                                    student
                                                )
                                            )}
                                        </small>

                                    </div>

                                </div>

                            </td>


                            <td>
                                ${escapeHtml(
                                    className
                                )}
                            </td>


                            <td>
                                ${escapeHtml(
                                    section
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

                                <span
                                    class="amount"
                                >
                                    ${money(
                                        total
                                    )}
                                </span>

                            </td>


                            <td>

                                <span
                                    class="amount paid"
                                >
                                    ${money(
                                        paid
                                    )}
                                </span>

                            </td>


                            <td>

                                <span
                                    class="amount due"
                                >
                                    ${money(
                                        due
                                    )}
                                </span>

                            </td>


                            <td>

                                <span
                                    class="fee-status ${status}"
                                >
                                    ${statusLabel(
                                        status
                                    )}
                                </span>

                            </td>


                            <td>

                                <div
                                    style="
                                        display:flex;
                                        gap:6px;
                                        flex-wrap:wrap;
                                    "
                                >

                                    <button
                                        type="button"
                                        class="fee-action-btn"
                                        data-action="edit-fee"
                                        data-fee-id="${escapeHtml(
                                            feeId(
                                                fee
                                            )
                                        )}"
                                    >
                                        ✏️ Edit
                                    </button>


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
                                        💳 Pay
                                    </button>


                                    <button
                                        type="button"
                                        class="fee-action-btn secondary"
                                        data-action="delete-fee"
                                        data-fee-id="${escapeHtml(
                                            feeId(
                                                fee
                                            )
                                        )}"
                                    >
                                        🗑️ Delete
                                    </button>

                                </div>

                            </td>

                        </tr>

                    `;

                }

            ).join("");

    }


    /* =====================================================
       PAYMENT HISTORY
       ===================================================== */

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
                letter =>
                    letter.toUpperCase()
            );

    }


    function renderRecentPayments() {

        const body =
            $("recentPaymentsBody");


        if (!body) {

            return;

        }


        const recent =
            getRecentPayments();


        if (!recent.length) {

            body.innerHTML = `

                <tr>

                    <td colspan="7">

                        <div
                            class="fees-empty-state compact"
                        >

                            <div
                                class="empty-icon"
                            >
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

            recent.map(

                payment => {

                    const student =
                        getStudent(
                            paymentStudentId(
                                payment
                            )
                        );


                    const fee =
                        getFee(
                            payment.feeId ||
                            payment.fee_id
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

                                <span
                                    class="amount paid"
                                >
                                    ${money(
                                        payment.amount
                                    )}
                                </span>

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

            ).join("");

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


        if (
            due <= 0
        ) {

            showToast(
                "This fee is already fully paid.",
                "info"
            );

            return;

        }


        if (
            $("paymentFeeId")
        ) {

            $("paymentFeeId").value =
                feeId(fee);

        }


        if (
            $("paymentStudentId")
        ) {

            $("paymentStudentId").value =
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


        if (
            $("paymentAmount")
        ) {

            $("paymentAmount")
                .value = "";

            $("paymentAmount")
                .max =
                String(due);

        }


        if (
            $("paymentDate")
        ) {

            $("paymentDate")
                .value =
                todayISO();

        }


        if (
            $("paymentMethod")
        ) {

            $("paymentMethod")
                .value =
                "Cash";

        }


        if (
            $("paymentNote")
        ) {

            $("paymentNote")
                .value = "";

        }


        openModal(modal);

    }


    function closePaymentModal() {

        closeModal(
            $("feePaymentModal")
        );

    }


    function savePayment(event) {

        if (event) {

            event.preventDefault();

        }


        const feeIdValue =
            $("paymentFeeId")
                ?.value || "";


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


        const amount =
            numberValue(
                $("paymentAmount")
                    ?.value
            );


        const due =
            getDueAmount(
                fee
            );


        if (
            amount <= 0
        ) {

            showToast(
                "Enter a valid payment amount.",
                "error"
            );

            return;

        }


        if (
            amount > due
        ) {

            showToast(

                `Payment cannot exceed current due of ${money(
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
                feeStudentId(
                    fee
                ),

            amount:
                amount,

            paymentMethod:
                $("paymentMethod")
                    ?.value ||
                "Cash",

            date:
                $("paymentDate")
                    ?.value ||
                todayISO(),

            note:
                $("paymentNote")
                    ?.value
                    ?.trim() ||
                "",

            createdAt:
                new Date()
                    .toISOString()

        };


        fee.paidAmount =
            getPaidAmount(
                fee
            ) + amount;


        fee.dueAmount =
            Math.max(
                0,
                getTotalFee(
                    fee
                ) -
                fee.paidAmount
            );


        fee.status =
            calculateStatus(
                fee
            );


        fee.updatedAt =
            new Date()
                .toISOString();


        payments.push(
            payment
        );


        saveAll();


        closePaymentModal();

        renderAll();


        showToast(
            `Payment of ${money(
                amount
            )} recorded successfully.`,
            "success"
        );


        setTimeout(
            () => {

                const open =
                    window.confirm(
                        "Payment saved.\n\nOpen receipt now?"
                    );


                if (open) {

                    openReceiptPage(
                        payment.id
                    );

                }

            },

            350

        );

    }


    /* =====================================================
       EDIT FEE MODAL
       ===================================================== */

    function ensureEditFeeModal() {

        if (
            $("editFeeModal")
        ) {

            return;

        }


        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.id =
            "editFeeModal";


        wrapper.className =
            "fee-modal-overlay";


        wrapper.setAttribute(
            "aria-hidden",
            "true"
        );


        wrapper.innerHTML = `

            <div
                class="fee-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="editFeeModalTitle"
            >

                <div
                    class="fee-modal-header"
                >

                    <div>

                        <span
                            class="section-eyebrow"
                        >
                            FEE MANAGEMENT
                        </span>

                        <h2
                            id="editFeeModalTitle"
                        >
                            Edit Fee Record
                        </h2>

                        <p>
                            Update the fee structure without changing payment history.
                        </p>

                    </div>


                    <button
                        type="button"
                        class="modal-close-btn fee-modal-close"
                        id="closeEditFeeModal"
                        aria-label="Close Edit Fee"
                        title="Close"
                    >
                        ×
                    </button>

                </div>


                <form
                    id="editFeeForm"
                    class="fee-modal-form"
                >

                    <input
                        type="hidden"
                        id="editFeeId"
                    >


                    <div
                        class="fee-student-preview"
                    >

                        <div
                            class="fee-avatar fee-avatar-initials"
                            id="editFeeStudentAvatar"
                        >
                            ST
                        </div>

                        <div>

                            <strong
                                id="editFeeStudentName"
                            >
                                Student
                            </strong>

                            <span
                                id="editFeeStudentDetails"
                            >
                                Student details
                            </span>

                        </div>

                    </div>


                    <div
                        class="form-group"
                    >

                        <label
                            for="editFeeType"
                        >
                            Fee Type *
                        </label>

                        <select
                            id="editFeeType"
                            required
                        >

                            <option value="Tuition Fee">
                                Tuition Fee
                            </option>

                            <option value="Admission Fee">
                                Admission Fee
                            </option>

                            <option value="Annual Fee">
                                Annual Fee
                            </option>

                            <option value="Examination Fee">
                                Examination Fee
                            </option>

                            <option value="Transport Fee">
                                Transport Fee
                            </option>

                            <option value="Library Fee">
                                Library Fee
                            </option>

                            <option value="Computer Fee">
                                Computer Fee
                            </option>

                            <option value="Development Fee">
                                Development Fee
                            </option>

                            <option value="Hostel Fee">
                                Hostel Fee
                            </option>

                            <option value="Other">
                                Other
                            </option>

                        </select>

                    </div>


                    <div
                        class="form-group"
                        id="editCustomFeeTypeGroup"
                        style="display:none;"
                    >

                        <label
                            for="editFeeCustomType"
                        >
                            Custom Fee Type
                        </label>

                        <input
                            type="text"
                            id="editFeeCustomType"
                            maxlength="100"
                            placeholder="Enter fee type..."
                        >

                    </div>


                    <div
                        class="form-row"
                    >

                        <div
                            class="form-group"
                        >

                            <label
                                for="editFeeAcademicYear"
                            >
                                Academic Year *
                            </label>

                            <input
                                type="text"
                                id="editFeeAcademicYear"
                                required
                            >

                        </div>


                        <div
                            class="form-group"
                        >

                            <label
                                for="editFeeDueDate"
                            >
                                Due Date *
                            </label>

                            <input
                                type="date"
                                id="editFeeDueDate"
                                required
                            >

                        </div>

                    </div>


                    <div
                        class="form-group"
                    >

                        <label
                            for="editFeeTotal"
                        >
                            Total Fee *
                        </label>

                        <div
                            class="money-input"
                        >

                            <span>
                                ₹
                            </span>

                            <input
                                type="number"
                                id="editFeeTotal"
                                min="0"
                                step="0.01"
                                required
                            >

                        </div>

                    </div>


                    <div
                        class="payment-summary"
                    >

                        <div
                            class="summary-row"
                        >

                            <span>
                                Already Paid
                            </span>

                            <strong
                                id="editFeePaid"
                            >
                                ₹0.00
                            </strong>

                        </div>


                        <div
                            class="summary-row highlight"
                        >

                            <span>
                                New Due
                            </span>

                            <strong
                                id="editFeeDue"
                            >
                                ₹0.00
                            </strong>

                        </div>

                    </div>


                    <div
                        class="form-group"
                    >

                        <label
                            for="editFeeDescription"
                        >
                            Description
                        </label>

                        <textarea
                            id="editFeeDescription"
                            rows="3"
                            maxlength="500"
                            placeholder="Fee description..."
                        ></textarea>

                    </div>


                    <div
                        class="fee-modal-actions"
                    >

                        <button
                            type="button"
                            class="secondary-btn"
                            id="cancelEditFeeBtn"
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            class="primary-btn"
                        >
                            💾 Save Changes
                        </button>

                    </div>

                </form>

            </div>

        `;


        document.body.appendChild(
            wrapper
        );


        $("closeEditFeeModal")
            ?.addEventListener(
                "click",
                closeEditFeeModal
            );


        $("cancelEditFeeBtn")
            ?.addEventListener(
                "click",
                closeEditFeeModal
            );


        $("editFeeForm")
            ?.addEventListener(
                "submit",
                saveEditedFee
            );


        $("editFeeType")
            ?.addEventListener(
                "change",
                updateEditCustomType
            );


        $("editFeeTotal")
            ?.addEventListener(
                "input",
                updateEditFeeSummary
            );


        wrapper.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    wrapper
                ) {

                    closeEditFeeModal();

                }

            }
        );

    }


    function updateEditCustomType() {

        const type =
            $("editFeeType")
                ?.value || "";


        const group =
            $("editCustomFeeTypeGroup");


        const input =
            $("editFeeCustomType");


        if (!group) {

            return;

        }


        if (
            type === "Other"
        ) {

            group.style.display =
                "";

            if (input) {

                input.required =
                    true;

            }

        }

        else {

            group.style.display =
                "none";

            if (input) {

                input.required =
                    false;

            }

        }

    }


    function updateEditFeeSummary() {

        const total =
            numberValue(
                $("editFeeTotal")
                    ?.value
            );


        const fee =
            getFee(
                $("editFeeId")
                    ?.value
            );


        const paid =
            fee
                ? getPaidAmount(
                    fee
                )
                : 0;


        const due =
            Math.max(
                0,
                total - paid
            );


        setText(
            "editFeePaid",
            money(paid)
        );


        setText(
            "editFeeDue",
            money(due)
        );

    }


    function openEditFeeModal(
        fee
    ) {

        ensureEditFeeModal();


        if (!fee) {

            return;

        }


        editingFeeId =
            feeId(fee);


        const student =
            getStudent(
                feeStudentId(
                    fee
                )
            );


        $("editFeeId").value =
            editingFeeId;


        setText(
            "editFeeStudentName",
            studentName(
                student
            )
        );


        setText(
            "editFeeStudentDetails",

            `ID: ${studentId(
                student
            )} · Class ${
                cleanClass(
                    student?.className ||
                    student?.class
                ) || "—"
            } · Section ${
                cleanSection(
                    student?.section ||
                    student?.sectionName
                ) || "—"
            }`

        );


        const avatar =
            $("editFeeStudentAvatar");


        if (avatar) {

            const photo =
                student?.photo ||
                student?.photoUrl ||
                student?.profilePhoto ||
                "";


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

            }

            else {

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


        const type =
            getFeeType(
                fee
            );


        const knownTypes = [

            "Tuition Fee",

            "Admission Fee",

            "Annual Fee",

            "Examination Fee",

            "Transport Fee",

            "Library Fee",

            "Computer Fee",

            "Development Fee",

            "Hostel Fee"

        ];


        if (
            $("editFeeType")
        ) {

            if (
                knownTypes.includes(
                    type
                )
            ) {

                $("editFeeType")
                    .value =
                    type;

                $("editCustomFeeTypeGroup")
                    .style.display =
                    "none";

            }

            else {

                $("editFeeType")
                    .value =
                    "Other";

                $("editCustomFeeTypeGroup")
                    .style.display =
                    "";

                $("editFeeCustomType")
                    .value =
                    type;

            }

        }


        $("editFeeAcademicYear")
            .value =

            fee.academicYear ||
            fee.academic_year ||
            "2026-27";


        $("editFeeDueDate")
            .value =
            getDueDate(
                fee
            );


        $("editFeeTotal")
            .value =
            getTotalFee(
                fee
            );


        $("editFeeDescription")
            .value =

            fee.description ||
            "";


        updateEditFeeSummary();


        openModal(
            $("editFeeModal")
        );

    }


    function closeEditFeeModal() {

        closeModal(
            $("editFeeModal")
        );


        editingFeeId =
            "";

    }


    function saveEditedFee(
        event
    ) {

        event.preventDefault();


        const fee =
            getFee(
                $("editFeeId")
                    ?.value
            );


        if (!fee) {

            showToast(
                "Fee record not found.",
                "error"
            );

            return;

        }


        let feeType =
            $("editFeeType")
                ?.value || "";


        if (
            feeType === "Other"
        ) {

            feeType =
                $("editFeeCustomType")
                    ?.value
                    ?.trim() || "";


            if (!feeType) {

                showToast(
                    "Enter custom fee type.",
                    "error"
                );

                return;

            }

        }


        const academicYear =
            $("editFeeAcademicYear")
                ?.value
                ?.trim() || "";


        const dueDate =
            $("editFeeDueDate")
                ?.value || "";


        const totalFee =
            numberValue(
                $("editFeeTotal")
                    ?.value
            );


        const paid =
            getPaidAmount(
                fee
            );


        if (!academicYear) {

            showToast(
                "Enter academic year.",
                "error"
            );

            return;

        }


        if (!dueDate) {

            showToast(
                "Select due date.",
                "error"
            );

            return;

        }


        if (
            totalFee <= 0
        ) {

            showToast(
                "Total fee must be greater than ₹0.",
                "error"
            );

            return;

        }


        if (
            totalFee < paid
        ) {

            showToast(

                `Total fee cannot be lower than already paid amount of ${money(
                    paid
                )}.`,

                "error"

            );

            return;

        }


        fee.feeType =
            feeType;


        fee.academicYear =
            academicYear;


        fee.dueDate =
            dueDate;


        fee.totalFee =
            totalFee;


        fee.paidAmount =
            paid;


        fee.dueAmount =
            Math.max(
                0,
                totalFee - paid
            );


        fee.status =
            calculateStatus(
                fee
            );


        fee.description =

            $("editFeeDescription")
                ?.value
                ?.trim() || "";


        fee.updatedAt =
            new Date()
                .toISOString();


        saveAll();


        closeEditFeeModal();

        renderAll();


        showToast(
            "Fee record updated successfully.",
            "success"
        );

    }


    /* =====================================================
       DELETE FEE
       ===================================================== */

    function deleteFeeRecord(
        fee
    ) {

        if (!fee) {

            return;

        }


        const id =
            feeId(fee);


        const student =
            getStudent(
                feeStudentId(
                    fee
                )
            );


        const linkedPayments =
            payments.filter(

                payment =>

                    String(
                        payment.feeId ||
                        payment.fee_id ||
                        ""
                    ) === id

            );


        if (
            linkedPayments.length
        ) {

            window.alert(

                "This fee record has payment history and cannot be deleted.\n\n" +

                "This protection keeps receipts and financial history safe.\n\n" +

                "You can edit the fee record or record another payment."

            );

            return;

        }


        const confirmed =
            window.confirm(

                `Delete fee record?\n\n` +

                `Student: ${studentName(
                    student
                )}\n` +

                `Fee: ${getFeeType(
                    fee
                )}\n` +

                `Amount: ${money(
                    getTotalFee(
                        fee
                    )
                )}\n\n` +

                "This action cannot be undone."

            );


        if (!confirmed) {

            return;

        }


        fees =
            fees.filter(

                item =>
                    feeId(item) !==
                    id

            );


        saveAll();

        renderAll();


        showToast(
            "Fee record deleted successfully.",
            "success"
        );

    }


    /* =====================================================
       RECEIPTS
       ===================================================== */

    function openReceiptPage(
        id
    ) {

        if (!id) {

            return;

        }


        const url =
            `fee-receipt.html?id=${encodeURIComponent(
                id
            )}`;


        window.location.href =
            url;

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

        openModal(modal);

    }


    function closeReceiptsModal() {

        closeModal(
            $("feeReceiptsModal")
        );

    }


    function renderReceiptsModal() {

        const body =
            $("feeReceiptsBody");


        if (!body) {

            return;

        }


        const list =
            getRecentPayments();


        if (!list.length) {

            body.innerHTML = `

                <div
                    class="fees-empty-state"
                >

                    <div
                        class="empty-icon"
                    >
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

            list.map(

                payment => {

                    const student =
                        getStudent(
                            paymentStudentId(
                                payment
                            )
                        );


                    return `

                        <div
                            class="fee-receipt-list-item"
                            style="
                                display:flex;
                                align-items:center;
                                justify-content:space-between;
                                gap:12px;
                                padding:14px 0;
                                border-bottom:1px solid #eef2f7;
                            "
                        >

                            <div>

                                <strong>
                                    ${escapeHtml(
                                        payment.receiptNumber ||
                                        "—"
                                    )}
                                </strong>

                                <div>
                                    ${escapeHtml(
                                        studentName(
                                            student
                                        )
                                    )}
                                </div>

                                <small>
                                    ${escapeHtml(
                                        formatDate(
                                            payment.date ||
                                            payment.createdAt
                                        )
                                    )}
                                </small>

                            </div>


                            <div
                                style="
                                    text-align:right;
                                "
                            >

                                <strong>
                                    ${money(
                                        payment.amount
                                    )}
                                </strong>

                                <br>

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

            ).join("");

    }


    /* =====================================================
       PENDING DUES
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

        openModal(modal);

    }


    function closeDuesModal() {

        closeModal(
            $("feeDuesModal")
        );

    }


    function renderDuesModal() {

        const body =
            $("feeDuesBody");


        if (!body) {

            return;

        }


        const dues =

            fees

                .map(
                    fee => ({

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
                    item =>
                        item.due > 0
                )

                .sort(
                    (a, b) =>
                        b.due - a.due
                );


        if (!dues.length) {

            body.innerHTML = `

                <div
                    class="fees-empty-state"
                >

                    <div
                        class="empty-icon"
                    >
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

            dues.map(

                ({
                    fee,
                    student,
                    due
                }) => `

                    <div
                        class="fee-due-list-item"
                        style="
                            display:flex;
                            align-items:center;
                            justify-content:space-between;
                            gap:14px;
                            padding:14px 0;
                            border-bottom:1px solid #eef2f7;
                        "
                    >

                        <div>

                            <strong>
                                ${escapeHtml(
                                    studentName(
                                        student
                                    )
                                )}
                            </strong>

                            <div>
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
                            </div>

                            <small>
                                ${escapeHtml(
                                    getFeeType(
                                        fee
                                    )
                                )}
                            </small>

                        </div>


                        <div
                            style="
                                text-align:right;
                            "
                        >

                            <strong>
                                ${money(
                                    due
                                )}
                            </strong>

                            <br>

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

            ).join("");

    }


    /* =====================================================
       SAVE ALL
       ===================================================== */

    function saveAll() {

        writeStorage(
            STORAGE.fees,
            fees
        );


        writeStorage(
            STORAGE.payments,
            payments
        );

    }


    /* =====================================================
       RENDER ALL
       ===================================================== */

    function renderAll() {

        renderKPIs();

        renderFeesTable();

        renderRecentPayments();

    }


    /* =====================================================
       REFRESH DATA
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


    /* =====================================================
       EVENT BINDING
       ===================================================== */

    function bindEvents() {


        /* Create fee */

        $("createFeeRecordBtn")
            ?.addEventListener(
                "click",
                openCreateFeeModal
            );


        $("closeCreateFeeModal")
            ?.addEventListener(
                "click",
                closeCreateFeeModal
            );


        $("cancelCreateFeeBtn")
            ?.addEventListener(
                "click",
                closeCreateFeeModal
            );


        $("createFeeForm")
            ?.addEventListener(
                "submit",
                saveFeeRecord
            );


        $("createFeeStudent")
            ?.addEventListener(
                "change",
                updateCreateStudentPreview
            );


        $("createFeeType")
            ?.addEventListener(
                "change",
                updateCustomFeeType
            );


        $("createFeeTotal")
            ?.addEventListener(
                "input",
                updateCreateSummary
            );


        $("createFeeInitialPayment")
            ?.addEventListener(
                "input",
                updateCreateSummary
            );


        /* Class / section */

        $("feeClass")
            ?.addEventListener(
                "change",
                populateSectionFilter
            );


        /* Filters */

        $("applyFeeFilterBtn")
            ?.addEventListener(
                "click",
                applyFilters
            );


        $("clearFeeFilterBtn")
            ?.addEventListener(
                "click",
                clearFilters
            );


        /* Refresh */

        $("refreshFeesBtn")
            ?.addEventListener(
                "click",
                () =>
                    refreshData()
            );


        /* Record payment */

        $("recordPaymentBtn")
            ?.addEventListener(
                "click",
                () => {

                    if (
                        !fees.length
                    ) {

                        showToast(
                            "Create a fee record first.",
                            "error"
                        );

                        return;

                    }


                    const fee =
                        fees.find(
                            item =>
                                getDueAmount(
                                    item
                                ) > 0
                        );


                    if (fee) {

                        openPaymentModal(
                            fee
                        );

                    }

                    else {

                        showToast(
                            "No pending fee record is available.",
                            "info"
                        );

                    }

                }
            );


        /* Receipts */

        $("viewReceiptsBtn")
            ?.addEventListener(
                "click",
                openReceiptsModal
            );


        $("viewAllPaymentsBtn")
            ?.addEventListener(
                "click",
                openReceiptsModal
            );


        $("closeFeeReceiptsModal")
            ?.addEventListener(
                "click",
                closeReceiptsModal
            );


        /* Dues */

        $("viewDuesBtn")
            ?.addEventListener(
                "click",
                openDuesModal
            );


        $("closeFeeDuesModal")
            ?.addEventListener(
                "click",
                closeDuesModal
            );


        /* Payment */

        $("feePaymentForm")
            ?.addEventListener(
                "submit",
                savePayment
            );


        $("closeFeePaymentModal")
            ?.addEventListener(
                "click",
                closePaymentModal
            );


        $("cancelFeePaymentBtn")
            ?.addEventListener(
                "click",
                closePaymentModal
            );


        /* Delegated table actions */

        document.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-action]"
                    );


                if (!button) {

                    return;

                }


                const action =
                    button.dataset.action;


                const fee =
                    getFee(
                        button.dataset.feeId
                    );


                if (
                    action ===
                    "edit-fee"
                ) {

                    event.preventDefault();

                    if (fee) {

                        openEditFeeModal(
                            fee
                        );

                    }

                    return;

                }


                if (
                    action ===
                    "delete-fee"
                ) {

                    event.preventDefault();

                    if (fee) {

                        deleteFeeRecord(
                            fee
                        );

                    }

                    return;

                }


                if (
                    action ===
                    "open-payment"
                ) {

                    event.preventDefault();


                    closeDuesModal();


                    if (fee) {

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


                    closeReceiptsModal();


                    openReceiptPage(
                        button.dataset
                            .paymentId
                    );

                }

            }
        );


        /* Escape */

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Escape"
                ) {

                    closeAllModals();

                }

            }
        );


        /* Outside modal */

        document.addEventListener(
            "click",
            event => {

                document
                    .querySelectorAll(
                        ".fee-modal-overlay.show"
                    )
                    .forEach(
                        modal => {

                            if (
                                event.target ===
                                modal
                            ) {

                                closeModal(
                                    modal
                                );

                            }

                        }
                    );

            }
        );


        /* Storage sync */

        window.addEventListener(
            "storage",
            event => {

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
            id =>
                openReceiptPage(
                    id
                ),

        openCreateFee:
            () =>
                openCreateFeeModal(),

        openEditFee:
            id => {

                const fee =
                    getFee(id);

                if (fee) {

                    openEditFeeModal(
                        fee
                    );

                }

            }

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

    }

    else {

        init();

    }


})();
