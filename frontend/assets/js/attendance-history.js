"use strict";

/* =========================================================
   SmartSchool360
   Attendance History
   FINAL MOBILE FIX
   ========================================================= */

const STUDENTS_KEY = "smartschool_students";
const ATTENDANCE_KEY = "smartschool_attendance";

let allStudents = [];
let allAttendanceRecords = [];
let filteredRecords = [];


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    loadStudents();

    loadAttendanceRecords();

    populateClassFilter();

    populateSectionFilter();

    setupEvents();

    applyFilters();

});


/* =========================================================
   LOAD STUDENTS
   ========================================================= */

function loadStudents() {

    try {

        const raw =
            localStorage.getItem(
                STUDENTS_KEY
            );

        if (!raw) {

            allStudents = [];

            return;
        }

        const parsed =
            JSON.parse(raw);

        allStudents =
            Array.isArray(parsed)
                ? parsed
                : [];

    } catch (error) {

        console.error(
            "Students loading error:",
            error
        );

        allStudents = [];

    }

}


/* =========================================================
   LOAD ATTENDANCE
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


        if (
            Array.isArray(parsed)
        ) {

            parsed.forEach(
                function (item, index) {

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

        } else if (
            parsed &&
            typeof parsed === "object"
        ) {

            Object.entries(parsed)
                .forEach(
                    function ([key, value]) {

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


        allAttendanceRecords =
            removeDuplicates(
                allAttendanceRecords
            );


        console.log(
            "Attendance history loaded:",
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
    key
) {

    let data = {};


    if (
        typeof value === "string"
    ) {

        data.status = value;

    } else if (
        value &&
        typeof value === "object"
    ) {

        data = {
            ...value
        };

    } else {

        return null;

    }


    let studentId =
        data.studentId ||
        data.studentID ||
        data.student_id ||
        "";


    if (!studentId) {

        studentId =
            extractStudentId(
                key
            );

    }


    let date =
        data.date ||
        data.attendanceDate ||
        data.attendance_date ||
        "";


    if (!date) {

        date =
            extractDate(
                key
            );

    }


    let status =
        data.status ||
        data.attendanceStatus ||
        data.attendance_status ||
        data.value ||
        data.mark ||
        "";


    status =
        normalizeStatus(
            status
        );


    if (!studentId || !date) {

        return null;

    }


    const student =
        findStudent(
            studentId
        );


    let className =
        data.className ||
        data.class ||
        data.class_name ||
        student?.className ||
        "";


    let section =
        data.section ||
        data.sectionName ||
        data.section_name ||
        student?.section ||
        "";


    return {

        key: key,

        studentId:
            String(studentId),

        date:
            normalizeDate(date),

        className:
            cleanClass(
                className
            ),

        section:
            cleanSection(
                section
            ),

        status: status,

        updatedAt:
            data.updatedAt ||
            data.updated_at ||
            data.savedAt ||
            data.saved_at ||
            "",

        savedAt:
            data.savedAt ||
            data.saved_at ||
            data.updatedAt ||
            data.updated_at ||
            ""

    };

}


/* =========================================================
   CLEAN CLASS
   ========================================================= */

function cleanClass(value) {

    let result =
        String(
            value || ""
        ).trim();


    result =
        result.replace(
            /^class\s+/i,
            ""
        );


    return result.trim();

}


/* =========================================================
   CLEAN SECTION
   ========================================================= */

function cleanSection(value) {

    let result =
        String(
            value || ""
        ).trim();


    result =
        result.replace(
            /^section\s+/i,
            ""
        );


    return result.trim();

}


/* =========================================================
   STATUS
   ========================================================= */

function normalizeStatus(value) {

    if (!value) {

        return "";

    }


    const status =
        String(
            value
        )
            .trim()
            .toLowerCase();


    if (
        status === "present" ||
        status === "p"
    ) {

        return "Present";

    }


    if (
        status === "absent" ||
        status === "a"
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
   DATE
   ========================================================= */

function normalizeDate(value) {

    if (!value) {

        return "";

    }


    const text =
        String(
            value
        ).trim();


    if (
        /^\d{4}-\d{2}-\d{2}$/
            .test(text)
    ) {

        return text;

    }


    const slash =
        text.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
        );


    if (slash) {

        const month =
            String(
                slash[1]
            ).padStart(
                2,
                "0"
            );

        const day =
            String(
                slash[2]
            ).padStart(
                2,
                "0"
            );

        const year =
            slash[3];


        return (
            year +
            "-" +
            month +
            "-" +
            day
        );

    }


    const date =
        new Date(
            text
        );


    if (
        !Number.isNaN(
            date.getTime()
        )
    ) {

        return (
            date.getFullYear() +
            "-" +
            String(
                date.getMonth() + 1
            ).padStart(
                2,
                "0"
            ) +
            "-" +
            String(
                date.getDate()
            ).padStart(
                2,
                "0"
            )
        );

    }


    return text;

}


/* =========================================================
   EXTRACT KEY DATA
   ========================================================= */

function extractStudentId(key) {

    if (!key) {

        return "";

    }


    const text =
        String(
            key
        );


    if (
        text.includes("__")
    ) {

        const parts =
            text.split("__");


        return parts
            .slice(1)
            .join("__");

    }


    const match =
        text.match(
            /(SS\d+)/
        );


    return match
        ? match[1]
        : "";

}


function extractDate(key) {

    if (!key) {

        return "";

    }


    const text =
        String(
            key
        );


    const dateMatch =
        text.match(
            /\d{4}-\d{2}-\d{2}/
        );


    if (dateMatch) {

        return dateMatch[0];

    }


    return "";

}


/* =========================================================
   REMOVE DUPLICATES
   ========================================================= */

function removeDuplicates(
    records
) {

    const map =
        new Map();


    records.forEach(
        function (record) {

            const key =
                record.date +
                "__" +
                record.studentId;


            if (
                !map.has(key)
            ) {

                map.set(
                    key,
                    record
                );

            } else {

                const old =
                    map.get(key);


                if (
                    !old.status &&
                    record.status
                ) {

                    map.set(
                        key,
                        record
                    );

                }

            }

        }
    );


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
        function (student) {

            return (
                String(
                    student.id
                ) ===
                String(
                    studentId
                )
            );

        }
    ) || null;

}


/* =========================================================
   SETUP EVENTS
   ========================================================= */

function setupEvents() {

    /*
       Event delegation is used here so
       mobile taps work reliably.
    */

    document.addEventListener(
        "click",
        function (event) {

            const applyButton =
                event.target.closest(
                    "#applyHistoryFilterBtn"
                );


            if (applyButton) {

                event.preventDefault();

                applyFilters();

                return;

            }


            const clearButton =
                event.target.closest(
                    "#clearHistoryFilterBtn"
                );


            if (clearButton) {

                event.preventDefault();

                clearFilters();

                return;

            }


            const refreshButton =
                event.target.closest(
                    "#refreshHistoryBtn"
                );


            if (refreshButton) {

                event.preventDefault();

                refreshHistory();

                return;

            }

        },
        false
    );


    /*
       Extra touch support for Android.
    */

    document.addEventListener(
        "touchend",
        function (event) {

            const button =
                event.target.closest(
                    "#applyHistoryFilterBtn"
                );


            if (button) {

                event.preventDefault();

                applyFilters();

            }

        },
        {
            passive: false
        }
    );


    const classSelect =
        document.getElementById(
            "historyClass"
        );


    if (classSelect) {

        classSelect.addEventListener(
            "change",
            function () {

                populateSectionFilter();

                applyFilters();

            }
        );

    }


    const sectionSelect =
        document.getElementById(
            "historySection"
        );


    if (sectionSelect) {

        sectionSelect.addEventListener(
            "change",
            applyFilters
        );

    }


    const statusSelect =
        document.getElementById(
            "historyStatus"
        );


    if (statusSelect) {

        statusSelect.addEventListener(
            "change",
            applyFilters
        );

    }


    const dateFrom =
        document.getElementById(
            "historyDateFrom"
        );


    if (dateFrom) {

        dateFrom.addEventListener(
            "change",
            applyFilters
        );

    }


    const dateTo =
        document.getElementById(
            "historyDateTo"
        );


    if (dateTo) {

        dateTo.addEventListener(
            "change",
            applyFilters
        );

    }


    const search =
        document.getElementById(
            "historyStudentSearch"
        );


    if (search) {

        search.addEventListener(
            "input",
            function () {

                applyFilters();

            }
        );

    }

}


/* =========================================================
   POPULATE CLASS
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
        cleanClass(
            select.value
        );


    let classes = [];


    allStudents.forEach(
        function (student) {

            const value =
                cleanClass(
                    student.className
                );


            if (value) {

                classes.push(
                    value
                );

            }

        }
    );


    allAttendanceRecords.forEach(
        function (record) {

            const value =
                cleanClass(
                    record.className
                );


            if (value) {

                classes.push(
                    value
                );

            }

        }
    );


    classes =
        [
            ...new Set(
                classes
            )
        ];


    classes.sort(
        function (a, b) {

            return a.localeCompare(
                b,
                undefined,
                {
                    numeric: true
                }
            );

        }
    );


    select.innerHTML =
        `
        <option value="">
            All Classes
        </option>
        `;


    classes.forEach(
        function (className) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                className;


            option.textContent =
                "Class " +
                className;


            select.appendChild(
                option
            );

        }
    );


    if (current) {

        select.value =
            current;

    }

}


/* =========================================================
   POPULATE SECTION
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
        cleanClass(
            getValue(
                "historyClass"
            )
        );


    let sections = [];


    allStudents.forEach(
        function (student) {

            const studentClass =
                cleanClass(
                    student.className
                );


            if (
                selectedClass &&
                studentClass !==
                    selectedClass
            ) {

                return;

            }


            const section =
                cleanSection(
                    student.section
                );


            if (section) {

                sections.push(
                    section
                );

            }

        }
    );


    allAttendanceRecords.forEach(
        function (record) {

            const recordClass =
                cleanClass(
                    record.className
                );


            if (
                selectedClass &&
                recordClass !==
                    selectedClass
            ) {

                return;

            }


            const section =
                cleanSection(
                    record.section
                );


            if (section) {

                sections.push(
                    section
                );

            }

        }
    );


    sections =
        [
            ...new Set(
                sections
            )
        ];


    sections.sort(
        function (a, b) {

            return a.localeCompare(
                b,
                undefined,
                {
                    numeric: true
                }
            );

        }
    );


    const current =
        cleanSection(
            select.value
        );


    select.innerHTML =
        `
        <option value="">
            All Sections
        </option>
        `;


    sections.forEach(
        function (section) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                section;


            option.textContent =
                "Section " +
                section;


            select.appendChild(
                option
            );

        }
    );


    if (current) {

        select.value =
            current;

    }

}


/* =========================================================
   APPLY FILTERS
   ========================================================= */

function applyFilters() {

    console.log(
        "SmartSchool360: Apply Filters clicked"
    );


    const search =
        getValue(
            "historyStudentSearch"
        )
            .toLowerCase();


    const selectedClass =
        cleanClass(
            getValue(
                "historyClass"
            )
        );


    const selectedSection =
        cleanSection(
            getValue(
                "historySection"
            )
        );


    const selectedStatus =
        normalizeStatus(
            getValue(
                "historyStatus"
            )
        );


    const fromDate =
        normalizeDate(
            getValue(
                "historyDateFrom"
            )
        );


    const toDate =
        normalizeDate(
            getValue(
                "historyDateTo"
            )
        );


    filteredRecords =
        allAttendanceRecords.filter(
            function (record) {

                const student =
                    findStudent(
                        record.studentId
                    );


                /* -------------------------
                   SEARCH
                   ------------------------- */

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
                        !name.includes(
                            search
                        ) &&
                        !id.includes(
                            search
                        )
                    ) {

                        return false;

                    }

                }


                /* -------------------------
                   CLASS
                   ------------------------- */

                if (
                    selectedClass
                ) {

                    const recordClass =
                        cleanClass(
                            record.className
                        );


                    if (
                        recordClass !==
                        selectedClass
                    ) {

                        return false;

                    }

                }


                /* -------------------------
                   SECTION
                   ------------------------- */

                if (
                    selectedSection
                ) {

                    const recordSection =
                        cleanSection(
                            record.section
                        );


                    if (
                        recordSection !==
                        selectedSection
                    ) {

                        return false;

                    }

                }


                /* -------------------------
                   STATUS
                   ------------------------- */

                if (
                    selectedStatus
                ) {

                    const recordStatus =
                        normalizeStatus(
                            record.status
                        );


                    if (
                        recordStatus !==
                        selectedStatus
                    ) {

                        return false;

                    }

                }


                /* -------------------------
                   FROM DATE
                   ------------------------- */

                if (
                    fromDate &&
                    record.date <
                        fromDate
                ) {

                    return false;

                }


                /* -------------------------
                   TO DATE
                   ------------------------- */

                if (
                    toDate &&
                    record.date >
                        toDate
                ) {

                    return false;

                }


                return true;

            }
        );


    filteredRecords.sort(
        function (a, b) {

            if (
                a.date !==
                b.date
            ) {

                return String(
                    b.date
                ).localeCompare(
                    String(
                        a.date
                    )
                );

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
   RENDER HISTORY
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

            empty.hidden =
                false;

        }


        updateCount(0);

        updateText(0);

        return;

    }


    if (empty) {

        empty.hidden =
            true;

    }


    filteredRecords.forEach(
        function (record) {

            const row =
                document.createElement(
                    "tr"
                );


            const student =
                findStudent(
                    record.studentId
                );


            const studentName =
                student?.name ||
                "Unknown Student";


            const dateCell =
                createCell(
                    formatDate(
                        record.date
                    )
                );


            const studentCell =
                document.createElement(
                    "td"
                );


            studentCell.innerHTML =
                createStudentHTML(
                    student,
                    studentName
                );


            const idCell =
                createCell(
                    record.studentId
                );


            const classCell =
                createCell(
                    record.className
                        ? "Class " +
                          record.className
                        : "—"
                );


            const sectionCell =
                createCell(
                    record.section
                        ? "Section " +
                          record.section
                        : "—"
                );


            const statusCell =
                document.createElement(
                    "td"
                );


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


    updateCount(
        filteredRecords.length
    );


    updateText(
        filteredRecords.length
    );

}


/* =========================================================
   SUMMARY
   ========================================================= */

function renderSummary() {

    const total =
        filteredRecords.length;


    let present = 0;

    let absent = 0;

    let late = 0;


    filteredRecords.forEach(
        function (record) {

            const status =
                normalizeStatus(
                    record.status
                );


            if (
                status === "Present"
            ) {

                present++;

            } else if (
                status === "Absent"
            ) {

                absent++;

            } else if (
                status === "Late"
            ) {

                late++;

            }

        }
    );


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

            empty.hidden =
                false;

        }

        return;

    }


    if (empty) {

        empty.hidden =
            true;

    }


    const map =
        new Map();


    filteredRecords.forEach(
        function (record) {

            if (
                !map.has(
                    record.studentId
                )
            ) {

                map.set(
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
                map.get(
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

            }


            if (
                status === "Absent"
            ) {

                item.absent++;

            }


            if (
                status === "Late"
            ) {

                item.late++;

            }

        }
    );


    Array.from(
        map.values()
    ).forEach(
        function (item) {

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
                        ? "Class " +
                          item.className
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
                item.total
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


    populateSectionFilter();

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

function getValue(id) {

    const element =
        document.getElementById(
            id
        );


    return element
        ? String(
            element.value ||
            ""
        ).trim()
        : "";

}


function setValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


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
        document.getElementById(
            id
        );


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
   STUDENT HTML
   ========================================================= */

function createStudentHTML(
    student,
    name,
    secondary
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
                        secondary ||
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
   DATE DISPLAY
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
            normalized +
            "T00:00:00"
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

    const parts =
        String(
            name || ""
        )
            .trim()
            .split(
                /\s+/
            )
            .filter(
                Boolean
            );


    if (!parts.length) {

        return "S";

    }


    if (
        parts.length === 1
    ) {

        return parts[0]
            .substring(
                0,
                2
            )
            .toUpperCase();

    }


    return (
        parts[0][0] +
        parts[
            parts.length - 1
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
   COUNT / TEXT
   ========================================================= */

function updateCount(
    count
) {

    setText(
        "historyRecordCount",
        count +
        " Record" +
        (
            count === 1
                ? ""
                : "s"
        )
    );

}


function updateText(
    count
) {

    setText(
        "historyResultText",
        count === 0
            ? "No attendance records found"
            : "Showing " +
              count +
              " attendance record" +
              (
                  count === 1
                      ? ""
                      : "s"
              )
    );

}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(
    message,
    type
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
        function () {

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
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );

}


/* =========================================================
   GLOBAL
   ========================================================= */

window.SmartSchoolAttendanceHistory = {

    refresh:
        refreshHistory,

    applyFilters:
        applyFilters,

    clearFilters:
        clearFilters,

    getAllRecords:
        function () {
            return [
                ...allAttendanceRecords
            ];
        },

    getFilteredRecords:
        function () {
            return [
                ...filteredRecords
            ];
        }

};
