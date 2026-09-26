/* =========================================================
   SmartSchool360
   Attendance History & Reports
   ========================================================= */

"use strict";

const STUDENTS_KEY = "smartschool_students";
const ATTENDANCE_KEY = "smartschool_attendance";

let allStudents = [];
let allAttendanceRecords = [];
let filteredRecords = [];


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeAttendanceHistory();

});


/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeAttendanceHistory() {

    loadStudents();

    loadAttendanceRecords();

    populateClassFilter();

    populateSectionFilter();

    setupEventListeners();

    applyFilters();

}


/* =========================================================
   LOAD STUDENTS
   ========================================================= */

function loadStudents() {

    try {

        const storedStudents =
            localStorage.getItem(STUDENTS_KEY);

        allStudents = storedStudents
            ? JSON.parse(storedStudents)
            : [];

        if (!Array.isArray(allStudents)) {
            allStudents = [];
        }

    } catch (error) {

        console.error(
            "Unable to load students:",
            error
        );

        allStudents = [];

        showToast(
            "Unable to load student data.",
            "error"
        );
    }

}


/* =========================================================
   LOAD ATTENDANCE
   ========================================================= */

function loadAttendanceRecords() {

    try {

        const storedAttendance =
            localStorage.getItem(ATTENDANCE_KEY);

        if (!storedAttendance) {

            allAttendanceRecords = [];

            return;
        }

        const parsedAttendance =
            JSON.parse(storedAttendance);


        if (
            parsedAttendance &&
            typeof parsedAttendance === "object" &&
            !Array.isArray(parsedAttendance)
        ) {

            allAttendanceRecords =
                Object.entries(parsedAttendance)
                    .map(
                        ([key, record]) => {

                            if (
                                !record ||
                                typeof record !== "object"
                            ) {
                                return null;
                            }

                            return normalizeAttendanceRecord(
                                record,
                                key
                            );

                        }
                    )
                    .filter(Boolean);

        } else if (
            Array.isArray(parsedAttendance)
        ) {

            allAttendanceRecords =
                parsedAttendance
                    .map(
                        (record, index) =>
                            normalizeAttendanceRecord(
                                record,
                                String(index)
                            )
                    )
                    .filter(Boolean);

        } else {

            allAttendanceRecords = [];

        }

    } catch (error) {

        console.error(
            "Unable to load attendance:",
            error
        );

        allAttendanceRecords = [];

        showToast(
            "Unable to load attendance records.",
            "error"
        );
    }

}


/* =========================================================
   NORMALIZE RECORD
   ========================================================= */

function normalizeAttendanceRecord(
    record,
    key = ""
) {

    const studentId =
        record.studentId ||
        extractStudentIdFromKey(key);

    const date =
        record.date ||
        extractDateFromKey(key);

    if (!studentId || !date) {
        return null;
    }


    const student =
        findStudent(studentId);


    return {

        key,

        studentId,

        date,

        className:
            record.className ||
            student?.className ||
            "",

        section:
            record.section ||
            student?.section ||
            "",

        status:
            normalizeStatus(record.status),

        updatedAt:
            record.updatedAt ||
            record.savedAt ||
            "",

        savedAt:
            record.savedAt ||
            record.updatedAt ||
            ""

    };

}


/* =========================================================
   EXTRACT DATA FROM OLD KEY
   ========================================================= */

function extractStudentIdFromKey(key) {

    if (!key) {
        return "";
    }

    const parts =
        String(key).split("__");

    if (parts.length < 2) {
        return "";
    }

    return parts.slice(1).join("__");
}


function extractDateFromKey(key) {

    if (!key) {
        return "";
    }

    const parts =
        String(key).split("__");

    return parts[0] || "";
}


/* =========================================================
   NORMALIZE STATUS
   ========================================================= */

function normalizeStatus(status) {

    if (!status) {
        return "";
    }

    const value =
        String(status).trim().toLowerCase();

    if (value === "present") {
        return "Present";
    }

    if (value === "absent") {
        return "Absent";
    }

    if (value === "late") {
        return "Late";
    }

    return "";
}


/* =========================================================
   FIND STUDENT
   ========================================================= */

function findStudent(studentId) {

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
        document.getElementById("historyClass");

    if (!select) {
        return;
    }


    const currentValue =
        select.value;


    const classes =
        [
            ...new Set(
                allStudents
                    .map(
                        student =>
                            String(
                                student.className || ""
                            ).trim()
                    )
                    .filter(Boolean)
            )
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
        '<option value="">All Classes</option>';


    classes.forEach(className => {

        const option =
            document.createElement("option");

        option.value = className;

        option.textContent =
            `Class ${className}`;

        select.appendChild(option);

    });


    if (
        classes.includes(currentValue)
    ) {

        select.value =
            currentValue;

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
        getValue("historyClass");


    let sections =
        allStudents
            .filter(student => {

                if (!selectedClass) {
                    return true;
                }

                return String(
                    student.className || ""
                ) === selectedClass;

            })
            .map(
                student =>
                    String(
                        student.section || ""
                    ).trim()
            )
            .filter(Boolean);


    sections =
        [
            ...new Set(sections)
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


    const currentValue =
        select.value;


    select.innerHTML =
        '<option value="">All Sections</option>';


    sections.forEach(section => {

        const option =
            document.createElement("option");

        option.value = section;

        option.textContent =
            `Section ${section}`;

        select.appendChild(option);

    });


    if (
        sections.includes(currentValue)
    ) {

        select.value =
            currentValue;

    }

}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function setupEventListeners() {

    const applyButton =
        document.getElementById(
            "applyHistoryFilterBtn"
        );

    const clearButton =
        document.getElementById(
            "clearHistoryFilterBtn"
        );

    const refreshButton =
        document.getElementById(
            "refreshHistoryBtn"
        );

    const classSelect =
        document.getElementById(
            "historyClass"
        );


    if (applyButton) {

        applyButton.addEventListener(
            "click",
            applyFilters
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


    const searchInput =
        document.getElementById(
            "historyStudentSearch"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            debounce(
                applyFilters,
                180
            )
        );

    }


    const sectionSelect =
        document.getElementById(
            "historySection"
        );

    const statusSelect =
        document.getElementById(
            "historyStatus"
        );

    const dateFrom =
        document.getElementById(
            "historyDateFrom"
        );

    const dateTo =
        document.getElementById(
            "historyDateTo"
        );


    [
        sectionSelect,
        statusSelect,
        dateFrom,
        dateTo
    ].forEach(element => {

        if (element) {

            element.addEventListener(
                "change",
                applyFilters
            );

        }

    });

}


/* =========================================================
   APPLY FILTERS
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


                /* Student Search */
                if (search) {

                    const studentName =
                        String(
                            student?.name ||
                            ""
                        ).toLowerCase();

                    const studentId =
                        String(
                            record.studentId ||
                            ""
                        ).toLowerCase();

                    if (
                        !studentName.includes(
                            search
                        ) &&
                        !studentId.includes(
                            search
                        )
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

            if (a.date !== b.date) {

                return String(b.date)
                    .localeCompare(
                        String(a.date)
                    );

            }

            return String(a.studentId)
                .localeCompare(
                    String(b.studentId)
                );

        }
    );


    renderHistoryTable();

    renderSummary();

    renderStudentOverview();

}


/* =========================================================
   RENDER HISTORY TABLE
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
                document.createElement("tr");


            const student =
                findStudent(
                    record.studentId
                );


            const studentName =
                student?.name ||
                "Unknown Student";


            const studentPhoto =
                student?.photo ||
                "";


            const initials =
                getInitials(
                    studentName
                );


            const studentCell =
                document.createElement("td");


            studentCell.innerHTML = `
                <div class="history-student-cell">

                    ${
                        studentPhoto
                        ? `
                            <img
                                src="${escapeAttribute(studentPhoto)}"
                                alt="${escapeAttribute(studentName)}"
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
                            ${escapeHtml(studentName)}
                        </div>

                        ${
                            student?.studentPhone
                            ? `
                                <div class="history-student-phone">
                                    ${escapeHtml(
                                        student.studentPhone
                                    )}
                                </div>
                              `
                            : ""
                        }

                    </div>

                </div>
            `;


            const dateCell =
                createCell(
                    formatDate(record.date)
                );


            const idCell =
                createCell(
                    record.studentId
                );


            const classCell =
                createCell(
                    record.className
                        ? `Class ${record.className}`
                        : "—"
                );


            const sectionCell =
                createCell(
                    record.section
                        ? `Section ${record.section}`
                        : "—"
                );


            const statusCell =
                document.createElement("td");


            statusCell.innerHTML =
                createStatusBadge(
                    record.status
                );


            const updatedCell =
                createCell(
                    formatDateTime(
                        record.updatedAt ||
                        record.savedAt
                    )
                );


            row.appendChild(dateCell);

            row.appendChild(studentCell);

            row.appendChild(idCell);

            row.appendChild(classCell);

            row.appendChild(sectionCell);

            row.appendChild(statusCell);

            row.appendChild(updatedCell);


            body.appendChild(row);

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
   SUMMARY
   ========================================================= */

function renderSummary() {

    const total =
        filteredRecords.length;


    const present =
        filteredRecords.filter(
            record =>
                record.status === "Present"
        ).length;


    const absent =
        filteredRecords.filter(
            record =>
                record.status === "Absent"
        ).length;


    const late =
        filteredRecords.filter(
            record =>
                record.status === "Late"
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


    const studentMap =
        new Map();


    filteredRecords.forEach(
        record => {

            if (
                !studentMap.has(
                    record.studentId
                )
            ) {

                studentMap.set(
                    record.studentId,
                    {
                        studentId:
                            record.studentId,

                        className:
                            record.className,

                        section:
                            record.section,

                        total: 0,

                        present: 0,

                        absent: 0,

                        late: 0
                    }
                );

            }


            const item =
                studentMap.get(
                    record.studentId
                );


            item.total++;


            if (
                record.status === "Present"
            ) {

                item.present++;

            } else if (
                record.status === "Absent"
            ) {

                item.absent++;

            } else if (
                record.status === "Late"
            ) {

                item.late++;

            }

        }
    );


    const overview =
        Array.from(
            studentMap.values()
        );


    overview.sort(
        (a, b) =>
            a.studentId.localeCompare(
                b.studentId
            )
    );


    overview.forEach(
        item => {

            const student =
                findStudent(
                    item.studentId
                );


            const row =
                document.createElement("tr");


            const nameCell =
                document.createElement("td");


            nameCell.innerHTML = `
                <div class="history-student-cell">

                    ${
                        student?.photo
                        ? `
                            <img
                                src="${escapeAttribute(student.photo)}"
                                alt="${escapeAttribute(
                                    student?.name ||
                                    "Student"
                                )}"
                                class="history-student-photo">
                          `
                        : `
                            <div class="history-student-avatar">
                                ${escapeHtml(
                                    getInitials(
                                        student?.name ||
                                        "Student"
                                    )
                                )}
                            </div>
                          `
                    }

                    <div class="history-student-info">

                        <div class="history-student-name">
                            ${escapeHtml(
                                student?.name ||
                                "Unknown Student"
                            )}
                        </div>

                        <div class="history-student-phone">
                            ${escapeHtml(
                                item.studentId
                            )}
                        </div>

                    </div>

                </div>
            `;


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
                calculateAttendancePercentage(
                    item.present,
                    item.total
                );


            const percentageCell =
                document.createElement("td");


            percentageCell.innerHTML =
                createPercentageBadge(
                    percentage
                );


            row.appendChild(nameCell);

            row.appendChild(classCell);

            row.appendChild(totalCell);

            row.appendChild(presentCell);

            row.appendChild(absentCell);

            row.appendChild(lateCell);

            row.appendChild(
                percentageCell
            );


            body.appendChild(row);

        }
    );

}


/* =========================================================
   ATTENDANCE PERCENTAGE
   ========================================================= */

function calculateAttendancePercentage(
    present,
    total
) {

    if (!total) {
        return 0;
    }

    return Math.round(
        (present / total) * 100
    );

}


/* =========================================================
   STATUS BADGE
   ========================================================= */

function createStatusBadge(status) {

    const normalized =
        normalizeStatus(status);


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
   PERCENTAGE BADGE
   ========================================================= */

function createPercentageBadge(
    percentage
) {

    let className =
        "percentage-low";


    if (percentage >= 75) {

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
   CLEAR FILTERS
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
   HELPERS
   ========================================================= */

function getValue(id) {

    const element =
        document.getElementById(id);

    return element
        ? String(element.value || "").trim()
        : "";

}


function setValue(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.value = value;
    }

}


function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }

}


function createCell(value) {

    const cell =
        document.createElement("td");

    cell.textContent =
        value ?? "—";

    return cell;

}


/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatDate(dateValue) {

    if (!dateValue) {
        return "—";
    }


    const date =
        new Date(
            `${dateValue}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateValue;

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
   DATE + TIME FORMAT
   ========================================================= */

function formatDateTime(value) {

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

function getInitials(name) {

    const words =
        String(name || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (!words.length) {
        return "S";
    }


    if (words.length === 1) {

        return words[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();

}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
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


function escapeAttribute(value) {

    return escapeHtml(value);

}


/* =========================================================
   DEBOUNCE
   ========================================================= */

function debounce(
    callback,
    delay
) {

    let timeout;


    return function (...args) {

        clearTimeout(timeout);


        timeout =
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
        toast.classList.add(type);
    }


    requestAnimationFrame(() => {

        toast.classList.add(
            "show"
        );

    });


    clearTimeout(
        showToast.timeout
    );


    showToast.timeout =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 2600);

}


/* =========================================================
   GLOBAL DEBUG ACCESS
   ========================================================= */

window.SmartSchoolAttendanceHistory = {

    refresh: refreshHistory,

    applyFilters,

    clearFilters,

    getRecords: () =>
        [...allAttendanceRecords],

    getFilteredRecords: () =>
        [...filteredRecords]

};
