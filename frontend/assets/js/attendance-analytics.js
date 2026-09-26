/* =========================================================
   SmartSchool360
   Attendance Analytics & Reports
   File: attendance-analytics.js
   ========================================================= */

(function () {
    "use strict";

    const STUDENTS_KEY = "smartschool_students";
    const ATTENDANCE_KEY = "smartschool_attendance";

    const state = {
        students: [],
        attendance: [],
        filteredAttendance: [],
        filteredStudents: []
    };

    const $ = (id) => document.getElementById(id);

    /* =========================================================
       Utility
       ========================================================= */

    function safeJSON(value, fallback) {
        try {
            return JSON.parse(value);
        } catch (error) {
            return fallback;
        }
    }

    function cleanText(value) {
        return String(value ?? "").trim();
    }

    function cleanClass(value) {
        return cleanText(value)
            .replace(/^class\s*/i, "")
            .trim();
    }

    function cleanSection(value) {
        return cleanText(value)
            .replace(/^section\s*/i, "")
            .trim();
    }

    function normalizeDate(value) {
        if (!value) return "";

        const text = String(value).trim();

        if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
            return text;
        }

        const date = new Date(text);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function formatDate(dateString) {
        if (!dateString) return "—";

        const parts = dateString.split("-");

        if (parts.length !== 3) {
            return dateString;
        }

        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    function todayISO() {
        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function normalizeStatus(value) {
        const status = cleanText(value).toLowerCase();

        if (
            status === "present" ||
            status === "p" ||
            status === "1"
        ) {
            return "Present";
        }

        if (
            status === "absent" ||
            status === "a" ||
            status === "0"
        ) {
            return "Absent";
        }

        if (
            status === "late" ||
            status === "l"
        ) {
            return "Late";
        }

        return "";
    }

    function showToast(message) {
        const toast = $("analyticsToast");

        if (!toast) return;

        toast.textContent = message;
        toast.classList.add("show");

        clearTimeout(showToast.timer);

        showToast.timer = setTimeout(() => {
            toast.classList.remove("show");
        }, 2600);
    }

    /* =========================================================
       Data Loading
       ========================================================= */

    function loadStudents() {
        const raw = localStorage.getItem(STUDENTS_KEY);

        if (!raw) {
            state.students = [];
            return;
        }

        const parsed = safeJSON(raw, []);

        if (Array.isArray(parsed)) {
            state.students = parsed;
        } else if (parsed && Array.isArray(parsed.students)) {
            state.students = parsed.students;
        } else {
            state.students = [];
        }
    }

    function loadAttendance() {
        const raw = localStorage.getItem(ATTENDANCE_KEY);

        if (!raw) {
            state.attendance = [];
            return;
        }

        const parsed = safeJSON(raw, {});

        const records = [];

        if (Array.isArray(parsed)) {
            parsed.forEach((item) => {
                const normalized = normalizeAttendanceRecord(item);

                if (normalized) {
                    records.push(normalized);
                }
            });
        } else if (parsed && typeof parsed === "object") {
            Object.entries(parsed).forEach(([key, value]) => {
                if (
                    value &&
                    typeof value === "object" &&
                    !Array.isArray(value)
                ) {
                    const normalized = normalizeAttendanceRecord({
                        ...value,
                        _storageKey: key
                    });

                    if (normalized) {
                        records.push(normalized);
                    }
                }
            });
        }

        state.attendance = records;
    }

    function normalizeAttendanceRecord(record) {
        if (!record || typeof record !== "object") {
            return null;
        }

        let studentId =
            record.studentId ||
            record.studentID ||
            record.id ||
            record.student_id ||
            "";

        let date =
            record.date ||
            record.attendanceDate ||
            record.attendance_date ||
            "";

        let status =
            record.status ||
            record.attendanceStatus ||
            record.attendance_status ||
            "";

        let className =
            record.className ||
            record.class ||
            record.class_name ||
            "";

        let section =
            record.section ||
            record.sectionName ||
            record.section_name ||
            "";

        /*
         * Some older storage formats may keep:
         * date__studentId
         */
        if ((!date || !studentId) && record._storageKey) {
            const parts = String(record._storageKey).split("__");

            if (parts.length >= 2) {
                if (!date) date = parts[0];
                if (!studentId) {
                    studentId = parts.slice(1).join("__");
                }
            }
        }

        date = normalizeDate(date);
        studentId = cleanText(studentId);
        className = cleanClass(className);
        section = cleanSection(section);
        status = normalizeStatus(status);

        if (!studentId || !date || !status) {
            return null;
        }

        return {
            studentId,
            date,
            className,
            section,
            status,
            updatedAt: record.updatedAt || "",
            savedAt: record.savedAt || ""
        };
    }

    /* =========================================================
       Student Matching
       ========================================================= */

    function findStudent(studentId) {
        return state.students.find(
            (student) =>
                cleanText(student.id) === cleanText(studentId)
        );
    }

    function getStudentName(studentId) {
        const student = findStudent(studentId);

        if (!student) {
            return "Unknown Student";
        }

        return (
            student.name ||
            student.fullName ||
            "Unknown Student"
        );
    }

    function getStudentClass(studentId, record) {
        const student = findStudent(studentId);

        return cleanClass(
            student?.className ||
            record.className ||
            ""
        );
    }

    function getStudentSection(studentId, record) {
        const student = findStudent(studentId);

        return cleanSection(
            student?.section ||
            record.section ||
            ""
        );
    }

    /* =========================================================
       Filter Options
       ========================================================= */

    function populateFilters() {
        const classSelect = $("analyticsClass");
        const sectionSelect = $("analyticsSection");

        if (!classSelect || !sectionSelect) return;

        const classes = new Set();
        const sections = new Set();

        state.students.forEach((student) => {
            const className = cleanClass(student.className);
            const section = cleanSection(student.section);

            if (className) classes.add(className);
            if (section) sections.add(section);
        });

        state.attendance.forEach((record) => {
            const className = cleanClass(record.className);
            const section = cleanSection(record.section);

            if (className) classes.add(className);
            if (section) sections.add(section);
        });

        const currentClass = classSelect.value;
        const currentSection = sectionSelect.value;

        classSelect.innerHTML =
            `<option value="">All Classes</option>`;

        [...classes]
            .sort((a, b) =>
                a.localeCompare(b, undefined, {
                    numeric: true
                })
            )
            .forEach((className) => {
                const option = document.createElement("option");

                option.value = className;
                option.textContent = `Class ${className}`;

                classSelect.appendChild(option);
            });

        sectionSelect.innerHTML =
            `<option value="">All Sections</option>`;

        [...sections]
            .sort((a, b) => a.localeCompare(b))
            .forEach((section) => {
                const option = document.createElement("option");

                option.value = section;
                option.textContent = `Section ${section}`;

                sectionSelect.appendChild(option);
            });

        if (
            [...classSelect.options].some(
                (option) => option.value === currentClass
            )
        ) {
            classSelect.value = currentClass;
        }

        if (
            [...sectionSelect.options].some(
                (option) => option.value === currentSection
            )
        ) {
            sectionSelect.value = currentSection;
        }
    }

    /* =========================================================
       Filtering
       ========================================================= */

    function getFilters() {
        return {
            className: cleanClass(
                $("analyticsClass")?.value
            ),
            section: cleanSection(
                $("analyticsSection")?.value
            ),
            dateFrom: normalizeDate(
                $("analyticsDateFrom")?.value
            ),
            dateTo: normalizeDate(
                $("analyticsDateTo")?.value
            )
        };
    }

    function applyFilters() {
        const filters = getFilters();

        const filtered = state.attendance.filter((record) => {
            const recordClass = getStudentClass(
                record.studentId,
                record
            );

            const recordSection = getStudentSection(
                record.studentId,
                record
            );

            if (
                filters.className &&
                recordClass !== filters.className
            ) {
                return false;
            }

            if (
                filters.section &&
                recordSection !== filters.section
            ) {
                return false;
            }

            if (
                filters.dateFrom &&
                record.date < filters.dateFrom
            ) {
                return false;
            }

            if (
                filters.dateTo &&
                record.date > filters.dateTo
            ) {
                return false;
            }

            return true;
        });

        state.filteredAttendance = filtered;

        const studentIds = new Set(
            filtered.map((record) => record.studentId)
        );

        state.filteredStudents = state.students.filter(
            (student) => studentIds.has(cleanText(student.id))
        );

        renderAll();
    }

    function clearFilters() {
        if ($("analyticsClass")) {
            $("analyticsClass").value = "";
        }

        if ($("analyticsSection")) {
            $("analyticsSection").value = "";
        }

        if ($("analyticsDateFrom")) {
            $("analyticsDateFrom").value = "";
        }

        if ($("analyticsDateTo")) {
            $("analyticsDateTo").value = "";
        }

        applyFilters();

        showToast("Analytics filters cleared.");
    }

    /* =========================================================
       KPI
       ========================================================= */

    function calculateSummary(records) {
        const total = records.length;

        const present = records.filter(
            (record) => record.status === "Present"
        ).length;

        const absent = records.filter(
            (record) => record.status === "Absent"
        ).length;

        const late = records.filter(
            (record) => record.status === "Late"
        ).length;

        const percentage =
            total > 0
                ? ((present + late) / total) * 100
                : 0;

        const students = new Set(
            records.map((record) => record.studentId)
        ).size;

        return {
            total,
            present,
            absent,
            late,
            percentage,
            students
        };
    }

    function renderKPIs() {
        const summary = calculateSummary(
            state.filteredAttendance
        );

        if ($("analyticsTotal")) {
            $("analyticsTotal").textContent = summary.total;
        }

        if ($("analyticsPresent")) {
            $("analyticsPresent").textContent = summary.present;
        }

        if ($("analyticsAbsent")) {
            $("analyticsAbsent").textContent = summary.absent;
        }

        if ($("analyticsLate")) {
            $("analyticsLate").textContent = summary.late;
        }

        if ($("analyticsPercentage")) {
            $("analyticsPercentage").textContent =
                `${summary.percentage.toFixed(1)}%`;
        }

        if ($("analyticsStudents")) {
            $("analyticsStudents").textContent =
                summary.students;
        }
    }

    /* =========================================================
       Donut
       ========================================================= */

    function renderDonut() {
        const summary = calculateSummary(
            state.filteredAttendance
        );

        const donut = $("attendanceDonut");
        const percentage = $("donutPercentage");

        if (!donut) return;

        if (summary.total === 0) {
            donut.style.background =
                "conic-gradient(#e5e7eb 0deg 360deg)";
        } else {
            const presentDegrees =
                (summary.present / summary.total) * 360;

            const absentDegrees =
                (summary.absent / summary.total) * 360;

            const lateDegrees =
                (summary.late / summary.total) * 360;

            const firstEnd = presentDegrees;
            const secondEnd =
                presentDegrees + absentDegrees;
            const thirdEnd =
                secondEnd + lateDegrees;

            donut.style.background =
                `conic-gradient(
                    #16a34a 0deg ${firstEnd}deg,
                    #dc2626 ${firstEnd}deg ${secondEnd}deg,
                    #f59e0b ${secondEnd}deg ${thirdEnd}deg,
                    #e5e7eb ${thirdEnd}deg 360deg
                )`;
        }

        if (percentage) {
            percentage.textContent =
                `${summary.percentage.toFixed(1)}%`;
        }

        if ($("legendPresent")) {
            $("legendPresent").textContent =
                summary.present;
        }

        if ($("legendAbsent")) {
            $("legendAbsent").textContent =
                summary.absent;
        }

        if ($("legendLate")) {
            $("legendLate").textContent =
                summary.late;
        }
    }

    /* =========================================================
       Daily Attendance Chart
       ========================================================= */

    function renderDailyChart() {
        const container = $("dailyAttendanceChart");

        if (!container) return;

        container.innerHTML = "";

        const records = state.filteredAttendance;

        if (!records.length) {
            container.innerHTML = `
                <div class="analytics-empty">
                    <div class="analytics-empty-icon">📊</div>
                    <h3>No Attendance Data</h3>
                    <p>There is no attendance data for the selected filters.</p>
                </div>
            `;

            return;
        }

        const dates = [...new Set(
            records.map((record) => record.date)
        )].sort();

        const maxValue = Math.max(
            1,
            ...dates.map((date) =>
                records.filter(
                    (record) => record.date === date
                ).length
            )
        );

        const chart = document.createElement("div");

        chart.className = "analytics-chart";

        dates.forEach((date) => {
            const dayRecords = records.filter(
                (record) => record.date === date
            );

            const present = dayRecords.filter(
                (record) => record.status === "Present"
            ).length;

            const absent = dayRecords.filter(
                (record) => record.status === "Absent"
            ).length;

            const late = dayRecords.filter(
                (record) => record.status === "Late"
            ).length;

            const total = dayRecords.length;

            const presentHeight =
                Math.max(8, (present / maxValue) * 180);

            const absentHeight =
                Math.max(8, (absent / maxValue) * 180);

            const lateHeight =
                Math.max(8, (late / maxValue) * 180);

            const column = document.createElement("div");

            column.className = "chart-column";

            column.innerHTML = `
                <div class="chart-bars">
                    <div
                        class="chart-bar chart-bar-present"
                        style="height:${presentHeight}px"
                        title="Present: ${present}"
                    >
                        <span>${present}</span>
                    </div>

                    <div
                        class="chart-bar chart-bar-absent"
                        style="height:${absentHeight}px"
                        title="Absent: ${absent}"
                    >
                        <span>${absent}</span>
                    </div>

                    <div
                        class="chart-bar chart-bar-late"
                        style="height:${lateHeight}px"
                        title="Late: ${late}"
                    >
                        <span>${late}</span>
                    </div>
                </div>

                <div class="chart-date">
                    ${formatDate(date)}
                </div>

                <div class="chart-total">
                    ${total} records
                </div>
            `;

            chart.appendChild(column);
        });

        container.appendChild(chart);
    }

    /* =========================================================
       Class Analytics
       ========================================================= */

    function renderClassAnalytics() {
        const body = $("classAnalyticsBody");
        const empty = $("classAnalyticsEmpty");

        if (!body) return;

        body.innerHTML = "";

        const grouped = {};

        state.filteredAttendance.forEach((record) => {
            const className = getStudentClass(
                record.studentId,
                record
            ) || "Unknown";

            if (!grouped[className]) {
                grouped[className] = {
                    total: 0,
                    present: 0,
                    absent: 0,
                    late: 0
                };
            }

            grouped[className].total++;

            if (record.status === "Present") {
                grouped[className].present++;
            }

            if (record.status === "Absent") {
                grouped[className].absent++;
            }

            if (record.status === "Late") {
                grouped[className].late++;
            }
        });

        const classes = Object.keys(grouped).sort(
            (a, b) =>
                a.localeCompare(b, undefined, {
                    numeric: true
                })
        );

        if (!classes.length) {
            if (empty) {
                empty.style.display = "block";
            }

            return;
        }

        if (empty) {
            empty.style.display = "none";
        }

        classes.forEach((className) => {
            const item = grouped[className];

            const attendancePercentage =
                item.total > 0
                    ? ((item.present + item.late) /
                        item.total) *
                      100
                    : 0;

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>
                    <strong>Class ${className}</strong>
                </td>

                <td>${item.total}</td>

                <td>
                    <span class="status-count present-count">
                        ${item.present}
                    </span>
                </td>

                <td>
                    <span class="status-count absent-count">
                        ${item.absent}
                    </span>
                </td>

                <td>
                    <span class="status-count late-count">
                        ${item.late}
                    </span>
                </td>

                <td>
                    <span class="percentage-badge ${getPercentageClass(
                        attendancePercentage
                    )}">
                        ${attendancePercentage.toFixed(1)}%
                    </span>
                </td>
            `;

            body.appendChild(row);
        });
    }

    /* =========================================================
       Student Analytics
       ========================================================= */

    function renderStudentAnalytics() {
        const body = $("studentAnalyticsBody");
        const empty = $("studentAnalyticsEmpty");

        if (!body) return;

        body.innerHTML = "";

        const grouped = {};

        state.filteredAttendance.forEach((record) => {
            const id = record.studentId;

            if (!grouped[id]) {
                grouped[id] = {
                    studentId: id,
                    total: 0,
                    present: 0,
                    absent: 0,
                    late: 0
                };
            }

            grouped[id].total++;

            if (record.status === "Present") {
                grouped[id].present++;
            }

            if (record.status === "Absent") {
                grouped[id].absent++;
            }

            if (record.status === "Late") {
                grouped[id].late++;
            }
        });

        const students = Object.values(grouped).sort(
            (a, b) =>
                getStudentName(a.studentId).localeCompare(
                    getStudentName(b.studentId)
                )
        );

        if (!students.length) {
            if (empty) {
                empty.style.display = "block";
            }

            return;
        }

        if (empty) {
            empty.style.display = "none";
        }

        students.forEach((item) => {
            const student = findStudent(item.studentId);

            const name =
                student?.name ||
                getStudentName(item.studentId);

            const className =
                getStudentClass(
                    item.studentId,
                    {}
                ) || "—";

            const section =
                getStudentSection(
                    item.studentId,
                    {}
                ) || "—";

            const percentage =
                item.total > 0
                    ? ((item.present + item.late) /
                        item.total) *
                      100
                    : 0;

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>
                    <div class="analytics-student-cell">
                        <div class="analytics-student-avatar">
                            ${getInitials(name)}
                        </div>

                        <div>
                            <strong>${escapeHTML(name)}</strong>
                            <small>
                                ${escapeHTML(item.studentId)}
                            </small>
                        </div>
                    </div>
                </td>

                <td>
                    Class ${escapeHTML(className)}
                </td>

                <td>
                    Section ${escapeHTML(section)}
                </td>

                <td>${item.total}</td>

                <td>${item.present}</td>

                <td>${item.absent}</td>

                <td>${item.late}</td>

                <td>
                    <span class="percentage-badge ${getPercentageClass(
                        percentage
                    )}">
                        ${percentage.toFixed(1)}%
                    </span>
                </td>
            `;

            body.appendChild(row);
        });
    }

    function getPercentageClass(value) {
        if (value >= 90) {
            return "percentage-excellent";
        }

        if (value >= 75) {
            return "percentage-good";
        }

        if (value >= 60) {
            return "percentage-warning";
        }

        return "percentage-danger";
    }

    function getInitials(name) {
        const parts = cleanText(name)
            .split(/\s+/)
            .filter(Boolean);

        if (!parts.length) {
            return "ST";
        }

        if (parts.length === 1) {
            return parts[0].slice(0, 2).toUpperCase();
        }

        return (
            parts[0][0] +
            parts[parts.length - 1][0]
        ).toUpperCase();
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* =========================================================
       Render All
       ========================================================= */

    function renderAll() {
        renderKPIs();
        renderDonut();
        renderDailyChart();
        renderClassAnalytics();
        renderStudentAnalytics();
    }

    /* =========================================================
       CSV Export
       ========================================================= */

    function exportCSV() {
        const records = state.filteredAttendance;

        if (!records.length) {
            showToast("No attendance data to export.");
            return;
        }

        const headers = [
            "Date",
            "Student ID",
            "Student Name",
            "Class",
            "Section",
            "Status"
        ];

        const rows = records
            .slice()
            .sort((a, b) => {
                if (a.date !== b.date) {
                    return a.date.localeCompare(b.date);
                }

                return getStudentName(
                    a.studentId
                ).localeCompare(
                    getStudentName(b.studentId)
                );
            })
            .map((record) => [
                record.date,
                record.studentId,
                getStudentName(record.studentId),
                getStudentClass(
                    record.studentId,
                    record
                ),
                getStudentSection(
                    record.studentId,
                    record
                ),
                record.status
            ]);

        const csv = [
            headers,
            ...rows
        ]
            .map((row) =>
                row
                    .map((value) =>
                        `"${String(value ?? "")
                            .replace(/"/g, '""')}"`
                    )
                    .join(",")
            )
            .join("\n");

        const blob = new Blob(
            [csv],
            {
                type: "text/csv;charset=utf-8;"
            }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;
        link.download =
            `SmartSchool360_Attendance_Report_${todayISO()}.csv`;

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);

        showToast("Attendance report exported.");
    }

    /* =========================================================
       Print
       ========================================================= */

    function printReport() {
        window.print();
    }

    /* =========================================================
       Refresh
       ========================================================= */

    function refreshAnalytics() {
        loadStudents();
        loadAttendance();

        populateFilters();
        applyFilters();

        showToast("Attendance analytics refreshed.");
    }

    /* =========================================================
       Event Handling
       ========================================================= */

    function bindButton(id, handler) {
        const element = $(id);

        if (!element) return;

        element.addEventListener("click", handler);

        element.addEventListener(
            "touchend",
            function (event) {
                event.preventDefault();
                handler(event);
            },
            {
                passive: false
            }
        );
    }

    function setupEvents() {
        bindButton(
            "applyAnalyticsBtn",
            function () {
                applyFilters();
                showToast("Analytics filters applied.");
            }
        );

        bindButton(
            "clearAnalyticsBtn",
            clearFilters
        );

        bindButton(
            "refreshAnalyticsBtn",
            refreshAnalytics
        );

        bindButton(
            "exportAnalyticsBtn",
            exportCSV
        );

        bindButton(
            "printAnalyticsBtn",
            printReport
        );

        const classSelect = $("analyticsClass");

        if (classSelect) {
            classSelect.addEventListener(
                "change",
                function () {
                    /*
                     * Keep section independent so the
                     * user can combine filters freely.
                     */
                }
            );
        }
    }

    /* =========================================================
       Initialize
       ========================================================= */

    function initialize() {
        loadStudents();
        loadAttendance();

        populateFilters();

        /*
         * If attendance exists, use its available date range
         * only when filters are not already selected.
         */
        const dates = state.attendance
            .map((record) => record.date)
            .filter(Boolean)
            .sort();

        if (
            dates.length &&
            $("analyticsDateFrom") &&
            $("analyticsDateTo")
        ) {
            /*
             * Keep fields blank by default.
             * Blank means all available dates.
             */
        }

        setupEvents();

        applyFilters();
    }

    if (
        document.readyState === "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );
    } else {
        initialize();
    }
})();
