/* =========================================================
   SMARTSCHOOL360 — ADVANCED FEE ANALYTICS ENGINE
   Functional Analytics
   Uses real SmartSchool360 fee/payment data
   Built by Priyanshu Kumar
   ========================================================= */

(() => {
    "use strict";


    /* =====================================================
       STORAGE
       ===================================================== */

    const STORAGE = {
        students: "smartschool_students",
        fees: "smartschool_fees",
        payments: "smartschool_fee_payments"
    };


    /* =====================================================
       STATE
       ===================================================== */

    const state = {

        students: [],

        fees: [],

        payments: [],

        filteredPayments: [],

        filters: {

            academicYear: "",

            className: "",

            section: "",

            dateFrom: "",

            dateTo: ""

        }

    };


    /* =====================================================
       HELPERS
       ===================================================== */

    const $ = (id) =>
        document.getElementById(id);


    function safeArray(value) {

        return Array.isArray(value)
            ? value
            : [];

    }


    function readStorage(key) {

        try {

            const raw =
                localStorage.getItem(key);

            if (!raw) {
                return [];
            }

            const parsed =
                JSON.parse(raw);

            return safeArray(parsed);

        } catch (error) {

            console.error(
                `SmartSchool360: Failed to read ${key}`,
                error
            );

            return [];

        }

    }


    function number(value) {

        const parsed =
            Number(value);

        return Number.isFinite(parsed)
            ? parsed
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
        ).format(
            number(value)
        );

    }


    function escapeHTML(value) {

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


    function normalizeDate(value) {

        if (!value) {
            return "";
        }


        const text =
            String(value).trim();


        if (
            /^\d{4}-\d{2}-\d{2}$/
                .test(text)
        ) {
            return text;
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "";
        }


        return [
            date.getFullYear(),

            String(
                date.getMonth() + 1
            ).padStart(2, "0"),

            String(
                date.getDate()
            ).padStart(2, "0")

        ].join("-");

    }


    function displayDate(value) {

        const normalized =
            normalizeDate(value);


        if (!normalized) {
            return "—";
        }


        const parts =
            normalized.split("-");


        return `${parts[2]}/${parts[1]}/${parts[0]}`;

    }


    function getStudentById(studentId) {

        return state.students.find(
            student =>
                String(
                    student.id
                ) ===
                String(
                    studentId
                )
        );

    }


    function getFeeById(feeId) {

        return state.fees.find(
            fee =>
                String(
                    fee.id
                ) ===
                String(
                    feeId
                )
        );

    }


    function getPaymentStudent(payment) {

        return getStudentById(
            payment.studentId
        );

    }


    function getPaymentFee(payment) {

        return getFeeById(
            payment.feeId
        );

    }


    function setText(
        id,
        value
    ) {

        const element =
            $(id);

        if (element) {

            element.textContent =
                String(value);

        }

    }


    /* =====================================================
       TOAST
       ===================================================== */

    let toastTimer = null;


    function showToast(message) {

        const toast =
            $("feeAnalyticsToast");


        if (!toast) {
            return;
        }


        toast.textContent =
            message;


        toast.classList.add(
            "show"
        );


        clearTimeout(
            toastTimer
        );


        toastTimer =
            setTimeout(
                () => {

                    toast.classList.remove(
                        "show"
                    );

                },
                2800
            );

    }


    /* =====================================================
       LOAD DATA
       ===================================================== */

    function loadData() {

        state.students =
            readStorage(
                STORAGE.students
            );


        state.fees =
            readStorage(
                STORAGE.fees
            );


        state.payments =
            readStorage(
                STORAGE.payments
            )
                .map(
                    payment => ({
                        ...payment,

                        amount:
                            number(
                                payment.amount
                            ),

                        date:
                            normalizeDate(
                                payment.date ||
                                payment.createdAt
                            ),

                        paymentMethod:
                            payment.paymentMethod ||
                            "Unknown",

                        studentId:
                            payment.studentId ||
                            "",

                        feeId:
                            payment.feeId ||
                            "",

                        receiptNumber:
                            payment.receiptNumber ||
                            payment.id ||
                            "—"
                    })
                );


        console.log(
            "SmartSchool360 Fee Analytics loaded:",
            {
                students:
                    state.students.length,

                fees:
                    state.fees.length,

                payments:
                    state.payments.length
            }
        );

    }


    /* =====================================================
       FILTER OPTIONS
       ===================================================== */

    function populateFilters() {

        const yearSelect =
            $("analyticsAcademicYear");

        const classSelect =
            $("analyticsClass");

        const sectionSelect =
            $("analyticsSection");


        if (
            !yearSelect ||
            !classSelect ||
            !sectionSelect
        ) {
            return;
        }


        const currentYear =
            yearSelect.value;

        const currentClass =
            classSelect.value;

        const currentSection =
            sectionSelect.value;


        const years = [
            ...new Set(
                state.fees
                    .map(
                        fee =>
                            fee.academicYear
                    )
                    .filter(Boolean)
            )
        ].sort();


        const classes = [
            ...new Set(
                state.fees
                    .map(
                        fee =>
                            cleanClass(
                                fee.className ||
                                getStudentById(
                                    fee.studentId
                                )?.className ||
                                ""
                            )
                    )
                    .filter(Boolean)
            )
        ].sort(
            (a, b) =>
                String(a).localeCompare(
                    String(b),
                    undefined,
                    {
                        numeric: true
                    }
                )
        );


        const sections = [
            ...new Set(
                state.fees
                    .map(
                        fee =>
                            cleanSection(
                                fee.section ||
                                getStudentById(
                                    fee.studentId
                                )?.section ||
                                ""
                            )
                    )
                    .filter(Boolean)
            )
        ].sort();


        yearSelect.innerHTML = `
            <option value="">
                All Academic Years
            </option>
        `;


        years.forEach(
            year => {

                yearSelect.insertAdjacentHTML(
                    "beforeend",
                    `
                    <option value="${escapeHTML(
                        year
                    )}">
                        ${escapeHTML(
                            year
                        )}
                    </option>
                    `
                );

            }
        );


        classSelect.innerHTML = `
            <option value="">
                All Classes
            </option>
        `;


        classes.forEach(
            className => {

                classSelect.insertAdjacentHTML(
                    "beforeend",
                    `
                    <option value="${escapeHTML(
                        className
                    )}">
                        Class ${escapeHTML(
                            className
                        )}
                    </option>
                    `
                );

            }
        );


        sectionSelect.innerHTML = `
            <option value="">
                All Sections
            </option>
        `;


        sections.forEach(
            section => {

                sectionSelect.insertAdjacentHTML(
                    "beforeend",
                    `
                    <option value="${escapeHTML(
                        section
                    )}">
                        Section ${escapeHTML(
                            section
                        )}
                    </option>
                    `
                );

            }
        );


        if (
            [
                ...yearSelect.options
            ].some(
                option =>
                    option.value ===
                    currentYear
            )
        ) {

            yearSelect.value =
                currentYear;

        }


        if (
            [
                ...classSelect.options
            ].some(
                option =>
                    option.value ===
                    currentClass
            )
        ) {

            classSelect.value =
                currentClass;

        }


        if (
            [
                ...sectionSelect.options
            ].some(
                option =>
                    option.value ===
                    currentSection
            )
        ) {

            sectionSelect.value =
                currentSection;

        }

    }


    /* =====================================================
       READ FILTERS
       ===================================================== */

    function readFilters() {

        state.filters = {

            academicYear:
                $("analyticsAcademicYear")
                    ?.value ||
                "",

            className:
                cleanClass(
                    $("analyticsClass")
                        ?.value ||
                    ""
                ),

            section:
                cleanSection(
                    $("analyticsSection")
                        ?.value ||
                    ""
                ),

            dateFrom:
                $("analyticsDateFrom")
                    ?.value ||
                "",

            dateTo:
                $("analyticsDateTo")
                    ?.value ||
                ""

        };

    }


    /* =====================================================
       PAYMENT FILTER
       ===================================================== */

    function paymentMatchesFilters(
        payment
    ) {

        const fee =
            getPaymentFee(
                payment
            );


        const student =
            getPaymentStudent(
                payment
            );


        const academicYear =
            fee?.academicYear ||
            "";


        const className =
            cleanClass(
                fee?.className ||
                student?.className ||
                ""
            );


        const section =
            cleanSection(
                fee?.section ||
                student?.section ||
                ""
            );


        const paymentDate =
            normalizeDate(
                payment.date
            );


        if (
            state.filters.academicYear &&
            String(
                academicYear
            ) !==
            String(
                state.filters.academicYear
            )
        ) {

            return false;

        }


        if (
            state.filters.className &&
            className !==
            state.filters.className
        ) {

            return false;

        }


        if (
            state.filters.section &&
            section !==
            state.filters.section
        ) {

            return false;

        }


        if (
            state.filters.dateFrom &&
            (
                !paymentDate ||
                paymentDate <
                state.filters.dateFrom
            )
        ) {

            return false;

        }


        if (
            state.filters.dateTo &&
            (
                !paymentDate ||
                paymentDate >
                state.filters.dateTo
            )
        ) {

            return false;

        }


        return true;

    }


    /* =====================================================
       APPLY FILTERS
       ===================================================== */

    function applyFilters(
        showMessage = false
    ) {

        readFilters();


        state.filteredPayments =
            state.payments.filter(
                payment =>
                    paymentMatchesFilters(
                        payment
                    )
            );


        renderAll();


        if (showMessage) {

            showToast(
                "Fee analytics filters applied."
            );

        }

    }


    /* =====================================================
       KPI
       ===================================================== */

    function renderKPIs() {

        const payments =
            state.filteredPayments;


        const amounts =
            payments.map(
                payment =>
                    number(
                        payment.amount
                    )
            );


        const total =
            amounts.reduce(
                (sum, value) =>
                    sum + value,
                0
            );


        const transactionCount =
            payments.length;


        const average =
            transactionCount > 0
                ? total /
                  transactionCount
                : 0;


        const largest =
            transactionCount > 0
                ? Math.max(
                    ...amounts
                )
                : 0;


        const uniqueStudents =
            new Set(
                payments
                    .map(
                        payment =>
                            payment.studentId
                    )
                    .filter(Boolean)
            );


        const activeDays =
            new Set(
                payments
                    .map(
                        payment =>
                            normalizeDate(
                                payment.date
                            )
                    )
                    .filter(Boolean)
            );


        setText(
            "analyticsCollected",
            money(total)
        );


        setText(
            "analyticsTransactions",
            transactionCount
        );


        setText(
            "analyticsAverage",
            money(average)
        );


        setText(
            "analyticsLargest",
            money(largest)
        );


        setText(
            "analyticsStudents",
            uniqueStudents.size
        );


        setText(
            "analyticsActiveDays",
            activeDays.size
        );

    }


    /* =====================================================
       TREND DATA
       ===================================================== */

    function getTrendData() {

        const grouped = {};


        state.filteredPayments.forEach(
            payment => {

                const date =
                    normalizeDate(
                        payment.date
                    );


                if (!date) {
                    return;
                }


                if (
                    !grouped[date]
                ) {

                    grouped[date] = 0;

                }


                grouped[date] +=
                    number(
                        payment.amount
                    );

            }
        );


        return Object.entries(
            grouped
        )
            .sort(
                (a, b) =>
                    a[0].localeCompare(
                        b[0]
                    )
            )
            .map(
                ([date, amount]) => ({
                    date,
                    amount
                })
            );

    }


    /* =====================================================
       TREND CHART
       ===================================================== */

    function renderTrendChart() {

        const container =
            $("feeTrendChart");


        if (!container) {
            return;
        }


        const data =
            getTrendData();


        setText(
            "trendRecordCount",
            `${data.length} ${
                data.length === 1
                    ? "day"
                    : "days"
            }`
        );


        if (!data.length) {

            container.innerHTML = `
                <div class="chart-empty">

                    <div>
                        📈
                    </div>

                    <h3>
                        No collection data
                    </h3>

                    <p>
                        Payment transactions matching
                        the selected filters will appear here.
                    </p>

                </div>
            `;

            return;
        }


        const maxValue =
            Math.max(
                ...data.map(
                    item =>
                        item.amount
                )
            );


        const maxChartValue =
            maxValue > 0
                ? maxValue
                : 1;


        const chartRows =
            5;


        const bars =
            data.map(
                item => {

                    const percentage =
                        (
                            item.amount /
                            maxChartValue
                        ) *
                        100;


                    const height =
                        Math.max(
                            3,
                            percentage
                        );


                    return `
                        <div
                            class="chart-bar-group"
                            title="${escapeHTML(
                                displayDate(
                                    item.date
                                )
                            )}: ${escapeHTML(
                                money(
                                    item.amount
                                )
                            )}"
                        >

                            <span
                                class="chart-bar-value"
                            >
                                ${escapeHTML(
                                    money(
                                        item.amount
                                    )
                                )}
                            </span>

                            <div
                                class="chart-bar"
                                style="height:${height}%"
                            ></div>

                            <span
                                class="chart-bar-label"
                            >
                                ${escapeHTML(
                                    displayDate(
                                        item.date
                                    )
                                )}
                            </span>

                        </div>
                    `;

                }
            ).join("");


        let gridLines = "";


        for (
            let index = 0;
            index < chartRows;
            index++
        ) {

            gridLines += `
                <div
                    class="chart-grid-line"
                ></div>
            `;

        }


        const yLabels = [
            maxChartValue,
            maxChartValue * 0.75,
            maxChartValue * 0.5,
            maxChartValue * 0.25,
            0
        ];


        container.innerHTML = `

            <div class="trend-chart-inner">

                <div
                    class="chart-grid-lines"
                >
                    ${gridLines}
                </div>


                <div
                    class="chart-y-labels"
                >

                    ${yLabels
                        .map(
                            value =>
                                `
                                <span>
                                    ${escapeHTML(
                                        money(
                                            value
                                        )
                                    )}
                                </span>
                                `
                        )
                        .join("")}

                </div>


                <div
                    class="chart-bars"
                >
                    ${bars}
                </div>

            </div>

        `;

    }


    /* =====================================================
       PAYMENT METHOD
       ===================================================== */

    function renderPaymentMethods() {

        const container =
            $("paymentMethodList");


        if (!container) {
            return;
        }


        const grouped = {};


        state.filteredPayments.forEach(
            payment => {

                const method =
                    payment.paymentMethod ||
                    "Unknown";


                if (
                    !grouped[method]
                ) {

                    grouped[method] = {
                        amount: 0,
                        count: 0
                    };

                }


                grouped[method].amount +=
                    number(
                        payment.amount
                    );


                grouped[method].count +=
                    1;

            }
        );


        const methods =
            Object.entries(
                grouped
            ).sort(
                (a, b) =>
                    b[1].amount -
                    a[1].amount
            );


        if (!methods.length) {

            container.innerHTML = `
                <div class="chart-empty compact">

                    <div>
                        💳
                    </div>

                    <h3>
                        No payment data
                    </h3>

                    <p>
                        Payment method analytics
                        will appear here.
                    </p>

                </div>
            `;

            return;
        }


        const total =
            methods.reduce(
                (sum, [, data]) =>
                    sum +
                    data.amount,
                0
            );


        const icons = {

            Cash: "💵",

            UPI: "📱",

            Card: "💳",

            "Bank Transfer": "🏦",

            Cheque: "🧾",

            Online: "🌐"

        };


        container.innerHTML =
            methods
                .map(
                    ([method, data]) => {

                        const percentage =
                            total > 0
                                ? (
                                    data.amount /
                                    total
                                ) *
                                  100
                                : 0;


                        return `
                            <div
                                class="method-item"
                            >

                                <div
                                    class="method-top"
                                >

                                    <div
                                        class="method-name"
                                    >

                                        <span
                                            class="method-icon"
                                        >
                                            ${icons[
                                                method
                                            ] || "💰"}
                                        </span>

                                        ${escapeHTML(
                                            method
                                        )}

                                    </div>


                                    <strong
                                        class="method-amount"
                                    >
                                        ${escapeHTML(
                                            money(
                                                data.amount
                                            )
                                        )}
                                    </strong>

                                </div>


                                <div
                                    class="method-progress"
                                >

                                    <div
                                        class="method-progress-bar"
                                        style="width:${percentage}%"
                                    ></div>

                                </div>


                                <div
                                    class="method-meta"
                                >

                                    <span>
                                        ${
                                            data.count
                                        } ${
                                            data.count === 1
                                                ? "transaction"
                                                : "transactions"
                                        }
                                    </span>

                                    <span>
                                        ${percentage.toFixed(
                                            1
                                        )}%
                                    </span>

                                </div>

                            </div>
                        `;

                    }
                )
                .join("");

    }


    /* =====================================================
       CLASS PERFORMANCE
       ===================================================== */

    function renderClassPerformance() {

        const container =
            $("classPerformanceList");


        if (!container) {
            return;
        }


        const grouped = {};


        state.filteredPayments.forEach(
            payment => {

                const student =
                    getPaymentStudent(
                        payment
                    );


                const fee =
                    getPaymentFee(
                        payment
                    );


                const className =
                    cleanClass(
                        fee?.className ||
                        student?.className ||
                        "Unknown"
                    );


                if (
                    !grouped[className]
                ) {

                    grouped[className] = {
                        amount: 0,
                        transactions: 0,
                        students: new Set()
                    };

                }


                grouped[className].amount +=
                    number(
                        payment.amount
                    );


                grouped[className]
                    .transactions += 1;


                if (
                    payment.studentId
                ) {

                    grouped[className]
                        .students
                        .add(
                            String(
                                payment.studentId
                            )
                        );

                }

            }
        );


        const classes =
            Object.entries(
                grouped
            ).sort(
                (a, b) =>
                    b[1].amount -
                    a[1].amount
            );


        if (!classes.length) {

            container.innerHTML = `
                <div class="chart-empty compact">

                    <div>
                        🏫
                    </div>

                    <h3>
                        No class data
                    </h3>

                    <p>
                        Class collection performance
                        will appear here.
                    </p>

                </div>
            `;

            return;
        }


        const maxAmount =
            Math.max(
                ...classes.map(
                    ([, data]) =>
                        data.amount
                )
            );


        container.innerHTML =
            classes
                .map(
                    ([className, data]) => {

                        const percentage =
                            maxAmount > 0
                                ? (
                                    data.amount /
                                    maxAmount
                                ) *
                                  100
                                : 0;


                        return `
                            <div
                                class="class-performance-item"
                            >

                                <div
                                    class="class-performance-top"
                                >

                                    <strong
                                        class="class-name"
                                    >
                                        ${
                                            className ===
                                            "Unknown"
                                                ? "Unknown Class"
                                                : `Class ${escapeHTML(
                                                      className
                                                  )}`
                                        }
                                    </strong>


                                    <strong
                                        class="class-amount"
                                    >
                                        ${escapeHTML(
                                            money(
                                                data.amount
                                            )
                                        )}
                                    </strong>

                                </div>


                                <div
                                    class="class-progress"
                                >

                                    <div
                                        class="class-progress-bar"
                                        style="width:${percentage}%"
                                    ></div>

                                </div>


                                <div
                                    class="class-meta"
                                >

                                    <span>
                                        ${
                                            data.students.size
                                        } ${
                                            data.students.size === 1
                                                ? "student"
                                                : "students"
                                        }
                                    </span>

                                    <span>
                                        ${
                                            data.transactions
                                        } ${
                                            data.transactions === 1
                                                ? "transaction"
                                                : "transactions"
                                        }
                                    </span>

                                </div>

                            </div>
                        `;

                    }
                )
                .join("");

    }


    /* =====================================================
       TOP STUDENTS
       ===================================================== */

    function renderTopStudents() {

        const body =
            $("topStudentsBody");


        if (!body) {
            return;
        }


        const grouped = {};


        state.filteredPayments.forEach(
            payment => {

                const student =
                    getPaymentStudent(
                        payment
                    );


                const studentId =
                    String(
                        payment.studentId ||
                        student?.id ||
                        ""
                    );


                if (!studentId) {
                    return;
                }


                if (
                    !grouped[studentId]
                ) {

                    grouped[studentId] = {

                        student,

                        amount: 0,

                        transactions: 0

                    };

                }


                grouped[studentId].amount +=
                    number(
                        payment.amount
                    );


                grouped[studentId]
                    .transactions += 1;

            }
        );


        const students =
            Object.values(
                grouped
            )
                .sort(
                    (a, b) =>
                        b.amount -
                        a.amount
                )
                .slice(
                    0,
                    10
                );


        setText(
            "topStudentCount",
            `${students.length} ${
                students.length === 1
                    ? "student"
                    : "students"
            }`
        );


        if (!students.length) {

            body.innerHTML = `
                <tr>

                    <td colspan="6">

                        <div class="chart-empty">

                            <div>
                                🏆
                            </div>

                            <h3>
                                No collection records
                            </h3>

                            <p>
                                Student payment data
                                will appear here.
                            </p>

                        </div>

                    </td>

                </tr>
            `;

            return;
        }


        body.innerHTML =
            students
                .map(
                    (item, index) => {

                        const student =
                            item.student ||
                            {};


                        const name =
                            student.name ||
                            "Unknown Student";


                        const studentId =
                            student.id ||
                            "—";


                        const className =
                            cleanClass(
                                student.className ||
                                ""
                            );


                        const initials =
                            name
                                .split(
                                    /\s+/
                                )
                                .map(
                                    part =>
                                        part
                                            .charAt(
                                                0
                                            )
                                            .toUpperCase()
                                )
                                .slice(
                                    0,
                                    2
                                )
                                .join("");


                        const rank =
                            index + 1;


                        const rankClass =
                            rank === 1
                                ? "top-one"
                                : rank === 2
                                ? "top-two"
                                : rank === 3
                                ? "top-three"
                                : "";


                        const avatar =
                            student.photo
                                ? `
                                    <img
                                        src="${escapeHTML(
                                            student.photo
                                        )}"
                                        alt=""
                                    >
                                `
                                : escapeHTML(
                                    initials ||
                                    "ST"
                                );


                        return `
                            <tr>

                                <td>

                                    <span
                                        class="
                                            rank-number
                                            ${rankClass}
                                        "
                                    >
                                        ${rank}
                                    </span>

                                </td>


                                <td>

                                    <div
                                        class="analytics-student-cell"
                                    >

                                        <div
                                            class="analytics-avatar"
                                        >
                                            ${avatar}
                                        </div>


                                        <div>

                                            <div
                                                class="analytics-student-name"
                                            >
                                                ${escapeHTML(
                                                    name
                                                )}
                                            </div>

                                            <div
                                                class="analytics-student-meta"
                                            >
                                                ${escapeHTML(
                                                    student.parentPhone ||
                                                    ""
                                                )}
                                            </div>

                                        </div>

                                    </div>

                                </td>


                                <td>
                                    ${escapeHTML(
                                        studentId
                                    )}
                                </td>


                                <td>
                                    ${
                                        className
                                            ? `Class ${escapeHTML(
                                                  className
                                              )}`
                                            : "—"
                                    }
                                </td>


                                <td>
                                    ${
                                        item.transactions
                                    }
                                </td>


                                <td>

                                    <strong
                                        class="amount-strong"
                                    >
                                        ${escapeHTML(
                                            money(
                                                item.amount
                                            )
                                        )}
                                    </strong>

                                </td>

                            </tr>
                        `;

                    }
                )
                .join("");

    }


    /* =====================================================
       RECENT PAYMENTS
       ===================================================== */

    function renderRecentPayments() {

        const body =
            $("recentPaymentsAnalyticsBody");


        if (!body) {
            return;
        }


        const payments =
            [...state.filteredPayments]
                .sort(
                    (a, b) =>
                        String(
                            b.date ||
                            ""
                        ).localeCompare(
                            String(
                                a.date ||
                                ""
                            )
                        )
                )
                .slice(
                    0,
                    20
                );


        setText(
            "recentPaymentCount",
            `${payments.length} ${
                payments.length === 1
                    ? "transaction"
                    : "transactions"
            }`
        );


        if (!payments.length) {

            body.innerHTML = `
                <tr>

                    <td colspan="5">

                        <div class="chart-empty">

                            <div>
                                🧾
                            </div>

                            <h3>
                                No transactions
                            </h3>

                            <p>
                                Recorded payments
                                will appear here.
                            </p>

                        </div>

                    </td>

                </tr>
            `;

            return;
        }


        body.innerHTML =
            payments
                .map(
                    payment => {

                        const student =
                            getPaymentStudent(
                                payment
                            );


                        return `
                            <tr>

                                <td>
                                    <strong>
                                        ${escapeHTML(
                                            payment.receiptNumber
                                        )}
                                    </strong>
                                </td>


                                <td>

                                    <div
                                        class="
                                            analytics-student-cell
                                        "
                                    >

                                        <div
                                            class="
                                                analytics-avatar
                                            "
                                        >

                                            ${
                                                student?.photo
                                                    ? `
                                                        <img
                                                            src="${escapeHTML(
                                                                student.photo
                                                            )}"
                                                            alt=""
                                                        >
                                                    `
                                                    : escapeHTML(
                                                        (
                                                            student?.name ||
                                                            "NA"
                                                        )
                                                            .split(
                                                                /\s+/
                                                            )
                                                            .map(
                                                                part =>
                                                                    part
                                                                        .charAt(
                                                                            0
                                                                        )
                                                                        .toUpperCase()
                                                            )
                                                            .slice(
                                                                0,
                                                                2
                                                            )
                                                            .join("")
                                                    )
                                            }

                                        </div>


                                        <div>

                                            <div
                                                class="
                                                    analytics-student-name
                                                "
                                            >
                                                ${escapeHTML(
                                                    student?.name ||
                                                    "Unknown Student"
                                                )}
                                            </div>

                                            <div
                                                class="
                                                    analytics-student-meta
                                                "
                                            >
                                                ${escapeHTML(
                                                    payment.studentId ||
                                                    "—"
                                                )}
                                            </div>

                                        </div>

                                    </div>

                                </td>


                                <td>

                                    <strong
                                        class="amount-strong"
                                    >
                                        ${escapeHTML(
                                            money(
                                                payment.amount
                                            )
                                        )}
                                    </strong>

                                </td>


                                <td>
                                    ${escapeHTML(
                                        payment.paymentMethod
                                    )}
                                </td>


                                <td>
                                    ${displayDate(
                                        payment.date
                                    )}
                                </td>

                            </tr>
                        `;

                    }
                )
                .join("");

    }


    /* =====================================================
       RENDER ALL
       ===================================================== */

    function renderAll() {

        renderKPIs();

        renderTrendChart();

        renderPaymentMethods();

        renderClassPerformance();

        renderTopStudents();

        renderRecentPayments();

    }


    /* =====================================================
       CLEAR FILTERS
       ===================================================== */

    function clearFilters() {

        if (
            $("analyticsAcademicYear")
        ) {

            $("analyticsAcademicYear")
                .value = "";

        }


        if (
            $("analyticsClass")
        ) {

            $("analyticsClass")
                .value = "";

        }


        if (
            $("analyticsSection")
        ) {

            $("analyticsSection")
                .value = "";

        }


        if (
            $("analyticsDateFrom")
        ) {

            $("analyticsDateFrom")
                .value = "";

        }


        if (
            $("analyticsDateTo")
        ) {

            $("analyticsDateTo")
                .value = "";

        }


        state.filters = {

            academicYear: "",

            className: "",

            section: "",

            dateFrom: "",

            dateTo: ""

        };


        state.filteredPayments =
            [...state.payments];


        renderAll();


        showToast(
            "Analytics filters cleared."
        );

    }


    /* =====================================================
       REFRESH
       ===================================================== */

    function refreshAnalytics(
        showMessage = true
    ) {

        loadData();

        populateFilters();

        applyFilters(
            false
        );


        if (showMessage) {

            showToast(
                "Fee analytics refreshed."
            );

        }

    }


    /* =====================================================
       CSV ESCAPE
       ===================================================== */

    function csvEscape(value) {

        const text =
            String(
                value ?? ""
            );


        if (
            text.includes(",") ||
            text.includes('"') ||
            text.includes("\n")
        ) {

            return `"${text.replace(
                /"/g,
                '""'
            )}"`;

        }


        return text;

    }


    /* =====================================================
       DOWNLOAD FILE
       ===================================================== */

    function downloadFile(
        filename,
        content,
        type
    ) {

        const blob =
            new Blob(
                [content],
                {
                    type
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            filename;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        setTimeout(
            () => {

                URL.revokeObjectURL(
                    url
                );

            },
            1000
        );

    }


    /* =====================================================
       EXPORT CSV
       ===================================================== */

    function exportCSV() {

        const rows = [];


        rows.push([
            "Receipt Number",
            "Student Name",
            "Student ID",
            "Class",
            "Section",
            "Academic Year",
            "Fee Type",
            "Amount",
            "Payment Method",
            "Payment Date"
        ]);


        state.filteredPayments.forEach(
            payment => {

                const student =
                    getPaymentStudent(
                        payment
                    );


                const fee =
                    getPaymentFee(
                        payment
                    );


                rows.push([

                    payment.receiptNumber,

                    student?.name ||
                        "",

                    student?.id ||
                        payment.studentId ||
                        "",

                    cleanClass(
                        fee?.className ||
                        student?.className ||
                        ""
                    ),

                    cleanSection(
                        fee?.section ||
                        student?.section ||
                        ""
                    ),

                    fee?.academicYear ||
                        "",

                    fee?.feeType ||
                        fee?.description ||
                        "Fee Payment",

                    payment.amount,

                    payment.paymentMethod,

                    payment.date

                ]);

            }
        );


        const csv =
            rows
                .map(
                    row =>
                        row
                            .map(
                                csvEscape
                            )
                            .join(",")
                )
                .join("\r\n");


        const filename =
            `smartschool360-fee-analytics-${new Date()
                .toISOString()
                .slice(
                    0,
                    10
                )}.csv`;


        downloadFile(
            filename,

            "\uFEFF" +
                csv,

            "text/csv;charset=utf-8;"
        );


        showToast(
            "Analytics CSV exported successfully."
        );

    }


    /* =====================================================
       EXPORT JSON
       ===================================================== */

    function exportJSON() {

        const total =
            state.filteredPayments
                .reduce(
                    (sum, payment) =>
                        sum +
                        number(
                            payment.amount
                        ),
                    0
                );


        const report = {

            generatedAt:
                new Date()
                    .toISOString(),


            filters:
                state.filters,


            summary: {

                totalCollection:
                    total,

                transactions:
                    state.filteredPayments
                        .length,

                averagePayment:
                    state.filteredPayments
                        .length
                        ? total /
                          state.filteredPayments
                              .length
                        : 0,

                largestPayment:
                    state.filteredPayments
                        .length
                        ? Math.max(
                            ...state
                                .filteredPayments
                                .map(
                                    payment =>
                                        number(
                                            payment.amount
                                        )
                                )
                        )
                        : 0,

                students:
                    new Set(
                        state.filteredPayments
                            .map(
                                payment =>
                                    payment.studentId
                            )
                            .filter(Boolean)
                    ).size,

                activeDays:
                    new Set(
                        state.filteredPayments
                            .map(
                                payment =>
                                    normalizeDate(
                                        payment.date
                                    )
                            )
                            .filter(Boolean)
                    ).size

            },


            payments:
                state.filteredPayments

        };


        const filename =
            `smartschool360-fee-analytics-${new Date()
                .toISOString()
                .slice(
                    0,
                    10
                )}.json`;


        downloadFile(
            filename,

            JSON.stringify(
                report,
                null,
                2
            ),

            "application/json;charset=utf-8;"
        );


        showToast(
            "Analytics JSON exported successfully."
        );

    }


    /* =====================================================
       PRINT
       ===================================================== */

    function printAnalytics() {

        window.print();

    }


    /* =====================================================
       EVENT BINDING
       ===================================================== */

    function bindEvents() {

        const applyButton =
            $("applyFeeAnalyticsBtn");


        const clearButton =
            $("clearFeeAnalyticsBtn");


        const refreshButton =
            $("refreshFeeAnalyticsBtn");


        const printTopButton =
            $("printFeeAnalyticsBtn");


        const printBottomButton =
            $("printFeeAnalyticsBottomBtn");


        const csvButton =
            $("exportFeeAnalyticsCSVBtn");


        const jsonButton =
            $("exportFeeAnalyticsJSONBtn");


        if (applyButton) {

            applyButton.addEventListener(
                "click",
                () =>
                    applyFilters(
                        true
                    )
            );

        }


        if (clearButton) {

            clearButton.addEventListener(
                "click",
                clearFilters
            );

        }


        if (refreshButton) {

            refreshButton.addEventListener(
                "click",
                () =>
                    refreshAnalytics(
                        true
                    )
            );

        }


        if (printTopButton) {

            printTopButton.addEventListener(
                "click",
                printAnalytics
            );

        }


        if (printBottomButton) {

            printBottomButton.addEventListener(
                "click",
                printAnalytics
            );

        }


        if (csvButton) {

            csvButton.addEventListener(
                "click",
                exportCSV
            );

        }


        if (jsonButton) {

            jsonButton.addEventListener(
                "click",
                exportJSON
            );

        }


        /* ================================================
           DATE VALIDATION
           ================================================ */

        const from =
            $("analyticsDateFrom");


        const to =
            $("analyticsDateTo");


        if (from && to) {

            from.addEventListener(
                "change",
                () => {

                    if (
                        to.value &&
                        from.value >
                        to.value
                    ) {

                        to.value =
                            from.value;

                    }

                }
            );


            to.addEventListener(
                "change",
                () => {

                    if (
                        from.value &&
                        to.value <
                        from.value
                    ) {

                        from.value =
                            to.value;

                    }

                }
            );

        }


        /* ================================================
           STORAGE SYNC
           ================================================ */

        window.addEventListener(
            "storage",
            event => {

                if (
                    [
                        STORAGE.students,
                        STORAGE.fees,
                        STORAGE.payments
                    ].includes(
                        event.key
                    )
                ) {

                    refreshAnalytics(
                        false
                    );

                }

            }
        );

    }


    /* =====================================================
       INITIALIZE
       ===================================================== */

    function init() {

        loadData();

        populateFilters();

        state.filteredPayments =
            [...state.payments];

        bindEvents();

        renderAll();


        console.log(
            "SmartSchool360 Advanced Fee Analytics initialized."
        );

    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.SmartSchoolFeeAnalytics = {

        refresh:
            () =>
                refreshAnalytics(
                    true
                ),

        exportCSV,

        exportJSON,

        print:
            printAnalytics,

        getState:
            () => ({
                filters: {
                    ...state.filters
                },

                payments:
                    [
                        ...state.filteredPayments
                    ]
            })

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
