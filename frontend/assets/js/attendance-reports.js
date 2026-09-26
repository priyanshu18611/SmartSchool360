/* =========================================================
   SmartSchool360
   Attendance Reports
   File: attendance-reports.js
   ========================================================= */

(function () {
    "use strict";

    const STUDENTS_KEY = "smartschool_students";
    const ATTENDANCE_KEY = "smartschool_attendance";

    const state = {
        students: [],
        attendance: [],
        filteredRecords: [],
        visibleRecords: [],
        generated: false
    };

    const $ = (id) => document.getElementById(id);

    /* =========================================================
       HELPERS
       ========================================================= */

    function safeJSON(value, fallback) {
        try {
            return JSON.parse(value);
        } catch (error) {
            return fallback;
        }
    }

    function text(value) {
        return String(value ?? "").trim();
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

    function normalizeDate(value) {
        if (!value) return "";

        const valueText = text(value);

        if (/^\d{4}-\d{2}-\d{2}$/.test(valueText)) {
            return valueText;
        }

        const date = new Date(valueText);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    }

    function formatDate(value) {
        const date = normalizeDate(value);

        if (!date) return "—";

        const parts = date.split("-");

        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    function formatDateLong(value) {
        const date = normalizeDate(value);

        if (!date) return "—";

        const parsed = new Date(`${date}T00:00:00`);

        if (Number.isNaN(parsed.getTime())) {
            return formatDate(date);
        }

        return parsed.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function todayISO() {
        const now = new Date();

        return [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, "0"),
            String(now.getDate()).padStart(2, "0")
        ].join("-");
    }

    function normalizeStatus(value) {
        const status = text(value).toLowerCase();

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

    function showToast(message) {
        const toast = $("reportsToast");

        if (!toast) return;

        toast.textContent = message;
        toast.classList.add("show");

        clearTimeout(showToast.timer);

        showToast.timer = setTimeout(() => {
            toast.classList.remove("show");
        }, 2600);
    }

    /* =========================================================
       DATA
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
        } else if (
            parsed &&
            Array.isArray(parsed.students)
        ) {
            state.students = parsed.students;
        } else {
            state.students = [];
        }
    }

    function normalizeAttendanceRecord(record) {
        if (!record || typeof record !== "object") {
            return null;
        }

        let studentId =
            record.studentId ||
            record.studentID ||
            record.student_id ||
            record.id ||
            "";

        let date =
            record.date ||
            record.attendanceDate ||
            record.attendance_date ||
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

        let status =
            record.status ||
            record.attendanceStatus ||
            record.attendance_status ||
            "";

        if ((!studentId || !date) && record._storageKey) {
            const parts = String(
                record._storageKey
            ).split("__");

            if (parts.length >= 2) {
                if (!date) {
                    date = parts[0];
                }

                if (!studentId) {
                    studentId = parts
                        .slice(1)
                        .join("__");
                }
            }
        }

        studentId = text(studentId);
        date = normalizeDate(date);
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

    function loadAttendance() {
        const raw = localStorage.getItem(
            ATTENDANCE_KEY
        );

        state.attendance = [];

        if (!raw) {
            return;
        }

        const parsed = safeJSON(raw, {});

        if (Array.isArray(parsed)) {
            parsed.forEach((item) => {
                const record =
                    normalizeAttendanceRecord(item);

                if (record) {
                    state.attendance.push(record);
                }
            });

            return;
        }

        if (
            parsed &&
            typeof parsed === "object"
        ) {
            Object.entries(parsed).forEach(
                ([key, value]) => {
                    if (
                        value &&
                        typeof value === "object" &&
                        !Array.isArray(value)
                    ) {
                        const record =
                            normalizeAttendanceRecord({
                                ...value,
                                _storageKey: key
                            });

                        if (record) {
                            state.attendance.push(
                                record
                            );
                        }
                    }
                }
            );
        }
    }

    /* =========================================================
       STUDENT HELPERS
       ========================================================= */

    function findStudent(studentId) {
        return state.students.find(
            (student) =>
                text(student.id) ===
                text(studentId)
        );
    }

    function getStudentName(studentId) {
        const student =
            findStudent(studentId);

        return (
            student?.name ||
            student?.fullName ||
            "Unknown Student"
        );
    }

    function getClass(record) {
        const student =
            findStudent(record.studentId);

        return (
            cleanClass(student?.className) ||
            cleanClass(record.className) ||
            "—"
        );
    }

    function getSection(record) {
        const student =
            findStudent(record.studentId);

        return (
            cleanSection(student?.section) ||
            cleanSection(record.section) ||
            "—"
        );
    }

    /* =========================================================
       FILTER OPTIONS
       ========================================================= */

    function populateClassOptions() {
        const select = $("reportClass");

        if (!select) return;

        const previous = select.value;

        const values = new Set();

        state.students.forEach((student) => {
            const value =
                cleanClass(student.className);

            if (value) {
                values.add(value);
            }
        });

        state.attendance.forEach((record) => {
            const value =
                cleanClass(record.className);

            if (value) {
                values.add(value);
            }
        });

        select.innerHTML =
            `<option value="">All Classes</option>`;

        [...values]
            .sort((a, b) =>
                a.localeCompare(
                    b,
                    undefined,
                    {
                        numeric: true
                    }
                )
            )
            .forEach((value) => {
                const option =
                    document.createElement("option");

                option.value = value;
                option.textContent =
                    `Class ${value}`;

                select.appendChild(option);
            });

        if (
            [...select.options].some(
                (option) =>
                    option.value === previous
            )
        ) {
            select.value = previous;
        }
    }

    function populateSectionOptions() {
        const select = $("reportSection");

        if (!select) return;

        const previous = select.value;

        const values = new Set();

        state.students.forEach((student) => {
            const value =
                cleanSection(student.section);

            if (value) {
                values.add(value);
            }
        });

        state.attendance.forEach((record) => {
            const value =
                cleanSection(record.section);

            if (value) {
                values.add(value);
            }
        });

        select.innerHTML =
            `<option value="">All Sections</option>`;

        [...values]
            .sort((a, b) =>
                a.localeCompare(b)
            )
            .forEach((value) => {
                const option =
                    document.createElement("option");

                option.value = value;
                option.textContent =
                    `Section ${value}`;

                select.appendChild(option);
            });

        if (
            [...select.options].some(
                (option) =>
                    option.value === previous
            )
        ) {
            select.value = previous;
        }
    }

    function populateStudentOptions() {
        const select = $("reportStudent");

        if (!select) return;

        const previous = select.value;

        select.innerHTML =
            `<option value="">All Students</option>`;

        const students = state.students
            .slice()
            .sort((a, b) =>
                text(a.name).localeCompare(
                    text(b.name)
                )
            );

        students.forEach((student) => {
            if (!student.id) return;

            const option =
                document.createElement("option");

            option.value = student.id;

            option.textContent =
                `${student.name || "Unnamed"} — ${student.id}`;

            select.appendChild(option);
        });

        if (
            [...select.options].some(
                (option) =>
                    option.value === previous
            )
        ) {
            select.value = previous;
        }
    }

    /* =========================================================
       REPORT TYPE
       ========================================================= */

    function getReportTypeLabel(type) {
        const labels = {
            daily: "Daily Report",
            "date-range": "Date Range Report",
            student: "Student Report",
            class: "Class Report",
            monthly: "Monthly Report"
        };

        return labels[type] || "Attendance Report";
    }

    function updateDateDefaults() {
        const type =
            $("reportType")?.value ||
            "daily";

        const from =
            $("reportDateFrom");

        const to =
            $("reportDateTo");

        if (!from || !to) return;

        /*
         * Do not overwrite dates if the user
         * has already selected them.
         */

        if (
            type === "daily" &&
            !from.value &&
            !to.value
        ) {
            const today = todayISO();

            from.value = today;
            to.value = today;
        }

        if (
            type === "monthly" &&
            !from.value &&
            !to.value
        ) {
            const now = new Date();

            const year =
                now.getFullYear();

            const month =
                String(
                    now.getMonth() + 1
                ).padStart(2, "0");

            from.value =
                `${year}-${month}-01`;

            const lastDay =
                new Date(
                    year,
                    now.getMonth() + 1,
                    0
                ).getDate();

            to.value =
                `${year}-${month}-${String(
                    lastDay
                ).padStart(2, "0")}`;
        }
    }

    /* =========================================================
       FILTERING
       ========================================================= */

    function getFilters() {
        return {
            type:
                $("reportType")?.value ||
                "daily",

            className:
                cleanClass(
                    $("reportClass")?.value
                ),

            section:
                cleanSection(
                    $("reportSection")?.value
                ),

            studentId:
                text(
                    $("reportStudent")?.value
                ),

            dateFrom:
                normalizeDate(
                    $("reportDateFrom")?.value
                ),

            dateTo:
                normalizeDate(
                    $("reportDateTo")?.value
                )
        };
    }

    function filterRecords() {
        const filters = getFilters();

        let records =
            state.attendance.slice();

        if (filters.className) {
            records = records.filter(
                (record) =>
                    getClass(record) ===
                    filters.className
            );
        }

        if (filters.section) {
            records = records.filter(
                (record) =>
                    getSection(record) ===
                    filters.section
            );
        }

        if (filters.studentId) {
            records = records.filter(
                (record) =>
                    record.studentId ===
                    filters.studentId
            );
        }

        if (filters.dateFrom) {
            records = records.filter(
                (record) =>
                    record.date >=
                    filters.dateFrom
            );
        }

        if (filters.dateTo) {
            records = records.filter(
                (record) =>
                    record.date <=
                    filters.dateTo
            );
        }

        records.sort((a, b) => {
            if (a.date !== b.date) {
                return b.date.localeCompare(
                    a.date
                );
            }

            return getStudentName(
                a.studentId
            ).localeCompare(
                getStudentName(
                    b.studentId
                )
            );
        });

        state.filteredRecords = records;

        return records;
    }

    /* =========================================================
       SUMMARY
       ========================================================= */

    function calculateSummary(records) {
        const total = records.length;

        const present =
            records.filter(
                (record) =>
                    record.status ===
                    "Present"
            ).length;

        const absent =
            records.filter(
                (record) =>
                    record.status ===
                    "Absent"
            ).length;

        const late =
            records.filter(
                (record) =>
                    record.status ===
                    "Late"
            ).length;

        const attendance =
            total > 0
                ? ((present + late) /
                    total) *
                  100
                : 0;

        const students =
            new Set(
                records.map(
                    (record) =>
                        record.studentId
                )
            ).size;

        return {
            total,
            present,
            absent,
            late,
            attendance,
            students
        };
    }

    function renderSummary(records) {
        const summary =
            calculateSummary(records);

        if ($("reportTotalRecords")) {
            $("reportTotalRecords")
                .textContent =
                summary.total;
        }

        if ($("reportPresent")) {
            $("reportPresent")
                .textContent =
                summary.present;
        }

        if ($("reportAbsent")) {
            $("reportAbsent")
                .textContent =
                summary.absent;
        }

        if ($("reportLate")) {
            $("reportLate")
                .textContent =
                summary.late;
        }

        if ($("reportPercentage")) {
            $("reportPercentage")
                .textContent =
                `${summary.attendance.toFixed(1)}%`;
        }

        if ($("reportStudents")) {
            $("reportStudents")
                .textContent =
                summary.students;
        }
    }

    /* =========================================================
       REPORT META
       ========================================================= */

    function renderMeta(records) {
        const filters = getFilters();

        const typeLabel =
            getReportTypeLabel(
                filters.type
            );

        if ($("generatedReportType")) {
            $("generatedReportType")
                .textContent =
                typeLabel;
        }

        let period = "All available dates";

        if (
            filters.dateFrom &&
            filters.dateTo
        ) {
            if (
                filters.dateFrom ===
                filters.dateTo
            ) {
                period =
                    formatDateLong(
                        filters.dateFrom
                    );
            } else {
                period =
                    `${formatDateLong(
                        filters.dateFrom
                    )} → ${formatDateLong(
                        filters.dateTo
                    )}`;
            }
        } else if (records.length) {
            const dates = records
                .map(
                    (record) =>
                        record.date
                )
                .sort();

            period =
                `${formatDateLong(
                    dates[0]
                )} → ${formatDateLong(
                    dates[dates.length - 1]
                )}`;
        }

        if ($("generatedReportPeriod")) {
            $("generatedReportPeriod")
                .textContent =
                period;
        }

        if ($("generatedReportTime")) {
            $("generatedReportTime")
                .textContent =
                new Date().toLocaleString(
                    "en-IN",
                    {
                        dateStyle: "medium",
                        timeStyle: "short"
                    }
                );
        }
    }

    /* =========================================================
       DETAIL TABLE
       ========================================================= */

    function renderDetailTable(records) {
        const body =
            $("reportTableBody");

        if (!body) return;

        body.innerHTML = "";

        if (!records.length) {
            body.innerHTML = `
                <tr>
                    <td
                        colspan="6"
                        class="table-empty"
                    >
                        <div class="empty-icon">
                            📑
                        </div>

                        <h3>
                            No Attendance Records
                        </h3>

                        <p>
                            No attendance data matches
                            the selected filters.
                        </p>
                    </td>
                </tr>
            `;

            updateRecordCount(0);

            return;
        }

        records.forEach((record) => {
            const name =
                getStudentName(
                    record.studentId
                );

            const className =
                getClass(record);

            const section =
                getSection(record);

            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>
                    ${escapeHTML(
                        formatDate(
                            record.date
                        )
                    )}
                </td>

                <td>
                    <div class="analytics-student-name">

                        <div class="analytics-student-avatar">
                            ${escapeHTML(
                                getInitials(
                                    name
                                )
                            )}
                        </div>

                        <div>
                            <strong>
                                ${escapeHTML(
                                    name
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    record.studentId
                                )}
                            </small>
                        </div>

                    </div>
                </td>

                <td>
                    ${escapeHTML(
                        record.studentId
                    )}
                </td>

                <td>
                    Class ${escapeHTML(
                        className
                    )}
                </td>

                <td>
                    Section ${escapeHTML(
                        section
                    )}
                </td>

                <td>
                    <span class="report-status ${record.status.toLowerCase()}">
                        ${escapeHTML(
                            record.status
                        )}
                    </span>
                </td>
            `;

            body.appendChild(row);
        });

        updateRecordCount(
            records.length
        );
    }

    function updateRecordCount(count) {
        if (!$("reportRecordCount")) {
            return;
        }

        $("reportRecordCount")
            .textContent =
            `${count} ${
                count === 1
                    ? "Record"
                    : "Records"
            }`;
    }

    /* =========================================================
       STUDENT SUMMARY
       ========================================================= */

    function renderStudentSummary(records) {
        const body =
            $("studentSummaryBody");

        if (!body) return;

        body.innerHTML = "";

        if (!records.length) {
            body.innerHTML = `
                <tr>
                    <td
                        colspan="8"
                        class="table-empty"
                    >
                        <div class="empty-icon">
                            👨‍🎓
                        </div>

                        <h3>
                            No Student Summary
                        </h3>

                        <p>
                            Generate a report to calculate
                            student attendance percentages.
                        </p>
                    </td>
                </tr>
            `;

            return;
        }

        const grouped = {};

        records.forEach((record) => {
            const id =
                record.studentId;

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

            if (
                record.status ===
                "Present"
            ) {
                grouped[id].present++;
            }

            if (
                record.status ===
                "Absent"
            ) {
                grouped[id].absent++;
            }

            if (
                record.status ===
                "Late"
            ) {
                grouped[id].late++;
            }
        });

        const students =
            Object.values(grouped).sort(
                (a, b) =>
                    getStudentName(
                        a.studentId
                    ).localeCompare(
                        getStudentName(
                            b.studentId
                        )
                    )
            );

        students.forEach((item) => {
            const name =
                getStudentName(
                    item.studentId
                );

            const fakeRecord = {
                studentId:
                    item.studentId
            };

            const className =
                getClass(fakeRecord);

            const section =
                getSection(fakeRecord);

            const percentage =
                item.total > 0
                    ? ((item.present +
                        item.late) /
                        item.total) *
                      100
                    : 0;

            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>
                    <div class="analytics-student-name">

                        <div class="analytics-student-avatar">
                            ${escapeHTML(
                                getInitials(
                                    name
                                )
                            )}
                        </div>

                        <div>
                            <strong>
                                ${escapeHTML(
                                    name
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    item.studentId
                                )}
                            </small>
                        </div>

                    </div>
                </td>

                <td>
                    Class ${escapeHTML(
                        className
                    )}
                </td>

                <td>
                    Section ${escapeHTML(
                        section
                    )}
                </td>

                <td>
                    ${item.total}
                </td>

                <td>
                    ${item.present}
                </td>

                <td>
                    ${item.absent}
                </td>

                <td>
                    ${item.late}
                </td>

                <td>
                    <span class="percentage-badge ${getPercentageClass(
                        percentage
                    )}">
                        ${percentage.toFixed(
                            1
                        )}%
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

    /* =========================================================
       SEARCH
       ========================================================= */

    function applySearch() {
        const query =
            text(
                $("reportSearch")?.value
            ).toLowerCase();

        if (!query) {
            state.visibleRecords =
                state.filteredRecords
                    .slice();

            renderDetailTable(
                state.visibleRecords
            );

            return;
        }

        const filtered =
            state.filteredRecords.filter(
                (record) => {
                    const name =
                        getStudentName(
                            record.studentId
                        ).toLowerCase();

                    const id =
                        text(
                            record.studentId
                        ).toLowerCase();

                    const className =
                        getClass(record)
                            .toLowerCase();

                    const section =
                        getSection(record)
                            .toLowerCase();

                    return (
                        name.includes(query) ||
                        id.includes(query) ||
                        className.includes(query) ||
                        section.includes(query)
                    );
                }
            );

        state.visibleRecords =
            filtered;

        renderDetailTable(
            filtered
        );
    }

    /* =========================================================
       GENERATE REPORT
       ========================================================= */

    function generateReport() {
        const records =
            filterRecords();

        state.visibleRecords =
            records.slice();

        state.generated = true;

        renderSummary(records);
        renderMeta(records);
        renderDetailTable(records);
        renderStudentSummary(records);

        const type =
            $("reportType")?.value ||
            "daily";

        let subtitle =
            `${getReportTypeLabel(type)} — ${records.length} attendance records`;

        if (!records.length) {
            subtitle =
                `${getReportTypeLabel(type)} — no matching records`;
        }

        if ($("reportTableSubtitle")) {
            $("reportTableSubtitle")
                .textContent =
                subtitle;
        }

        showToast(
            records.length
                ? "Attendance report generated successfully."
                : "No attendance records found for the selected filters."
        );
    }

    /* =========================================================
       CLEAR
       ========================================================= */

    function clearReport() {
        if ($("reportType")) {
            $("reportType").value =
                "daily";
        }

        if ($("reportClass")) {
            $("reportClass").value =
                "";
        }

        if ($("reportSection")) {
            $("reportSection").value =
                "";
        }

        if ($("reportStudent")) {
            $("reportStudent").value =
                "";
        }

        if ($("reportDateFrom")) {
            $("reportDateFrom").value =
                "";
        }

        if ($("reportDateTo")) {
            $("reportDateTo").value =
                "";
        }

        if ($("reportSearch")) {
            $("reportSearch").value =
                "";
        }

        state.filteredRecords = [];
        state.visibleRecords = [];
        state.generated = false;

        renderSummary([]);
        renderMeta([]);
        renderDetailTable([]);
        renderStudentSummary([]);

        if ($("reportTableSubtitle")) {
            $("reportTableSubtitle")
                .textContent =
                "Generate a report to view attendance records.";
        }

        showToast(
            "Report filters cleared."
        );
    }

    /* =========================================================
       CSV EXPORT
       ========================================================= */

    function csvEscape(value) {
        return `"${String(value ?? "")
            .replace(/"/g, '""')}"`;
    }

    function exportCSV() {
        const records =
            state.visibleRecords.length
                ? state.visibleRecords
                : state.filteredRecords;

        if (!records.length) {
            showToast(
                "Generate a report before exporting."
            );

            return;
        }

        const headers = [
            "Date",
            "Student Name",
            "Student ID",
            "Class",
            "Section",
            "Status"
        ];

        const rows = records.map(
            (record) => [
                record.date,
                getStudentName(
                    record.studentId
                ),
                record.studentId,
                getClass(record),
                getSection(record),
                record.status
            ]
        );

        const csv = [
            headers,
            ...rows
        ]
            .map((row) =>
                row
                    .map(csvEscape)
                    .join(",")
            )
            .join("\n");

        downloadFile(
            csv,
            `SmartSchool360_Attendance_Report_${todayISO()}.csv`,
            "text/csv;charset=utf-8;"
        );

        showToast(
            "CSV report exported successfully."
        );
    }

    /* =========================================================
       JSON EXPORT
       ========================================================= */

    function exportJSON() {
        const records =
            state.visibleRecords.length
                ? state.visibleRecords
                : state.filteredRecords;

        if (!records.length) {
            showToast(
                "Generate a report before exporting."
            );

            return;
        }

        const summary =
            calculateSummary(records);

        const report = {
            application:
                "SmartSchool360",

            reportType:
                getReportTypeLabel(
                    getFilters().type
                ),

            generatedAt:
                new Date().toISOString(),

            summary,

            records: records.map(
                (record) => ({
                    date: record.date,

                    studentName:
                        getStudentName(
                            record.studentId
                        ),

                    studentId:
                        record.studentId,

                    class:
                        getClass(record),

                    section:
                        getSection(record),

                    status:
                        record.status
                })
            )
        };

        downloadFile(
            JSON.stringify(
                report,
                null,
                2
            ),
            `SmartSchool360_Attendance_Report_${todayISO()}.json`,
            "application/json;charset=utf-8;"
        );

        showToast(
            "JSON report exported successfully."
        );
    }

    function downloadFile(
        content,
        filename,
        mimeType
    ) {
        const blob =
            new Blob(
                [content],
                {
                    type: mimeType
                }
            );

        const url =
            URL.createObjectURL(
                blob
            );

        const link =
            document.createElement("a");

        link.href = url;
        link.download = filename;

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

    /* =========================================================
       PRINT
       ========================================================= */

    function printReport() {
        const records =
            state.visibleRecords.length
                ? state.visibleRecords
                : state.filteredRecords;

        if (!records.length) {
            showToast(
                "Generate a report before printing."
            );

            return;
        }

        window.print();
    }

    /* =========================================================
       REFRESH
       ========================================================= */

    function refreshReports() {
        loadStudents();
        loadAttendance();

        populateClassOptions();
        populateSectionOptions();
        populateStudentOptions();

        generateReport();

        showToast(
            "Attendance reports refreshed."
        );
    }

    /* =========================================================
       NAVIGATION
       ========================================================= */

    function goBackToAnalytics() {
        window.location.href =
            "attendance-analytics.html";
    }

    /* =========================================================
       EVENT BINDING
       ========================================================= */

    function bindButton(
        id,
        handler
    ) {
        const element = $(id);

        if (!element) return;

        element.addEventListener(
            "click",
            handler
        );

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
            "backToAnalyticsBtn",
            goBackToAnalytics
        );

        bindButton(
            "refreshReportsBtn",
            refreshReports
        );

        bindButton(
            "generateReportBtn",
            generateReport
        );

        bindButton(
            "clearReportBtn",
            clearReport
        );

        bindButton(
            "printReportBtn",
            printReport
        );

        bindButton(
            "exportCSVBtn",
            exportCSV
        );

        bindButton(
            "exportJSONBtn",
            exportJSON
        );

        const reportType =
            $("reportType");

        if (reportType) {
            reportType.addEventListener(
                "change",
                function () {

                    if (
                        this.value ===
                        "daily"
                    ) {
                        if (
                            $("reportDateFrom")
                        ) {
                            $("reportDateFrom")
                                .value =
                                todayISO();
                        }

                        if (
                            $("reportDateTo")
                        ) {
                            $("reportDateTo")
                                .value =
                                todayISO();
                        }
                    }

                    if (
                        this.value ===
                        "monthly"
                    ) {
                        const now =
                            new Date();

                        const year =
                            now.getFullYear();

                        const month =
                            String(
                                now.getMonth() +
                                1
                            ).padStart(
                                2,
                                "0"
                            );

                        if (
                            $("reportDateFrom")
                        ) {
                            $("reportDateFrom")
                                .value =
                                `${year}-${month}-01`;
                        }

                        const lastDay =
                            new Date(
                                year,
                                now.getMonth() +
                                1,
                                0
                            ).getDate();

                        if (
                            $("reportDateTo")
                        ) {
                            $("reportDateTo")
                                .value =
                                `${year}-${month}-${String(
                                    lastDay
                                ).padStart(
                                    2,
                                    "0"
                                )}`;
                        }
                    }
                }
            );
        }

        const search =
            $("reportSearch");

        if (search) {
            search.addEventListener(
                "input",
                applySearch
            );
        }

        const student =
            $("reportStudent");

        if (student) {
            student.addEventListener(
                "change",
                function () {
                    if (
                        this.value &&
                        $("reportType")
                    ) {
                        $("reportType")
                            .value =
                            "student";
                    }
                }
            );
        }

        const classSelect =
            $("reportClass");

        if (classSelect) {
            classSelect.addEventListener(
                "change",
                function () {
                    /*
                     * Class and section remain
                     * independently selectable.
                     */
                }
            );
        }
    }

    /* =========================================================
       INITIALIZE
       ========================================================= */

    function initialize() {
        loadStudents();
        loadAttendance();

        populateClassOptions();
        populateSectionOptions();
        populateStudentOptions();

        setupEvents();

        updateDateDefaults();

        /*
         * Initial report uses today's date.
         * If there is no attendance for today,
         * the page will clearly show no records.
         */
        generateReport();
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
