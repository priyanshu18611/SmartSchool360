/* =========================================================
   SMARTSCHOOL360 — FEE REPORTS & ANALYTICS
   Functional Fee Reporting Engine
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

        filteredFees: [],
        filteredPayments: [],

        filters: {
            academicYear: "",
            className: "",
            section: "",
            status: "",
            dateFrom: "",
            dateTo: ""
        }
    };


    /* =====================================================
       HELPERS
       ===================================================== */

    const $ = (id) => document.getElementById(id);


    function safeArray(value) {
        return Array.isArray(value) ? value : [];
    }


    function readStorage(key) {
        try {
            const raw = localStorage.getItem(key);

            if (!raw) {
                return [];
            }

            const parsed = JSON.parse(raw);

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
        const parsed = Number(value);

        return Number.isFinite(parsed) ? parsed : 0;
    }


    function money(value) {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }).format(number(value));
    }


    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
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


    function normalizeDate(value) {
        if (!value) {
            return "";
        }

        const text = String(value).trim();

        if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
            return text;
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    }


    function displayDate(value) {
        const normalized = normalizeDate(value);

        if (!normalized) {
            return "—";
        }

        const parts = normalized.split("-");

        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }


    function todayISO() {
        const date = new Date();

        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    }


    function getStudentById(studentId) {
        return state.students.find(
            student =>
                String(student.id) === String(studentId)
        );
    }


    function getFeeById(feeId) {
        return state.fees.find(
            fee =>
                String(fee.id) === String(feeId)
        );
    }


    function getFeeStudent(fee) {
        return getStudentById(fee.studentId);
    }


    function getPaymentFee(payment) {
        return getFeeById(payment.feeId);
    }


    function getPaymentStudent(payment) {
        return getStudentById(payment.studentId);
    }


    function getFeePaidAmount(fee) {
        return number(fee.paidAmount);
    }


    function getFeeTotal(fee) {
        return number(fee.totalFee);
    }


    function getFeeDueAmount(fee) {
        const storedDue = number(fee.dueAmount);

        if (
            Object.prototype.hasOwnProperty.call(
                fee,
                "dueAmount"
            )
        ) {
            return Math.max(0, storedDue);
        }

        return Math.max(
            0,
            getFeeTotal(fee) - getFeePaidAmount(fee)
        );
    }


    function calculateFeeStatus(fee) {
        const total = getFeeTotal(fee);
        const paid = getFeePaidAmount(fee);
        const due = getFeeDueAmount(fee);

        const dueDate = normalizeDate(fee.dueDate);
        const today = todayISO();

        if (total <= 0) {
            return "pending";
        }

        if (due <= 0 || paid >= total) {
            return "paid";
        }

        if (dueDate && dueDate < today) {
            return "overdue";
        }

        if (paid > 0) {
            return "partial";
        }

        return "pending";
    }


    function normalizeFee(fee) {
        const total = getFeeTotal(fee);

        const paid = getFeePaidAmount(fee);

        const due = Math.max(
            0,
            total - paid
        );

        return {
            ...fee,

            totalFee: total,
            paidAmount: paid,
            dueAmount: due,

            className: cleanClass(
                fee.className ||
                getFeeStudent(fee)?.className ||
                ""
            ),

            section: cleanSection(
                fee.section ||
                getFeeStudent(fee)?.section ||
                ""
            ),

            academicYear:
                fee.academicYear ||
                "",

            status:
                calculateFeeStatus({
                    ...fee,
                    totalFee: total,
                    paidAmount: paid,
                    dueAmount: due
                })
        };
    }


    function normalizePayment(payment) {
        return {
            ...payment,

            amount: number(
                payment.amount
            ),

            date:
                normalizeDate(
                    payment.date ||
                    payment.createdAt
                ),

            studentId:
                payment.studentId || "",

            feeId:
                payment.feeId || "",

            receiptNumber:
                payment.receiptNumber ||
                payment.id ||
                "—",

            paymentMethod:
                payment.paymentMethod ||
                "—"
        };
    }


    /* =====================================================
       TOAST
       ===================================================== */

    let toastTimer = null;


    function showToast(message) {

        const toast = $("feeReportsToast");

        if (!toast) {
            return;
        }

        toast.textContent = message;

        toast.classList.add("show");

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            toast.classList.remove("show");
        }, 2800);
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
            ).map(normalizeFee);

        state.payments =
            readStorage(
                STORAGE.payments
            ).map(normalizePayment);

        console.log(
            "SmartSchool360 Fee Reports:",
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

    function populateFilterOptions() {

        const academicYear =
            $("reportAcademicYear");

        const classSelect =
            $("reportClass");

        const sectionSelect =
            $("reportSection");


        if (!academicYear ||
            !classSelect ||
            !sectionSelect) {

            return;
        }


        const currentAcademic =
            academicYear.value;

        const currentClass =
            classSelect.value;

        const currentSection =
            sectionSelect.value;


        const years = [
            ...new Set(
                state.fees
                    .map(fee =>
                        fee.academicYear
                    )
                    .filter(Boolean)
            )
        ].sort();


        const classes = [
            ...new Set(
                state.fees
                    .map(fee =>
                        cleanClass(
                            fee.className
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
                    .map(fee =>
                        cleanSection(
                            fee.section
                        )
                    )
                    .filter(Boolean)
            )
        ].sort();


        academicYear.innerHTML = `
            <option value="">
                All Academic Years
            </option>
        `;

        years.forEach(year => {

            academicYear.insertAdjacentHTML(
                "beforeend",
                `
                <option value="${escapeHTML(year)}">
                    ${escapeHTML(year)}
                </option>
                `
            );
        });


        classSelect.innerHTML = `
            <option value="">
                All Classes
            </option>
        `;

        classes.forEach(className => {

            classSelect.insertAdjacentHTML(
                "beforeend",
                `
                <option value="${escapeHTML(className)}">
                    Class ${escapeHTML(className)}
                </option>
                `
            );
        });


        sectionSelect.innerHTML = `
            <option value="">
                All Sections
            </option>
        `;

        sections.forEach(section => {

            sectionSelect.insertAdjacentHTML(
                "beforeend",
                `
                <option value="${escapeHTML(section)}">
                    Section ${escapeHTML(section)}
                </option>
                `
            );
        });


        if (
            [...academicYear.options]
                .some(
                    option =>
                        option.value ===
                        currentAcademic
                )
        ) {
            academicYear.value =
                currentAcademic;
        }


        if (
            [...classSelect.options]
                .some(
                    option =>
                        option.value ===
                        currentClass
                )
        ) {
            classSelect.value =
                currentClass;
        }


        if (
            [...sectionSelect.options]
                .some(
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
                $("reportAcademicYear")?.value ||
                "",

            className:
                cleanClass(
                    $("reportClass")?.value ||
                    ""
                ),

            section:
                cleanSection(
                    $("reportSection")?.value ||
                    ""
                ),

            status:
                $("reportStatus")?.value ||
                "",

            dateFrom:
                $("reportDateFrom")?.value ||
                "",

            dateTo:
                $("reportDateTo")?.value ||
                ""
        };
    }


    /* =====================================================
       FILTER FEES
       ===================================================== */

    function feeMatchesFilters(fee) {

        const filters =
            state.filters;


        if (
            filters.academicYear &&
            String(fee.academicYear) !==
            String(filters.academicYear)
        ) {
            return false;
        }


        if (
            filters.className &&
            cleanClass(
                fee.className
            ) !==
            filters.className
        ) {
            return false;
        }


        if (
            filters.section &&
            cleanSection(
                fee.section
            ) !==
            filters.section
        ) {
            return false;
        }


        if (
            filters.status &&
            calculateFeeStatus(fee) !==
            filters.status
        ) {
            return false;
        }


        return true;
    }


    /* =====================================================
       FILTER PAYMENTS
       ===================================================== */

    function paymentMatchesFilters(payment) {

        const fee =
            getPaymentFee(payment);

        const student =
            getPaymentStudent(payment);


        if (!fee) {

            /*
             * If an old payment has no fee record,
             * still allow it only when no fee-specific
             * filter is active.
             */

            if (
                state.filters.academicYear ||
                state.filters.className ||
                state.filters.section ||
                state.filters.status
            ) {
                return false;
            }

        } else {

            if (
                !feeMatchesFilters(fee)
            ) {
                return false;
            }
        }


        const paymentDate =
            normalizeDate(
                payment.date
            );


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


        /*
         * Student/class fallback for legacy records
         */

        if (
            state.filters.className &&
            student
        ) {

            if (
                cleanClass(
                    student.className
                ) !==
                state.filters.className
            ) {
                return false;
            }
        }


        if (
            state.filters.section &&
            student
        ) {

            if (
                cleanSection(
                    student.section
                ) !==
                state.filters.section
            ) {
                return false;
            }
        }


        return true;
    }


    /* =====================================================
       APPLY FILTERS
       ===================================================== */

    function applyFilters() {

        readFilters();


        state.filteredFees =
            state.fees.filter(
                fee =>
                    feeMatchesFilters(fee)
            );


        state.filteredPayments =
            state.payments.filter(
                payment =>
                    paymentMatchesFilters(
                        payment
                    )
            );


        renderAll();
    }


    /* =====================================================
       KPIs
       ===================================================== */

    function renderKPIs() {

        const fees =
            state.filteredFees;


        const totalFee =
            fees.reduce(
                (sum, fee) =>
                    sum +
                    getFeeTotal(fee),
                0
            );


        const collected =
            fees.reduce(
                (sum, fee) =>
                    sum +
                    getFeePaidAmount(fee),
                0
            );


        const pending =
            fees.reduce(
                (sum, fee) =>
                    sum +
                    getFeeDueAmount(fee),
                0
            );


        const overdue =
            fees.reduce(
                (sum, fee) => {

                    return (
                        sum +
                        (
                            calculateFeeStatus(
                                fee
                            ) === "overdue"
                                ? getFeeDueAmount(
                                      fee
                                  )
                                : 0
                        )
                    );
                },
                0
            );


        const overdueCount =
            fees.filter(
                fee =>
                    calculateFeeStatus(
                        fee
                    ) === "overdue"
            ).length;


        const students =
            new Set(
                fees
                    .map(
                        fee =>
                            fee.studentId
                    )
                    .filter(Boolean)
            );


        const collectionRate =
            totalFee > 0
                ? (
                    collected /
                    totalFee
                ) *
                  100
                : 0;


        const paymentCount =
            state.filteredPayments.length;


        setText(
            "reportTotalFee",
            money(totalFee)
        );

        setText(
            "reportCollected",
            money(collected)
        );

        setText(
            "reportPending",
            money(pending)
        );

        setText(
            "reportOverdue",
            money(overdue)
        );

        setText(
            "reportCollectionRate",
            `${collectionRate.toFixed(1)}%`
        );

        setText(
            "reportStudentCount",
            students.size
        );

        setText(
            "reportPaymentCount",
            `${paymentCount} ${
                paymentCount === 1
                    ? "payment"
                    : "payments"
            }`
        );

        setText(
            "reportOverdueCount",
            `${overdueCount} ${
                overdueCount === 1
                    ? "record"
                    : "records"
            }`
        );


        /*
         * Donut
         */

        const donut =
            $("feeCollectionDonut");

        if (donut) {

            const collectedDegrees =
                Math.min(
                    100,
                    Math.max(
                        0,
                        collectionRate
                    )
                ) *
                3.6;


            donut.style.background =
                `
                conic-gradient(
                    var(--report-success)
                    0deg
                    ${collectedDegrees}deg,

                    var(--report-warning)
                    ${collectedDegrees}deg
                    ${
                        Math.min(
                            100,
                            Math.max(
                                0,
                                collectionRate +
                                (
                                    totalFee > 0
                                        ? (
                                            overdue /
                                            totalFee
                                        ) *
                                          100
                                        : 0
                                )
                            )
                        ) * 3.6
                    }deg,

                    #e5e7eb
                    ${
                        Math.min(
                            100,
                            Math.max(
                                0,
                                collectionRate +
                                (
                                    totalFee > 0
                                        ? (
                                            overdue /
                                            totalFee
                                        ) *
                                          100
                                        : 0
                                )
                            )
                        ) * 3.6
                    }deg
                    360deg
                )
                `;
        }


        setText(
            "feeDonutPercentage",
            `${collectionRate.toFixed(0)}%`
        );


        setText(
            "legendTotal",
            money(totalFee)
        );

        setText(
            "legendCollected",
            money(collected)
        );

        setText(
            "legendPending",
            money(pending)
        );

        setText(
            "legendOverdue",
            money(overdue)
        );
    }


    /* =====================================================
       PAYMENT SUMMARY
       ===================================================== */

    function renderPaymentSummary() {

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


        const average =
            amounts.length
                ? total / amounts.length
                : 0;


        const largest =
            amounts.length
                ? Math.max(...amounts)
                : 0;


        const pendingRecords =
            state.filteredFees.filter(
                fee => {

                    const status =
                        calculateFeeStatus(
                            fee
                        );

                    return (
                        status ===
                            "pending" ||
                        status ===
                            "partial" ||
                        status ===
                            "overdue"
                    );
                }
            ).length;


        setText(
            "summaryPaymentCount",
            payments.length
        );

        setText(
            "summaryAveragePayment",
            money(average)
        );

        setText(
            "summaryLargestPayment",
            money(largest)
        );

        setText(
            "summaryPendingRecords",
            pendingRecords
        );
    }


    /* =====================================================
       CLASS REPORT
       ===================================================== */

    function renderClassReport() {

        const body =
            $("classReportBody");

        if (!body) {
            return;
        }


        const grouped = {};


        state.filteredFees.forEach(
            fee => {

                const className =
                    cleanClass(
                        fee.className ||
                        getFeeStudent(
                            fee
                        )?.className ||
                        "Unknown"
                    );


                if (!grouped[className]) {

                    grouped[className] = {
                        students:
                            new Set(),

                        total: 0,
                        paid: 0,
                        due: 0,
                        overdue: 0
                    };
                }


                const group =
                    grouped[className];


                if (fee.studentId) {
                    group.students.add(
                        String(
                            fee.studentId
                        )
                    );
                }


                group.total +=
                    getFeeTotal(fee);


                group.paid +=
                    getFeePaidAmount(fee);


                group.due +=
                    getFeeDueAmount(fee);


                if (
                    calculateFeeStatus(
                        fee
                    ) === "overdue"
                ) {
                    group.overdue +=
                        getFeeDueAmount(
                            fee
                        );
                }
            }
        );


        const classes =
            Object.keys(
                grouped
            ).sort(
                (a, b) =>
                    String(a).localeCompare(
                        String(b),
                        undefined,
                        {
                            numeric: true
                        }
                    )
            );


        setText(
            "classReportCount",
            `${classes.length} ${
                classes.length === 1
                    ? "class"
                    : "classes"
            }`
        );


        if (!classes.length) {

            body.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="reports-empty-state">
                            <div>📊</div>

                            <h3>
                                No class data available
                            </h3>

                            <p>
                                Fee records matching the selected
                                filters will appear here.
                            </p>
                        </div>
                    </td>
                </tr>
            `;

            return;
        }


        body.innerHTML =
            classes.map(
                className => {

                    const group =
                        grouped[className];


                    const percentage =
                        group.total > 0
                            ? (
                                group.paid /
                                group.total
                            ) *
                              100
                            : 0;


                    return `
                        <tr>

                            <td>
                                <strong>
                                    Class
                                    ${escapeHTML(
                                        className
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${
                                    group.students.size
                                }
                            </td>

                            <td>
                                <span class="money-value">
                                    ${money(
                                        group.total
                                    )}
                                </span>
                            </td>

                            <td>
                                <span class="money-value">
                                    ${money(
                                        group.paid
                                    )}
                                </span>
                            </td>

                            <td>
                                <span class="money-value">
                                    ${money(
                                        group.due
                                    )}
                                </span>
                            </td>

                            <td>
                                <span class="money-value">
                                    ${money(
                                        group.overdue
                                    )}
                                </span>
                            </td>

                            <td>
                                <span class="
                                    percentage-value
                                    ${
                                        percentage >=
                                        80
                                            ? "good"
                                            : percentage >=
                                              40
                                            ? "medium"
                                            : "low"
                                    }
                                ">
                                    ${percentage.toFixed(
                                        1
                                    )}%
                                </span>
                            </td>

                        </tr>
                    `;
                }
            ).join("");
    }


    /* =====================================================
       STUDENT REPORT
       ===================================================== */

    function renderStudentReport() {

        const body =
            $("studentReportBody");

        if (!body) {
            return;
        }


        const grouped = {};


        state.filteredFees.forEach(
            fee => {

                const student =
                    getFeeStudent(
                        fee
                    );


                const studentId =
                    String(
                        fee.studentId ||
                        student?.id ||
                        ""
                    );


                if (!studentId) {
                    return;
                }


                if (!grouped[studentId]) {

                    grouped[studentId] = {
                        student,
                        total: 0,
                        paid: 0,
                        due: 0,
                        status: "pending"
                    };
                }


                const group =
                    grouped[studentId];


                group.total +=
                    getFeeTotal(fee);


                group.paid +=
                    getFeePaidAmount(fee);


                group.due +=
                    getFeeDueAmount(fee);


                const status =
                    calculateFeeStatus(
                        fee
                    );


                /*
                 * Priority:
                 * overdue > partial > pending > paid
                 */

                const priority = {
                    paid: 1,
                    pending: 2,
                    partial: 3,
                    overdue: 4
                };


                if (
                    priority[status] >
                    priority[group.status]
                ) {
                    group.status =
                        status;
                }
            }
        );


        const students =
            Object.values(
                grouped
            ).sort(
                (a, b) =>
                    String(
                        a.student?.name ||
                        ""
                    ).localeCompare(
                        String(
                            b.student?.name ||
                            ""
                        )
                    )
            );


        setText(
            "studentReportCount",
            `${students.length} ${
                students.length === 1
                    ? "student"
                    : "students"
            }`
        );


        if (!students.length) {

            body.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="reports-empty-state">
                            <div>👨‍🎓</div>

                            <h3>
                                No student data available
                            </h3>

                            <p>
                                Student fee records matching
                                the filters will appear here.
                            </p>
                        </div>
                    </td>
                </tr>
            `;

            return;
        }


        body.innerHTML =
            students.map(
                item => {

                    const student =
                        item.student ||
                        {};


                    const percentage =
                        item.total > 0
                            ? (
                                item.paid /
                                item.total
                            ) *
                              100
                            : 0;


                    const name =
                        student.name ||
                        "Unknown Student";


                    const id =
                        student.id ||
                        "—";


                    const className =
                        cleanClass(
                            student.className ||
                            ""
                        );


                    const photo =
                        student.photo ||
                        student.profilePhoto ||
                        "";


                    const avatar =
                        photo
                            ? `
                                <img
                                    src="${escapeHTML(
                                        photo
                                    )}"
                                    alt=""
                                    class="report-avatar"
                                >
                            `
                            : `
                                <div class="report-avatar">
                                    ${escapeHTML(
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
                                            .join("")
                                    )}
                                </div>
                            `;


                    return `
                        <tr>

                            <td>
                                <div class="report-student-cell">

                                    ${avatar}

                                    <div>
                                        <div class="report-student-name">
                                            ${escapeHTML(
                                                name
                                            )}
                                        </div>

                                        <div class="report-student-meta">
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
                                    id
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
                                <span class="money-value">
                                    ${money(
                                        item.total
                                    )}
                                </span>
                            </td>

                            <td>
                                <span class="money-value">
                                    ${money(
                                        item.paid
                                    )}
                                </span>
                            </td>

                            <td>
                                <span class="money-value">
                                    ${money(
                                        item.due
                                    )}
                                </span>
                            </td>

                            <td>
                                <span class="
                                    status-badge
                                    ${escapeHTML(
                                        item.status
                                    )}
                                ">
                                    ${escapeHTML(
                                        item.status
                                            .charAt(
                                                0
                                            )
                                            .toUpperCase() +
                                        item.status
                                            .slice(
                                                1
                                            )
                                    )}
                                </span>
                            </td>

                        </tr>
                    `;
                }
            ).join("");
    }


    /* =====================================================
       TRANSACTION REPORT
       ===================================================== */

    function renderTransactionReport() {

        const body =
            $("transactionReportBody");

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
                );


        setText(
            "transactionReportCount",
            `${payments.length} ${
                payments.length === 1
                    ? "transaction"
                    : "transactions"
            }`
        );


        if (!payments.length) {

            body.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="reports-empty-state">
                            <div>🧾</div>

                            <h3>
                                No payment transactions
                            </h3>

                            <p>
                                Recorded payments matching
                                the selected filters will appear here.
                            </p>
                        </div>
                    </td>
                </tr>
            `;

            return;
        }


        body.innerHTML =
            payments.map(
                payment => {

                    const student =
                        getPaymentStudent(
                            payment
                        );


                    const fee =
                        getPaymentFee(
                            payment
                        );


                    const feeType =
                        fee?.feeType ||
                        fee?.description ||
                        "Fee Payment";


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
                                <div class="report-student-cell">

                                    ${
                                        student?.photo
                                            ? `
                                                <img
                                                    src="${escapeHTML(
                                                        student.photo
                                                    )}"
                                                    alt=""
                                                    class="report-avatar"
                                                >
                                            `
                                            : `
                                                <div class="report-avatar">
                                                    ${escapeHTML(
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
                                                    )}
                                                </div>
                                            `
                                    }

                                    <div>

                                        <div class="report-student-name">
                                            ${escapeHTML(
                                                student?.name ||
                                                "Unknown Student"
                                            )}
                                        </div>

                                        <div class="report-student-meta">
                                            ${escapeHTML(
                                                payment.studentId ||
                                                "—"
                                            )}
                                        </div>

                                    </div>

                                </div>
                            </td>

                            <td>
                                ${escapeHTML(
                                    feeType
                                )}
                            </td>

                            <td>
                                <span class="money-value">
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
                                ${displayDate(
                                    payment.date
                                )}
                            </td>

                        </tr>
                    `;
                }
            ).join("");
    }


    /* =====================================================
       RENDER ALL
       ===================================================== */

    function renderAll() {

        renderKPIs();

        renderPaymentSummary();

        renderClassReport();

        renderStudentReport();

        renderTransactionReport();
    }


    /* =====================================================
       SET TEXT
       ===================================================== */

    function setText(id, value) {

        const element =
            $(id);

        if (element) {
            element.textContent =
                String(value);
        }
    }


    /* =====================================================
       CLEAR FILTERS
       ===================================================== */

    function clearFilters() {

        if ($("reportAcademicYear")) {
            $("reportAcademicYear").value = "";
        }

        if ($("reportClass")) {
            $("reportClass").value = "";
        }

        if ($("reportSection")) {
            $("reportSection").value = "";
        }

        if ($("reportStatus")) {
            $("reportStatus").value = "";
        }

        if ($("reportDateFrom")) {
            $("reportDateFrom").value = "";
        }

        if ($("reportDateTo")) {
            $("reportDateTo").value = "";
        }


        state.filters = {
            academicYear: "",
            className: "",
            section: "",
            status: "",
            dateFrom: "",
            dateTo: ""
        };


        state.filteredFees =
            [...state.fees];

        state.filteredPayments =
            [...state.payments];


        renderAll();

        showToast(
            "Fee report filters cleared."
        );
    }


    /* =====================================================
       REFRESH
       ===================================================== */

    function refreshReports(
        showMessage = true
    ) {

        loadData();

        populateFilterOptions();

        applyFilters();

        if (showMessage) {
            showToast(
                "Fee reports refreshed."
            );
        }
    }


    /* =====================================================
       CSV
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


        link.href = url;

        link.download =
            filename;

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();


        setTimeout(() => {
            URL.revokeObjectURL(
                url
            );
        }, 1000);
    }


    /* =====================================================
       EXPORT CSV
       ===================================================== */

    function exportCSV() {

        const rows = [];


        rows.push([
            "Report Type",
            "Receipt Number",
            "Student Name",
            "Student ID",
            "Class",
            "Section",
            "Academic Year",
            "Fee Type",
            "Total Fee",
            "Paid Amount",
            "Due Amount",
            "Status",
            "Payment Amount",
            "Payment Method",
            "Payment Date"
        ]);


        state.filteredFees.forEach(
            fee => {

                const student =
                    getFeeStudent(
                        fee
                    );


                const payments =
                    state.filteredPayments
                        .filter(
                            payment =>
                                String(
                                    payment.feeId
                                ) ===
                                String(
                                    fee.id
                                )
                        );


                if (!payments.length) {

                    rows.push([
                        "Fee Record",
                        "",
                        student?.name ||
                            "",
                        student?.id ||
                            fee.studentId ||
                            "",
                        cleanClass(
                            fee.className ||
                            student?.className ||
                            ""
                        ),
                        cleanSection(
                            fee.section ||
                            student?.section ||
                            ""
                        ),
                        fee.academicYear ||
                            "",
                        fee.feeType ||
                            fee.description ||
                            "",
                        getFeeTotal(
                            fee
                        ),
                        getFeePaidAmount(
                            fee
                        ),
                        getFeeDueAmount(
                            fee
                        ),
                        calculateFeeStatus(
                            fee
                        ),
                        "",
                        "",
                        ""
                    ]);

                    return;
                }


                payments.forEach(
                    payment => {

                        rows.push([
                            "Payment",
                            payment.receiptNumber,
                            student?.name ||
                                "",
                            student?.id ||
                                fee.studentId ||
                                "",
                            cleanClass(
                                fee.className ||
                                student?.className ||
                                ""
                            ),
                            cleanSection(
                                fee.section ||
                                student?.section ||
                                ""
                            ),
                            fee.academicYear ||
                                "",
                            fee.feeType ||
                                fee.description ||
                                "",
                            getFeeTotal(
                                fee
                            ),
                            getFeePaidAmount(
                                fee
                            ),
                            getFeeDueAmount(
                                fee
                            ),
                            calculateFeeStatus(
                                fee
                            ),
                            payment.amount,
                            payment.paymentMethod,
                            payment.date
                        ]);
                    }
                );
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
            `smartschool360-fee-report-${todayISO()}.csv`;


        downloadFile(
            filename,
            "\uFEFF" + csv,
            "text/csv;charset=utf-8;"
        );


        showToast(
            "Fee report CSV exported successfully."
        );
    }


    /* =====================================================
       EXPORT JSON
       ===================================================== */

    function exportJSON() {

        const report = {

            generatedAt:
                new Date().toISOString(),

            filters:
                state.filters,

            summary: {
                totalFee:
                    state.filteredFees.reduce(
                        (sum, fee) =>
                            sum +
                            getFeeTotal(
                                fee
                            ),
                        0
                    ),

                collected:
                    state.filteredFees.reduce(
                        (sum, fee) =>
                            sum +
                            getFeePaidAmount(
                                fee
                            ),
                        0
                    ),

                pending:
                    state.filteredFees.reduce(
                        (sum, fee) =>
                            sum +
                            getFeeDueAmount(
                                fee
                            ),
                        0
                    ),

                payments:
                    state.filteredPayments.length
            },

            fees:
                state.filteredFees,

            payments:
                state.filteredPayments
        };


        const filename =
            `smartschool360-fee-report-${todayISO()}.json`;


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
            "Fee report JSON exported successfully."
        );
    }


    /* =====================================================
       PRINT
       ===================================================== */

    function printReport() {

        window.print();
    }


    /* =====================================================
       EVENT BINDING
       ===================================================== */

    function bindEvents() {

        const applyButton =
            $("applyFeeReportBtn");


        const clearButton =
            $("clearFeeReportBtn");


        const refreshButton =
            $("refreshFeeReportsBtn");


        const printTop =
            $("printFeeReportBtn");


        const printBottom =
            $("printFeeReportBottomBtn");


        const exportCSVButton =
            $("exportFeeCSVBtn");


        const exportJSONButton =
            $("exportFeeJSONBtn");


        if (applyButton) {

            applyButton.addEventListener(
                "click",
                () => {

                    applyFilters();

                    showToast(
                        "Fee report filters applied."
                    );
                }
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
                    refreshReports(
                        true
                    )
            );
        }


        if (printTop) {

            printTop.addEventListener(
                "click",
                printReport
            );
        }


        if (printBottom) {

            printBottom.addEventListener(
                "click",
                printReport
            );
        }


        if (exportCSVButton) {

            exportCSVButton.addEventListener(
                "click",
                exportCSV
            );
        }


        if (exportJSONButton) {

            exportJSONButton.addEventListener(
                "click",
                exportJSON
            );
        }


        /*
         * Date validation
         */

        const dateFrom =
            $("reportDateFrom");

        const dateTo =
            $("reportDateTo");


        if (dateFrom && dateTo) {

            dateFrom.addEventListener(
                "change",
                () => {

                    if (
                        dateTo.value &&
                        dateFrom.value >
                        dateTo.value
                    ) {

                        dateTo.value =
                            dateFrom.value;
                    }
                }
            );


            dateTo.addEventListener(
                "change",
                () => {

                    if (
                        dateFrom.value &&
                        dateTo.value <
                        dateFrom.value
                    ) {

                        dateFrom.value =
                            dateTo.value;
                    }
                }
            );
        }


        /*
         * Storage synchronization
         */

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

                    refreshReports(
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

        populateFilterOptions();

        state.filteredFees =
            [...state.fees];

        state.filteredPayments =
            [...state.payments];

        bindEvents();

        renderAll();

        console.log(
            "SmartSchool360 Fee Reports initialized."
        );
    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.SmartSchoolFeeReports = {
        refresh:
            () =>
                refreshReports(
                    true
                ),

        exportCSV,

        exportJSON,

        print:
            printReport,

        getState:
            () => ({
                ...state,
                filters: {
                    ...state.filters
                }
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
