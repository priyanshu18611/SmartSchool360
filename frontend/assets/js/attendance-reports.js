/* =========================================================
   SmartSchool360
   Attendance Reports
   Robust Attendance Data Compatibility
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
       BASIC HELPERS
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

        /*
         * Handles:
         * 2026/09/26
         * 26/09/2026
         * 26-09-2026
         */
        let match = valueText.match(
            /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/
        );

        if (match) {
            const day = match[1].padStart(2, "0");
            const month = match[2].padStart(2, "0");
            const year = match[3];

            return `${year}-${month}-${day}`;
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
        if (
            value &&
            typeof value === "object"
        ) {
            value =
                value.status ||
                value.attendanceStatus ||
                value.attendance_status ||
                value.value ||
                "";
        }

        const status = text(value).toLowerCase();

        if (
            status === "present" ||
            status === "p" ||
            status === "1" ||
            status === "true"
        ) {
            return "Present";
        }

        if (
            status === "absent" ||
            status === "a" ||
            status === "0" ||
            status === "false"
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
       STUDENT DATA
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

    /* =========================================================
       ATTENDANCE NORMALIZATION
       ========================================================= */

    function buildRecord(
        studentId,
        date,
        status,
        className = "",
        section = "",
        extra = {}
    ) {
        studentId = text(studentId);
        date = normalizeDate(date);
        status = normalizeStatus(status);
        className = cleanClass(className);
        section = cleanSection(section);

        if (!studentId || !date || !status) {
            return null;
        }

        return {
            studentId,
            date,
            className,
            section,
            status,
            updatedAt:
                extra.updatedAt || "",
            savedAt:
                extra.savedAt || ""
        };
    }

    function recordFromObject(
        value,
        fallbackKey = "",
        context = {}
    ) {
        if (
            !value ||
            typeof value !== "object" ||
            Array.isArray(value)
        ) {
            return null;
        }

        let studentId =
            value.studentId ||
            value.studentID ||
            value.student_id ||
            value.student ||
            value.studentKey ||
            "";

        let date =
            value.date ||
            value.attendanceDate ||
            value.attendance_date ||
            value.day ||
            context.date ||
            "";

        let status =
            value.status ||
            value.attendanceStatus ||
            value.attendance_status ||
            value.value ||
            "";

        let className =
            value.className ||
            value.class ||
            value.class_name ||
            context.className ||
            "";

        let section =
            value.section ||
            value.sectionName ||
            value.section_name ||
            context.section ||
            "";

        /*
         * Storage key format used by SmartSchool360:
         *
         * YYYY-MM-DD__STUDENT_ID
         */
        if (
            fallbackKey &&
            (
                !studentId ||
                !date
            )
        ) {
            const keyParts =
                String(fallbackKey).split("__");

            if (keyParts.length >= 2) {
                if (!date) {
                    date = keyParts[0];
                }

                if (!studentId) {
                    studentId =
                        keyParts
                            .slice(1)
                            .join("__");
                }
            }
        }

        /*
         * Another possible key:
         *
         * STUDENT_ID__YYYY-MM-DD
         */
        if (
            fallbackKey &&
            (
                !studentId ||
                !date
            )
        ) {
            const keyParts =
                String(fallbackKey).split("__");

            if (keyParts.length >= 2) {
                const firstDate =
                    normalizeDate(
                        keyParts[0]
                    );

                const secondDate =
                    normalizeDate(
                        keyParts[
                            keyParts.length - 1
                        ]
                    );

                if (firstDate) {
                    date = date || firstDate;

                    if (!studentId) {
                        studentId =
                            keyParts
                                .slice(1)
                                .join("__");
                    }
                }

                if (secondDate) {
                    date = date || secondDate;

                    if (!studentId) {
                        studentId =
                            keyParts
                                .slice(
                                    0,
                                    -1
                                )
                                .join("__");
                    }
                }
            }
        }

        return buildRecord(
            studentId,
            date,
            status,
            className,
            section,
            value
        );
    }

    function collectAttendance(
        source,
        context = {},
        output = [],
        visited = new WeakSet()
    ) {
        if (
            source === null ||
            source === undefined
        ) {
            return output;
        }

        /*
         * String can be:
         * - JSON
         * - Present / Absent / Late
         */
        if (
            typeof source === "string"
        ) {
            const parsed =
                safeJSON(
                    source,
                    null
                );

            if (
                parsed !== null &&
                typeof parsed === "object"
            ) {
                collectAttendance(
                    parsed,
                    context,
                    output,
                    visited
                );

                return output;
            }

            const status =
                normalizeStatus(source);

            if (
                status &&
                context.studentId &&
                context.date
            ) {
                const record =
                    buildRecord(
                        context.studentId,
                        context.date,
                        status,
                        context.className,
                        context.section
                    );

                if (record) {
                    output.push(record);
                }
            }

            return output;
        }

        /*
         * Primitive status values.
         */
        if (
            typeof source === "number" ||
            typeof source === "boolean"
        ) {
            const status =
                normalizeStatus(source);

            if (
                status &&
                context.studentId &&
                context.date
            ) {
                const record =
                    buildRecord(
                        context.studentId,
                        context.date,
                        status,
                        context.className,
                        context.section
                    );

                if (record) {
                    output.push(record);
                }
            }

            return output;
        }

        /*
         * Array.
         */
        if (Array.isArray(source)) {
            source.forEach((item) => {
                collectAttendance(
                    item,
                    context,
                    output,
                    visited
                );
            });

            return output;
        }

        /*
         * Object.
         */
        if (
            typeof source === "object"
        ) {
            if (visited.has(source)) {
                return output;
            }

            visited.add(source);

            /*
             * First, try treating this object
             * as an actual attendance record.
             */
            const directRecord =
                recordFromObject(
                    source,
                    "",
                    context
                );

            if (directRecord) {
                output.push(
                    directRecord
                );

                return output;
            }

            /*
             * Otherwise inspect its keys.
             */
            Object.entries(source)
                .forEach(
                    ([key, value]) => {

                        const keyText =
                            text(key);

                        /*
                         * Detect:
                         * YYYY-MM-DD__STUDENT_ID
                         */
                        const keyParts =
                            keyText.split("__");

                        let nextContext = {
                            ...context
                        };

                        if (
                            keyParts.length >= 2
                        ) {
                            const firstDate =
                                normalizeDate(
                                    keyParts[0]
                                );

                            const lastDate =
                                normalizeDate(
                                    keyParts[
                                        keyParts.length - 1
                                    ]
                                );

                            if (firstDate) {
                                nextContext.date =
                                    firstDate;

                                nextContext.studentId =
                                    keyParts
                                        .slice(1)
                                        .join("__");
                            } else if (
                                lastDate
                            ) {
                                nextContext.date =
                                    lastDate;

                                nextContext.studentId =
                                    keyParts
                                        .slice(
                                            0,
                                            -1
                                        )
                                        .join("__");
                            }
                        }

                        /*
                         * Detect direct date keys.
                         */
                        const keyDate =
                            normalizeDate(
                                keyText
                            );

                        if (keyDate) {
                            nextContext.date =
                                keyDate;
                        }

                        /*
                         * Detect student object keys
                         * using known student IDs.
                         */
                        const knownStudent =
                            state.students.find(
                                (student) =>
                                    text(
                                        student.id
                                    ) === keyText
                            );

                        if (
                            knownStudent
                        ) {
                            nextContext.studentId =
                                keyText;

                            nextContext.className =
                                cleanClass(
                                    knownStudent.className
                                );

                            nextContext.section =
                                cleanSection(
                                    knownStudent.section
                                );
                        }

                        /*
                         * Direct primitive status:
                         *
                         * {
                         *   "2026-09-26__SS20261011":
                         *   "Present"
                         * }
                         */
                        const directStatus =
                            normalizeStatus(
                                value
                            );

                        if (
                            directStatus &&
                            nextContext.studentId &&
                            nextContext.date
                        ) {
                            const record =
                                buildRecord(
                                    nextContext.studentId,
                                    nextContext.date,
                                    directStatus,
                                    nextContext.className,
                                    nextContext.section
                                );

                            if (record) {
                                output.push(
                                    record
                                );
                            }

                            return;
                        }

                        /*
                         * Nested object/array.
                         */
                        collectAttendance(
                            value,
                            nextContext,
                            output,
                            visited
                        );
                    }
                );
        }

        return output;
    }

    function deduplicateAttendance(
        records
    ) {
        const map = new Map();

        records.forEach((record) => {
            const key =
                [
                    record.date,
                    record.studentId
                ].join("__");

            /*
             * Latest record wins.
             */
            map.set(
                key,
                record
            );
        });

        return [...map.values()];
    }

    function loadAttendance() {
        state.attendance = [];

        const raw =
            localStorage.getItem(
                ATTENDANCE_KEY
            );

        if (!raw) {
            return;
        }

        /*
         * Parse JSON first.
         */
        const parsed =
            safeJSON(
                raw,
                null
            );

        if (
            parsed === null
        ) {
            /*
             * In case storage itself is
             * a primitive/string status.
             */
            return;
        }

        const records =
            collectAttendance(
                parsed
            );

        state.attendance =
            deduplicateAttendance(
                records
            );
    }

    /* =========================================================
       STUDENT LOOKUP
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
            findStudent(
                record.studentId
            );

        return (
            cleanClass(
                student?.className
            ) ||
            cleanClass(
                record.className
            ) ||
            "—"
        );
    }

    function getSection(record) {
        const student =
            findStudent(
                record.studentId
            );

        return (
            cleanSection(
                student?.section
            ) ||
            cleanSection(
                record.section
            ) ||
            "—"
        );
    }

    /* =========================================================
       FILTER OPTIONS
       ========================================================= */

    function populateClassOptions() {
        const select =
            $("reportClass");

        if (!select) return;

        const previous =
            select.value;

        const values =
            new Set();

        state.students.forEach(
            (student) => {
                const value =
                    cleanClass(
                        student.className
                    );

                if (value) {
                    values.add(value);
                }
            }
        );

        state.attendance.forEach(
            (record) => {
                const value =
                    getClass(record);

                if (
                    value &&
                    value !== "—"
                ) {
                    values.add(value);
                }
            }
        );

        select.innerHTML =
            `<option value="">All Classes</option>`;

        [...values]
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
            [...select.options].some(
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
            $("reportSection");

        if (!select) return;

        const previous =
            select.value;

        const values =
            new Set();

        state.students.forEach(
            (student) => {
                const value =
                    cleanSection(
                        student.section
                    );

                if (value) {
                    values.add(value);
                }
            }
        );

        state.attendance.forEach(
            (record) => {
                const value =
                    getSection(record);

                if (
                    value &&
                    value !== "—"
                ) {
                    values.add(value);
                }
            }
        );

        select.innerHTML =
            `<option value="">All Sections</option>`;

        [...values]
            .sort((a, b) =>
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
            [...select.options].some(
                (option) =>
                    option.value ===
                    previous
            )
        ) {
            select.value =
                previous;
        }
    }

    function populateStudentOptions() {
        const select =
            $("reportStudent");

        if (!select) return;

        const previous =
            select.value;

        select.innerHTML =
            `<option value="">All Students</option>`;

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

        if (
            [...select.options].some(
                (option) =>
                    option.value ===
                    previous
            )
        ) {
            select.value =
                previous;
        }
    }

    /* =========================================================
       REPORT TYPE
       ========================================================= */

    function getReportTypeLabel(type) {
        const labels = {
            daily: "Daily Report",
            "date-range":
                "Date Range Report",
            student:
                "Student Report",
            class:
                "Class Report",
            monthly:
                "Monthly Report"
        };

        return (
            labels[type] ||
            "Attendance Report"
        );
    }

    function updateDateDefaults() {
        const type =
            $("reportType")?.value ||
            "daily";

        const from =
            $("reportDateFrom");

        const to =
            $("reportDateTo");

        if (!from || !to) {
            return;
        }

        if (
            type === "daily" &&
            !from.value &&
            !to.value
        ) {
            const today =
                todayISO();

            from.value =
                today;

            to.value =
                today;
        }

        if (
            type === "monthly" &&
            !from.value &&
            !to.value
        ) {
            const now =
                new Date();

            const year =
                now.getFullYear();

            const monthIndex =
                now.getMonth();

            const month =
                String(
                    monthIndex + 1
                ).padStart(
                    2,
                    "0"
                );

            from.value =
                `${year}-${month}-01`;

            const lastDay =
                new Date(
                    year,
                    monthIndex + 1,
                    0
                ).getDate();

            to.value =
                `${year}-${month}-${String(
                    lastDay
                ).padStart(
                    2,
                    "0"
                )}`;
        }
    }

    /* =========================================================
       FILTERS
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
        const filters =
            getFilters();

        let records =
            state.attendance.slice();

        if (filters.className) {
            records =
                records.filter(
                    (record) =>
                        getClass(
                            record
                        ) ===
                        filters.className
                );
        }

        if (filters.section) {
            records =
                records.filter(
                    (record) =>
                        getSection(
                            record
                        ) ===
                        filters.section
                );
        }

        if (filters.studentId) {
            records =
                records.filter(
                    (record) =>
                        record.studentId ===
                        filters.studentId
                );
        }

        if (filters.dateFrom) {
            records =
                records.filter(
                    (record) =>
                        record.date >=
                        filters.dateFrom
                );
        }

        if (filters.dateTo) {
            records =
                records.filter(
                    (record) =>
                        record.date <=
                        filters.dateTo
                );
        }

        records.sort(
            (a, b) => {
                if (
                    a.date !==
                    b.date
                ) {
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
            }
        );

        state.filteredRecords =
            records;

        return records;
    }

    /* =========================================================
       SUMMARY
       ========================================================= */

    function calculateSummary(
        records
    ) {
        const total =
            records.length;

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
                ? (
                    (present + late) /
                    total
                ) * 100
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

    function renderSummary(
        records
    ) {
        const summary =
            calculateSummary(
                records
            );

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
       META
       ========================================================= */

    function renderMeta(
        records
    ) {
        const filters =
            getFilters();

        if ($("generatedReportType")) {
            $("generatedReportType")
                .textContent =
                getReportTypeLabel(
                    filters.type
                );
        }

        let period =
            "All available dates";

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
        } else if (
            records.length
        ) {
            const dates =
                records
                    .map(
                        (record) =>
                            record.date
                    )
                    .sort();

            period =
                `${formatDateLong(
                    dates[0]
                )} → ${formatDateLong(
                    dates[
                        dates.length - 1
                    ]
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
                        dateStyle:
                            "medium",
                        timeStyle:
                            "short"
                    }
                );
        }
    }

    /* =========================================================
       DETAIL TABLE
       ========================================================= */

    function renderDetailTable(
        records
    ) {
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

        records.forEach(
            (record) => {
                const name =
                    getStudentName(
                        record.studentId
                    );

                const row =
                    document.createElement(
                        "tr"
                    );

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
                            getClass(
                                record
                            )
                        )}
                    </td>

                    <td>
                        Section ${escapeHTML(
                            getSection(
                                record
                            )
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

                body.appendChild(
                    row
                );
            }
        );

        updateRecordCount(
            records.length
        );
    }

    function updateRecordCount(
        count
    ) {
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

    function renderStudentSummary(
        records
    ) {
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

        records.forEach(
            (record) => {
                const id =
                    record.studentId;

                if (!grouped[id]) {
                    grouped[id] = {
                        studentId:
                            id,
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
                    grouped[id]
                        .present++;
                }

                if (
                    record.status ===
                    "Absent"
                ) {
                    grouped[id]
                        .absent++;
                }

                if (
                    record.status ===
                    "Late"
                ) {
                    grouped[id]
                        .late++;
                }
            }
        );

        Object.values(grouped)
            .sort(
                (a, b) =>
                    getStudentName(
                        a.studentId
                    ).localeCompare(
                        getStudentName(
                            b.studentId
                        )
                    )
            )
            .forEach(
                (item) => {
                    const name =
                        getStudentName(
                            item.studentId
                        );

                    const fakeRecord = {
                        studentId:
                            item.studentId
                    };

                    const percentage =
                        item.total > 0
                            ? (
                                (
                                    item.present +
                                    item.late
                                ) /
                                item.total
                            ) * 100
                            : 0;

                    const row =
                        document.createElement(
                            "tr"
                        );

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
                                getClass(
                                    fakeRecord
                                )
                            )}
                        </td>

                        <td>
                            Section ${escapeHTML(
                                getSection(
                                    fakeRecord
                                )
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

                    body.appendChild(
                        row
                    );
                }
            );
    }

    function getPercentageClass(
        value
    ) {
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
                $("reportSearch")
                    ?.value
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
                        getClass(
                            record
                        ).toLowerCase();

                    const section =
                        getSection(
                            record
                        ).toLowerCase();

                    return (
                        name.includes(
                            query
                        ) ||
                        id.includes(
                            query
                        ) ||
                        className.includes(
                            query
                        ) ||
                        section.includes(
                            query
                        )
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
       GENERATE
       ========================================================= */

    function generateReport() {
        /*
         * Reload data every time so the report
         * always uses the latest localStorage.
         */
        loadStudents();
        loadAttendance();

        populateClassOptions();
        populateSectionOptions();
        populateStudentOptions();

        const records =
            filterRecords();

        state.visibleRecords =
            records.slice();

        state.generated = true;

        renderSummary(
            records
        );

        renderMeta(
            records
        );

        renderDetailTable(
            records
        );

        renderStudentSummary(
            records
        );

        const type =
            $("reportType")?.value ||
            "daily";

        if ($("reportTableSubtitle")) {
            $("reportTableSubtitle")
                .textContent =
                records.length
                    ? `${getReportTypeLabel(
                        type
                    )} — ${records.length} attendance records`
                    : `${getReportTypeLabel(
                        type
                    )} — no matching records`;
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
       CSV
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

        const rows =
            records.map(
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
            .map(
                (row) =>
                    row
                        .map(
                            csvEscape
                        )
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
       JSON
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

        const report = {
            application:
                "SmartSchool360",

            reportType:
                getReportTypeLabel(
                    getFilters().type
                ),

            generatedAt:
                new Date().toISOString(),

            summary:
                calculateSummary(
                    records
                ),

            records:
                records.map(
                    (record) => ({
                        date:
                            record.date,

                        studentName:
                            getStudentName(
                                record.studentId
                            ),

                        studentId:
                            record.studentId,

                        class:
                            getClass(
                                record
                            ),

                        section:
                            getSection(
                                record
                            ),

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

        setTimeout(
            () => {
                URL.revokeObjectURL(
                    url
                );
            },
            1000
        );
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
    }

    /* =========================================================
       NAVIGATION
       ========================================================= */

    function goBackToAnalytics() {
        window.location.href =
            "attendance-analytics.html";
    }

    /* =========================================================
       BUTTON EVENTS
       ========================================================= */

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

        const search =
            $("reportSearch");

        if (search) {
            search.addEventListener(
                "input",
                applySearch
            );
        }

        const reportType =
            $("reportType");

        if (reportType) {
            reportType.addEventListener(
                "change",
                function () {
                    const type =
                        this.value;

                    if (
                        type ===
                        "daily"
                    ) {
                        const today =
                            todayISO();

                        $("reportDateFrom")
                            .value =
                            today;

                        $("reportDateTo")
                            .value =
                            today;
                    }

                    if (
                        type ===
                        "monthly"
                    ) {
                        const now =
                            new Date();

                        const year =
                            now.getFullYear();

                        const monthIndex =
                            now.getMonth();

                        const month =
                            String(
                                monthIndex +
                                1
                            ).padStart(
                                2,
                                "0"
                            );

                        $("reportDateFrom")
                            .value =
                            `${year}-${month}-01`;

                        const lastDay =
                            new Date(
                                year,
                                monthIndex +
                                1,
                                0
                            ).getDate();

                        $("reportDateTo")
                            .value =
                            `${year}-${month}-${String(
                                lastDay
                            ).padStart(
                                2,
                                "0"
                            )}`;
                    }

                    if (
                        type ===
                        "date-range"
                    ) {
                        /*
                         * User chooses both dates.
                         */
                    }
                }
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
