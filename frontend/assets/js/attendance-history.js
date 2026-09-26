"use strict";

/* =========================================================
   SmartSchool360
   Attendance History & Reports
   FIXED VERSION
   ========================================================= */

const STUDENTS_KEY = "smartschool_students";
const ATTENDANCE_KEY = "smartschool_attendance";

let allStudents = [];
let allAttendanceRecords = [];
let filteredRecords = [];


/* =========================================================
   START
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initializeAttendanceHistory();
});


function initializeAttendanceHistory() {

    loadStudents();
    loadAttendanceRecords();

    populateClassFilter();
    populateSectionFilter();

    setupEventListeners();

    applyFilters();
}


/* =========================================================
   STUDENTS
   ========================================================= */

function loadStudents() {

    try {

        const data =
            localStorage.getItem(STUDENTS_KEY);

        allStudents =
            data ? JSON.parse(data) : [];

        if (!Array.isArray(allStudents)) {
            allStudents = [];
        }

    } catch (error) {

        console.error(
            "Student loading error:",
            error
        );

        allStudents = [];
    }
}


/* =========================================================
   ATTENDANCE LOADER
   Supports:
   1. Object format
   2. Array format
   3. String status format
   4. Old/new attendance formats
   ========================================================= */

function loadAttendanceRecords() {

    allAttendanceRecords = [];

    try {

        const raw =
            localStorage.getItem(
                ATTENDANCE_KEY
            );

        if (!raw) {
            return;
        }

        const parsed =
            JSON.parse(raw);


        /* -----------------------------------------
           ARRAY FORMAT
           ----------------------------------------- */

        if (Array.isArray(parsed)) {

            parsed.forEach(
                (item, index) => {

                    const record =
                        normalizeRecord(
                            item,
                            String(index)
                        );

                    if (record) {
                        allAttendanceRecords.push(
                            record
                        );
                    }

                }
            );

        }


        /* -----------------------------------------
           OBJECT FORMAT
           ----------------------------------------- */

        else if (
            parsed &&
            typeof parsed === "object"
        ) {

            Object.entries(parsed)
                .forEach(
                    ([key, value]) => {

                        const record =
                            normalizeRecord(
                                value,
                                key
                            );

                        if (record) {

                            allAttendanceRecords.push(
                                record
                            );

                        }

                    }
                );

        }


        /* -----------------------------------------
           REMOVE DUPLICATES
           ----------------------------------------- */

        allAttendanceRecords =
            removeDuplicateRecords(
                allAttendanceRecords
            );


        console.log(
            "SmartSchool360 Attendance Records:",
            allAttendanceRecords
        );

    } catch (error) {

        console.error(
            "Attendance loading error:",
            error
        );

        allAttendanceRecords = [];

    }

}


/* =========================================================
   NORMALIZE RECORD
   ========================================================= */

function normalizeRecord(
    value,
    key = ""
) {

    let record = {};

    /* -----------------------------------------
       STRING FORMAT
       Example:
       "Present"
       ----------------------------------------- */

    if (
        typeof value === "string"
    ) {

        record.status = value;

    }


    /* -----------------------------------------
       OBJECT FORMAT
       ----------------------------------------- */

    else if (
        value &&
        typeof value === "object"
    ) {

        record = {
            ...value
        };

    }


    else {

        return null;

    }


    /* -----------------------------------------
       EXTRACT STUDENT ID
       ----------------------------------------- */

    let studentId =
        record.studentId ||
        record.studentID ||
        record.student_id ||
        record.id ||
        "";


    if (!studentId) {

        studentId =
            extractStudentIdFromKey(
                key
            );

    }


    /* -----------------------------------------
       EXTRACT DATE
       ----------------------------------------- */

    let date =
        record.date ||
        record.attendanceDate ||
        record.attendance_date ||
        record.day ||
        "";


    if (!date) {

        date =
            extractDateFromKey(
                key
            );

    }


    /* -----------------------------------------
       EXTRACT STATUS
       ----------------------------------------- */

    let status =
        record.status ||
        record.attendanceStatus ||
        record.attendance_status ||
        record.value ||
        record.mark ||
        "";


    /* Nested status */
    if (
        status &&
        typeof status === "object"
    ) {

        status =
            status.status ||
            status.value ||
            "";

    }


    status =
        normalizeStatus(status);


    /* -----------------------------------------
       STUDENT LOOKUP
       ----------------------------------------- */

    const student =
        findStudent(studentId);


    /* -----------------------------------------
       FALLBACK CLASS
       ----------------------------------------- */

    const className =
        record.className ||
        record.class ||
        record.class_name ||
        student?.className ||
        "";


    /* -----------------------------------------
       FALLBACK SECTION
       ----------------------------------------- */

    const section =
        record.section ||
        record.sectionName ||
        record.section_name ||
        student?.section ||
        "";


    /* -----------------------------------------
       DATE REQUIRED
       ----------------------------------------- */

    if (!date) {

        return null;

    }


    /* -----------------------------------------
       STUDENT REQUIRED
       ----------------------------------------- */

    if (!studentId) {

        return null;

    }


    return {

        key,

        studentId:
            String(studentId),

        date:
            normalizeDate(date),

        className:
            String(className || ""),

        section:
            String(section || ""),

        status,

        updatedAt:
            record.updatedAt ||
            record.updated_at ||
            record.savedAt ||
            record.saved_at ||
            "",

        savedAt:
            record.savedAt ||
            record.saved_at ||
            record.updatedAt ||
            record.updated_at ||
            ""

    };

}


/* =========================================================
   DATE NORMALIZATION
   ========================================================= */

function normalizeDate(value) {

    if (!value) {
        return "";
    }


    const stringValue =
        String(value).trim();


    /* YYYY-MM-DD */
    if (
        /^\d{4}-\d{2}-\d{2}$/
            .test(stringValue)
    ) {

        return stringValue;

    }


    /* MM/DD/YYYY */
    const slashMatch =
        stringValue.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
        );


    if (slashMatch) {

        const month =
            String(
                slashMatch[1]
            ).padStart(2, "0");

        const day =
            String(
                slashMatch[2]
            ).padStart(2, "0");

        const year =
            slashMatch[3];

        return `${year}-${month}-${day}`;

    }


    /* Date object / ISO */
    const parsed =
        new Date(stringValue);


    if (
        !Number.isNaN(
            parsed.getTime()
        )
    ) {

        return [
            parsed.getFullYear(),
            String(
                parsed.getMonth() + 1
            ).padStart(2, "0"),
            String(
                parsed.getDate()
            ).padStart(2, "0")
        ].join("-");

    }


    return stringValue;

}


/* =========================================================
   STATUS NORMALIZATION
   ========================================================= */

function normalizeStatus(value) {

    if (!value) {
        return "";
    }


    const status =
        String(value)
            .trim()
            .toLowerCase();


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


/* =========================================================
   KEY PARSING
   ========================================================= */

function extractStudentIdFromKey(key) {

    if (!key) {
        return "";
    }


    const value =
        String(key);


    const parts =
        value.split("__");


    if (
        parts.length >= 2
    ) {

        return parts
            .slice(1)
            .join("__");

    }


    /* Try common separators */

    const underscoreParts =
        value.split("_");


    if (
        underscoreParts.length >= 2
    ) {

        const possible =
            underscoreParts[
                underscoreParts.length - 1
            ];

        if (
            possible.startsWith("SS")
        ) {

            return possible;

        }

    }


    return "";

}


function extractDateFromKey(key) {

    if (!key) {
        return "";
    }


    const value =
        String(key);


    const doubleParts =
        value.split("__");


    if (
        doubleParts.length >= 2
    ) {

        return normalizeDate(
            doubleParts[0]
        );

    }


    const match =
        value.match(
            /\d{4}-\d{2}-\d{2}/
        );


    if (match) {

        return match[0];

    }


    return "";

}


/* =========================================================
   REMOVE DUPLICATES
   ========================================================= */

function removeDuplicateRecords(
    records
) {

    const map =
        new Map();


    records.forEach(record => {

        const uniqueKey =
            `${record.date}__${record.studentId}`;


        /* Prefer record containing status */

        if (
            !map.has(uniqueKey)
        ) {

            map.set(
                uniqueKey,
                record
            );

        } else {

            const existing =
                map.get(uniqueKey);


            if (
                !existing.status &&
                record.status
            ) {

                map.set(
                    uniqueKey,
                    record
                );

            }

        }

    });


    return Array.from(
        map.values()
    );

}


/* =========================================================
   FIND STUDENT
   ========================================================= */

function findStudent(
    studentId
) {

    return allStudents.find(
        student =>
            String(student.id) ===
            String(studentId)
    ) || null;

}


/* =========================================================
   CLASS FILTER
   ========================================================= */

function populateClassFilter() {

    const select =
        document.getElementById(
            "historyClass"
        );


    if (!select) {
        return;
    }


    const current =
        select.value;


    let classes =
        allStudents
            .map(
                student =>
                    String(
                        student.className || ""
                    ).trim()
            )
            .filter(Boolean);


    /* Also include attendance classes */

    classes =
        classes.concat(
            allAttendanceRecords
                .map(
                    record =>
                        String(
                            record.className || ""
                        ).trim()
                )
                .filter(Boolean)
        );


    classes =
        [
            ...new Set(classes)
        ];


    classes.sort(
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
        `;


    classes.forEach(
        className => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                className;

            option.textContent =
                `Class ${className}`;

            select.appendChild(
                option
            );

        }
    );


    if (
        classes.includes(current)
    ) {

        select.value =
            current;

    }

}


/* =========================================================
   SECTION FILTER
   ========================================================= */

function populateSectionFilter() {

    const select =
        document.getElementById(
            "historySection"
        );


    if (!select) {
        return;
    }


    const selectedClass =
        getValue(
            "historyClass"
        );


    let sections =
        [];


    allStudents.forEach(
        student => {

            if (
                selectedClass &&
                String(
                    student.className
                ) !== selectedClass
            ) {

                return;

            }


            if (
                student.section
            ) {

                sections.push(
                    String(
                        student.section
                    ).trim()
                );

            }

        }
    );


    allAttendanceRecords.forEach(
        record => {

            if (
                selectedClass &&
                String(
                    record.className
                ) !== selectedClass
            ) {

                return;

            }


            if (
                record.section
            ) {

                sections.push(
                    String(
                        record.section
                    ).trim()
                );

            }

        }
    );


    sections =
        [
            ...new Set(
                sections.filter(Boolean)
            )
        ];


    sections.sort(
        (a, b) =>
            a.localeCompare(
                b,
                undefined,
                {
                    numeric: true
                }
            )
    );


    const current =
        select.value;


    select.innerHTML =
        `
        <option value="">
            All Sections
        </option>
        `;


    sections.forEach(
        section => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                section;

            option.textContent =
                `Section ${section}`;

            select.appendChild(
                option
            );

        }
    );


    if (
        sections.includes(current)
    ) {

        select.value =
            current;

    }

}


/* =========================================================
   EVENTS
   ========================================================= */

function setupEventListeners() {

    const apply =
        document.getElementById(
            "applyHistoryFilterBtn"
        );


    const clear =
        document.getElementById(
            "clearHistoryFilterBtn"
        );


    const refresh =
        document.getElementById(
            "refreshHistoryBtn"
        );


    const classSelect =
        document.getElementById(
            "historyClass"
        );


    const sectionSelect =
        document.getElementById(
            "historySection"
        );


    const statusSelect =
        document.getElementById(
            "historyStatus"
        );


    const search =
        document.getElementById(
            "historyStudentSearch"
        );


    const dateFrom =
        document.getElementById(
            "historyDateFrom"
        );


    const dateTo =
        document.getElementById(
            "historyDateTo"
        );


    if (apply) {

        apply.addEventListener(
            "click",
            applyFilters
        );

    }


    if (clear) {

        clear.addEventListener(
            "click",
            clearFilters
        );

    }


    if (refresh) {

        refresh.addEventListener(
            "click",
            refreshHistory
        );

    }


    if (classSelect) {

        classSelect.addEventListener(
            "change",
            () => {

                populateSectionFilter();

                applyFilters();

            }
        );

    }


    if (sectionSelect) {

        sectionSelect.addEventListener(
            "change",
            applyFilters
        );

    }


    if (statusSelect) {

        statusSelect.addEventListener(
            "change",
            applyFilters
        );

    }


    if (dateFrom) {

        dateFrom.addEventListener(
            "change",
            applyFilters
        );

    }


    if (dateTo) {

        dateTo.addEventListener(
            "change",
            applyFilters
        );

    }


    if (search) {

        search.addEventListener(
            "input",
            debounce(
                applyFilters,
                150
            )
        );

    }

}


/* =========================================================
   FILTER
   ========================================================= */

function applyFilters() {

    const search =
        getValue(
            "historyStudentSearch"
        ).toLowerCase();


    const className =
        getValue(
            "historyClass"
        );


    const section =
        getValue(
            "historySection"
        );


    const status =
        getValue(
            "historyStatus"
        );


    const dateFrom =
        getValue(
            "historyDateFrom"
        );


    const dateTo =
        getValue(
            "historyDateTo"
        );


    filteredRecords =
        allAttendanceRecords.filter(
            record => {

                const student =
                    findStudent(
                        record.studentId
                    );


                /* Search */

                if (search) {

                    const name =
                        String(
                            student?.name ||
                            ""
                        ).toLowerCase();


                    const id =
                        String(
                            record.studentId ||
                            ""
                        ).toLowerCase();


                    if (
                        !name.includes(search) &&
                        !id.includes(search)
                    ) {

                        return false;

                    }

                }


                /* Class */

                if (
                    className &&
                    String(
                        record.className
                    ) !== className
                ) {

                    return false;

                }


                /* Section */

                if (
                    section &&
                    String(
                        record.section
                    ) !== section
                ) {

                    return false;

                }


                /* Status */

                if (
                    status &&
                    record.status !== status
                ) {

                    return false;

                }


                /* Date From */

                if (
                    dateFrom &&
                    record.date < dateFrom
                ) {

                    return false;

                }


                /* Date To */

                if (
                    dateTo &&
                    record.date > dateTo
                ) {

                    return false;

                }


                return true;

            }
        );


    filteredRecords.sort(
        (a, b) => {

            const dateCompare =
                String(b.date)
                    .localeCompare(
                        String(a.date)
                    );


            if (
                dateCompare !== 0
            ) {

                return dateCompare;

            }


            return String(
                a.studentId
            ).localeCompare(
                String(
                    b.studentId
                )
            );

        }
    );


    renderHistoryTable();

    renderSummary();

    renderStudentOverview();

}


/* =========================================================
   HISTORY TABLE
   ========================================================= */

function renderHistoryTable() {

    const body =
        document.getElementById(
            "attendanceHistoryBody"
        );


    const empty =
        document.getElementById(
            "attendanceHistoryEmpty"
        );


    if (!body) {
        return;
    }


    body.innerHTML = "";


    if (
        filteredRecords.length === 0
    ) {

        if (empty) {
            empty.hidden = false;
        }

        updateRecordCount(0);

        updateResultText(0);

        return;

    }


    if (empty) {
        empty.hidden = true;
    }


    filteredRecords.forEach(
        record => {

            const row =
                document.createElement(
                    "tr"
                );


            const student =
                findStudent(
                    record.studentId
                );


            const name =
                student?.name ||
                "Unknown Student";


            /* Date */

            const dateCell =
                createCell(
                    formatDate(
                        record.date
                    )
                );


            /* Student */

            const studentCell =
                document.createElement(
                    "td"
                );


            studentCell.innerHTML =
                createStudentHTML(
                    student,
                    name
                );


            /* ID */

            const idCell =
                createCell(
                    record.studentId
                );


            /* Class */

            const classCell =
                createCell(
                    record.className
                        ? `Class ${record.className}`
                        : "—"
                );


            /* Section */

            const sectionCell =
                createCell(
                    record.section
                        ? `Section ${record.section}`
                        : "—"
                );


            /* Status */

            const statusCell =
                document.createElement(
                    "td"
                );


            statusCell.innerHTML =
                createStatusBadge(
                    record.status
                );


            /* Updated */

            const updatedCell =
                createCell(
                    formatDateTime(
                        record.updatedAt ||
                        record.savedAt
                    )
                );


            row.appendChild(
                dateCell
            );

            row.appendChild(
                studentCell
            );

            row.appendChild(
                idCell
            );

            row.appendChild(
                classCell
            );

            row.appendChild(
                sectionCell
            );

            row.appendChild(
                statusCell
            );

            row.appendChild(
                updatedCell
            );


            body.appendChild(
                row
            );

        }
    );


    updateRecordCount(
        filteredRecords.length
    );


    updateResultText(
        filteredRecords.length
    );

}


/* =========================================================
   SUMMARY — FIXED
   ========================================================= */

function renderSummary() {

    const total =
        filteredRecords.length;


    const present =
        filteredRecords.filter(
            record =>
                normalizeStatus(
                    record.status
                ) === "Present"
        ).length;


    const absent =
        filteredRecords.filter(
            record =>
                normalizeStatus(
                    record.status
                ) === "Absent"
        ).length;


    const late =
        filteredRecords.filter(
            record =>
                normalizeStatus(
                    record.status
                ) === "Late"
        ).length;


    setText(
        "historyTotalRecords",
        total
    );


    setText(
        "historyPresentRecords",
        present
    );


    setText(
        "historyAbsentRecords",
        absent
    );


    setText(
        "historyLateRecords",
        late
    );

}


/* =========================================================
   STUDENT OVERVIEW
   ========================================================= */

function renderStudentOverview() {

    const body =
        document.getElementById(
            "studentOverviewBody"
        );


    const empty =
        document.getElementById(
            "studentOverviewEmpty"
        );


    if (!body) {
        return;
    }


    body.innerHTML = "";


    if (
        filteredRecords.length === 0
    ) {

        if (empty) {
            empty.hidden = false;
        }

        return;

    }


    if (empty) {
        empty.hidden = true;
    }


    const students =
        new Map();


    filteredRecords.forEach(
        record => {

            if (
                !students.has(
                    record.studentId
                )
            ) {

                students.set(
                    record.studentId,
                    {
                        studentId:
                            record.studentId,

                        className:
                            record.className,

                        total: 0,

                        present: 0,

                        absent: 0,

                        late: 0
                    }
                );

            }


            const item =
                students.get(
                    record.studentId
                );


            item.total++;


            const status =
                normalizeStatus(
                    record.status
                );


            if (
                status === "Present"
            ) {

                item.present++;

            } else if (
                status === "Absent"
            ) {

                item.absent++;

            } else if (
                status === "Late"
            ) {

                item.late++;

            }

        }
    );


    Array.from(
        students.values()
    ).forEach(
        item => {

            const student =
                findStudent(
                    item.studentId
                );


            const row =
                document.createElement(
                    "tr"
                );


            const nameCell =
                document.createElement(
                    "td"
                );


            nameCell.innerHTML =
                createStudentHTML(
                    student,
                    student?.name ||
                    "Unknown Student",
                    item.studentId
                );


            const classCell =
                createCell(
                    item.className
                        ? `Class ${item.className}`
                        : "—"
                );


            const totalCell =
                createCell(
                    item.total
                );


            const presentCell =
                createCell(
                    item.present
                );


            const absentCell =
                createCell(
                    item.absent
                );


            const lateCell =
                createCell(
                    item.late
                );


            const percentage =
                item.total > 0
                    ? Math.round(
                        (
                            item.present /
                            item.total
                        ) * 100
                    )
                    : 0;


            const percentageCell =
                document.createElement(
                    "td"
                );


            percentageCell.innerHTML =
                createPercentageBadge(
                    percentage
                );


            row.appendChild(
                nameCell
            );

            row.appendChild(
                classCell
            );

            row.appendChild(
                totalCell
            );

            row.appendChild(
                presentCell
            );

            row.appendChild(
                absentCell
            );

            row.appendChild(
                lateCell
            );

            row.appendChild(
                percentageCell
            );


            body.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   STUDENT HTML
   ========================================================= */

function createStudentHTML(
    student,
    name,
    secondaryText = ""
) {

    const photo =
        student?.photo ||
        "";


    const initials =
        getInitials(
            name
        );


    return `
        <div class="history-student-cell">

            ${
                photo
                ? `
                    <img
                        src="${escapeAttribute(photo)}"
                        alt="${escapeAttribute(name)}"
                        class="history-student-photo">
                  `
                : `
                    <div class="history-student-avatar">
                        ${escapeHtml(initials)}
                    </div>
                  `
            }

            <div class="history-student-info">

                <div class="history-student-name">
                    ${escapeHtml(name)}
                </div>

                <div class="history-student-phone">
                    ${escapeHtml(
                        secondaryText ||
                        student?.studentPhone ||
                        ""
                    )}
                </div>

            </div>

        </div>
    `;

}


/* =========================================================
   STATUS BADGE
   ========================================================= */

function createStatusBadge(
    status
) {

    const normalized =
        normalizeStatus(
            status
        );


    if (
        normalized === "Present"
    ) {

        return `
            <span class="status-badge status-present">
                ✓ Present
            </span>
        `;

    }


    if (
        normalized === "Absent"
    ) {

        return `
            <span class="status-badge status-absent">
                ✕ Absent
            </span>
        `;

    }


    if (
        normalized === "Late"
    ) {

        return `
            <span class="status-badge status-late">
                ⏰ Late
            </span>
        `;

    }


    return `
        <span class="status-badge status-pending">
            • Pending
        </span>
    `;

}


/* =========================================================
   PERCENTAGE
   ========================================================= */

function createPercentageBadge(
    percentage
) {

    let className =
        "percentage-low";


    if (
        percentage >= 75
    ) {

        className =
            "percentage-high";

    } else if (
        percentage >= 50
    ) {

        className =
            "percentage-medium";

    }


    return `
        <span class="percentage-badge ${className}">
            ${percentage}%
        </span>
    `;

}


/* =========================================================
   CLEAR
   ========================================================= */

function clearFilters() {

    setValue(
        "historyStudentSearch",
        ""
    );


    setValue(
        "historyClass",
        ""
    );


    populateSectionFilter();


    setValue(
        "historySection",
        ""
    );


    setValue(
        "historyStatus",
        ""
    );


    setValue(
        "historyDateFrom",
        ""
    );


    setValue(
        "historyDateTo",
        ""
    );


    applyFilters();


    showToast(
        "Filters cleared.",
        "success"
    );

}


/* =========================================================
   REFRESH
   ========================================================= */

function refreshHistory() {

    loadStudents();

    loadAttendanceRecords();

    populateClassFilter();

    populateSectionFilter();

    applyFilters();


    showToast(
        "Attendance history refreshed.",
        "success"
    );

}


/* =========================================================
   UI HELPERS
   ========================================================= */

function updateRecordCount(
    count
) {

    setText(
        "historyRecordCount",
        `${count} Record${count === 1 ? "" : "s"}`
    );

}


function updateResultText(
    count
) {

    setText(
        "historyResultText",
        count === 0
            ? "No attendance records found"
            : `Showing ${count} attendance record${count === 1 ? "" : "s"}`
    );

}


function getValue(id) {

    const element =
        document.getElementById(id);


    return element
        ? String(
            element.value || ""
        ).trim()
        : "";

}


function setValue(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {
        element.value =
            value;
    }

}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {
        element.textContent =
            value;
    }

}


function createCell(
    value
) {

    const cell =
        document.createElement(
            "td"
        );


    cell.textContent =
        value ?? "—";


    return cell;

}


/* =========================================================
   DATE
   ========================================================= */

function formatDate(
    value
) {

    if (!value) {
        return "—";
    }


    const normalized =
        normalizeDate(
            value
        );


    const date =
        new Date(
            `${normalized}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;

    }


    return new Intl.DateTimeFormat(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    ).format(date);

}


/* =========================================================
   DATE TIME
   ========================================================= */

function formatDateTime(
    value
) {

    if (!value) {
        return "—";
    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;

    }


    return new Intl.DateTimeFormat(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(date);

}


/* =========================================================
   INITIALS
   ========================================================= */

function getInitials(
    name
) {

    const words =
        String(
            name || ""
        )
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (!words.length) {
        return "S";
    }


    if (
        words.length === 1
    ) {

        return words[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        words[0][0] +
        words[
            words.length - 1
        ][0]
    ).toUpperCase();

}


/* =========================================================
   ESCAPE
   ========================================================= */

function escapeHtml(
    value
) {

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


function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );

}


/* =========================================================
   DEBOUNCE
   ========================================================= */

function debounce(
    callback,
    delay
) {

    let timer;


    return function (...args) {

        clearTimeout(
            timer
        );


        timer =
            setTimeout(
                () => {

                    callback.apply(
                        this,
                        args
                    );

                },
                delay
            );

    };

}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(
    message,
    type = ""
) {

    const toast =
        document.getElementById(
            "historyToast"
        );


    if (!toast) {
        return;
    }


    toast.textContent =
        message;


    toast.className =
        "toast";


    if (type) {

        toast.classList.add(
            type
        );

    }


    requestAnimationFrame(
        () => {

            toast.classList.add(
                "show"
            );

        }
    );


    clearTimeout(
        showToast.timer
    );


    showToast.timer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2600
        );

}


/* =========================================================
   DEBUG
   ========================================================= */

window.SmartSchoolAttendanceHistory = {

    refresh:
        refreshHistory,

    applyFilters:
        applyFilters,

    clearFilters:
        clearFilters,

    getAllRecords:
        () =>
            [
                ...allAttendanceRecords
            ],

    getFilteredRecords:
        () =>
            [
                ...filteredRecords
            ]

};
