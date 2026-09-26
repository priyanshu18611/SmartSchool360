/* =========================================================
   SMARTSCHOOL360
   ATTENDANCE MANAGEMENT
   STEP 7B
   Attendance Save + Date/Class/Section Management
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       STORAGE
       ===================================================== */

    const STUDENT_STORAGE_KEY =
        "smartschool_students";

    const ATTENDANCE_STORAGE_KEY =
        "smartschool_attendance";


    /* =====================================================
       ELEMENTS
       ===================================================== */

    const classSelect =
        document.getElementById(
            "attendanceClass"
        );

    const sectionSelect =
        document.getElementById(
            "attendanceSection"
        );

    const dateInput =
        document.getElementById(
            "attendanceDate"
        );

    const loadButton =
        document.getElementById(
            "loadAttendanceBtn"
        );

    const searchInput =
        document.getElementById(
            "attendanceSearch"
        );

    const tableBody =
        document.getElementById(
            "attendanceTableBody"
        );

    const totalStudents =
        document.getElementById(
            "totalStudents"
        );

    const presentStudents =
        document.getElementById(
            "presentStudents"
        );

    const absentStudents =
        document.getElementById(
            "absentStudents"
        );

    const lateStudents =
        document.getElementById(
            "lateStudents"
        );

    const tableSubtitle =
        document.getElementById(
            "attendanceTableSubtitle"
        );


    /* =====================================================
       STATE
       ===================================================== */

    let allStudents = [];

    let displayedStudents = [];

    let selectedDate = "";

    let selectedClass = "";

    let selectedSection = "";

    let currentLoaded = false;


    /* =====================================================
       INITIALIZE
       ===================================================== */

    initialize();


    function initialize() {

        loadStudents();

        setToday();

        buildDynamicClassOptions();

        buildDynamicSectionOptions();

        updateSummary([]);

        createSaveControls();

        attachEvents();

    }


    /* =====================================================
       LOAD STUDENTS
       ===================================================== */

    function loadStudents() {

        try {

            const raw =
                localStorage.getItem(
                    STUDENT_STORAGE_KEY
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
                "Student data error:",
                error
            );

            allStudents = [];

        }

    }


    /* =====================================================
       TODAY
       ===================================================== */

    function setToday() {

        if (!dateInput) {
            return;
        }


        const today =
            new Date();


        const year =
            today.getFullYear();


        const month =
            String(
                today.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const day =
            String(
                today.getDate()
            ).padStart(
                2,
                "0"
            );


        dateInput.value =
            `${year}-${month}-${day}`;

    }


    /* =====================================================
       EVENTS
       ===================================================== */

    function attachEvents() {

        if (loadButton) {

            loadButton.addEventListener(
                "click",
                loadAttendance
            );

        }


        if (searchInput) {

            searchInput.addEventListener(
                "input",
                handleSearch
            );

        }


        if (dateInput) {

            dateInput.addEventListener(
                "change",
                handleFilterChange
            );

        }


        if (classSelect) {

            classSelect.addEventListener(
                "change",
                handleFilterChange
            );

        }


        if (sectionSelect) {

            sectionSelect.addEventListener(
                "change",
                handleFilterChange
            );

        }

    }


    /* =====================================================
       FILTER CHANGE
       ===================================================== */

    function handleFilterChange() {

        currentLoaded = false;

        displayedStudents = [];

        updateSummary([]);

        updateTableMessage(
            "Filters changed",
            "Click \"Load Students\" to load the selected attendance."
        );

    }


    /* =====================================================
       LOAD ATTENDANCE
       ===================================================== */

    function loadAttendance() {

        selectedClass =
            classSelect
                ? classSelect.value
                : "";


        selectedSection =
            sectionSelect
                ? sectionSelect.value
                : "";


        selectedDate =
            dateInput
                ? dateInput.value
                : "";


        if (!selectedClass) {

            showToast(
                "Please select a class.",
                "error"
            );

            return;

        }


        if (!selectedSection) {

            showToast(
                "Please select a section.",
                "error"
            );

            return;

        }


        if (!selectedDate) {

            showToast(
                "Please select a date.",
                "error"
            );

            return;

        }


        const students =
            allStudents.filter(
                student => {

                    return (
                        normalizeClass(
                            student.className
                        ) ===
                        normalizeClass(
                            selectedClass
                        ) &&

                        normalizeSection(
                            student.section
                        ) ===
                        normalizeSection(
                            selectedSection
                        )
                    );

                }
            );


        displayedStudents =
            students;


        currentLoaded = true;


        if (searchInput) {

            searchInput.value = "";

        }


        renderStudents(
            students
        );


        updateSummary(
            students
        );


        updateTableSubtitle(
            students.length
        );


        updateSaveControls();


        if (students.length) {

            showToast(
                `${students.length} student${
                    students.length === 1
                        ? ""
                        : "s"
                } loaded successfully.`
            );

        } else {

            showToast(
                "No students found for this class and section.",
                "error"
            );

        }

    }


    /* =====================================================
       CLASS OPTIONS
       ===================================================== */

    function buildDynamicClassOptions() {

        if (!classSelect) {
            return;
        }


        const existing =
            new Set();


        Array.from(
            classSelect.options
        ).forEach(
            option => {

                existing.add(
                    normalizeClass(
                        option.value
                    )
                );

            }
        );


        allStudents.forEach(
            student => {

                const value =
                    student.className;


                const normalized =
                    normalizeClass(
                        value
                    );


                if (
                    !normalized ||
                    existing.has(
                        normalized
                    )
                ) {

                    return;

                }


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    String(value);


                option.textContent =
                    formatClass(
                        value
                    );


                classSelect.appendChild(
                    option
                );


                existing.add(
                    normalized
                );

            }
        );

    }


    /* =====================================================
       SECTION OPTIONS
       ===================================================== */

    function buildDynamicSectionOptions() {

        if (!sectionSelect) {
            return;
        }


        const existing =
            new Set();


        Array.from(
            sectionSelect.options
        ).forEach(
            option => {

                existing.add(
                    normalizeSection(
                        option.value
                    )
                );

            }
        );


        allStudents.forEach(
            student => {

                const value =
                    student.section;


                const normalized =
                    normalizeSection(
                        value
                    );


                if (
                    !normalized ||
                    existing.has(
                        normalized
                    )
                ) {

                    return;

                }


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    String(value);


                option.textContent =
                    formatSection(
                        value
                    );


                sectionSelect.appendChild(
                    option
                );


                existing.add(
                    normalized
                );

            }
        );

    }


    /* =====================================================
       RENDER STUDENTS
       ===================================================== */

    function renderStudents(
        students
    ) {

        if (!tableBody) {
            return;
        }


        if (!students.length) {

            updateTableMessage(
                "No Students Found",
                "No students match the selected class and section."
            );

            return;

        }


        tableBody.innerHTML =
            students
                .map(
                    student =>
                        createStudentRow(
                            student
                        )
                )
                .join("");


        attachAttendanceButtons();

    }


    /* =====================================================
       CREATE STUDENT ROW
       ===================================================== */

    function createStudentRow(
        student
    ) {

        const status =
            getAttendanceStatus(
                student.id,
                selectedDate
            );


        const initials =
            getInitials(
                student.name
            );


        const photo =
            student.photo ||
            student.studentPhoto ||
            "";


        let avatar = "";


        if (photo) {

            avatar = `

                <img
                    src="${escapeAttribute(
                        photo
                    )}"
                    alt="${escapeAttribute(
                        student.name ||
                        "Student"
                    )}"
                    onerror="
                        this.style.display='none';
                        this.nextElementSibling.style.display='flex';
                    "
                >

                <span
                    style="
                        display:none;
                        width:100%;
                        height:100%;
                        align-items:center;
                        justify-content:center;
                    "
                >
                    ${escapeHtml(
                        initials
                    )}
                </span>

            `;

        } else {

            avatar = `
                ${escapeHtml(
                    initials
                )}
            `;

        }


        return `

            <tr
                data-student-id="${escapeAttribute(
                    student.id
                )}"
            >

                <td>

                    <div
                        class="attendance-student"
                    >

                        <div
                            class="attendance-avatar"
                        >
                            ${avatar}
                        </div>


                        <div
                            class="attendance-student-info"
                        >

                            <strong>
                                ${escapeHtml(
                                    student.name ||
                                    "Unnamed Student"
                                )}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    student.parentPhone ||
                                    student.studentPhone ||
                                    "No contact"
                                )}
                            </span>

                        </div>

                    </div>

                </td>


                <td>
                    ${escapeHtml(
                        student.id ||
                        "—"
                    )}
                </td>


                <td>
                    ${escapeHtml(
                        formatClass(
                            student.className
                        )
                    )}
                </td>


                <td>
                    ${escapeHtml(
                        formatSection(
                            student.section
                        )
                    )}
                </td>


                <td>

                    <span
                        class="
                            attendance-status
                            ${status}
                        "
                        data-status-for="${escapeAttribute(
                            student.id
                        )}"
                    >
                        ${getStatusLabel(
                            status
                        )}
                    </span>

                </td>


                <td>

                    <div
                        class="attendance-mark-actions"
                    >

                        <button
                            type="button"
                            class="
                                attendance-mark-btn
                                present
                                ${
                                    status === "present"
                                        ? "active"
                                        : ""
                                }
                            "
                            data-action="present"
                            data-student-id="${escapeAttribute(
                                student.id
                            )}"
                        >
                            ✓ Present
                        </button>


                        <button
                            type="button"
                            class="
                                attendance-mark-btn
                                absent
                                ${
                                    status === "absent"
                                        ? "active"
                                        : ""
                                }
                            "
                            data-action="absent"
                            data-student-id="${escapeAttribute(
                                student.id
                            )}"
                        >
                            ✕ Absent
                        </button>


                        <button
                            type="button"
                            class="
                                attendance-mark-btn
                                late
                                ${
                                    status === "late"
                                        ? "active"
                                        : ""
                                }
                            "
                            data-action="late"
                            data-student-id="${escapeAttribute(
                                student.id
                            )}"
                        >
                            ⏰ Late
                        </button>

                    </div>

                </td>

            </tr>

        `;

    }


    /* =====================================================
       ATTENDANCE BUTTONS
       ===================================================== */

    function attachAttendanceButtons() {

        const buttons =
            document.querySelectorAll(
                "[data-action][data-student-id]"
            );


        buttons.forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        markAttendance(
                            button.dataset.studentId,
                            button.dataset.action
                        );

                    }
                );

            }
        );

    }


    /* =====================================================
       MARK ATTENDANCE
       ===================================================== */

    function markAttendance(
        studentId,
        status
    ) {

        if (
            !selectedDate ||
            !selectedClass ||
            !selectedSection
        ) {

            showToast(
                "Please load attendance first.",
                "error"
            );

            return;

        }


        const attendance =
            getAttendanceData();


        const key =
            createAttendanceKey(
                studentId,
                selectedDate
            );


        attendance[key] = {

            studentId:
                String(
                    studentId
                ),

            date:
                selectedDate,

            className:
                selectedClass,

            section:
                selectedSection,

            status:
                status,

            updatedAt:
                new Date().toISOString()

        };


        saveAttendanceData(
            attendance
        );


        updateStudentRowStatus(
            studentId,
            status
        );


        updateSummary(
            displayedStudents
        );


        updateSaveControls();


        showToast(
            `Attendance marked ${getStatusLabel(
                status
            ).toLowerCase()}.`
        );

    }


    /* =====================================================
       SAVE CONTROLS
       ===================================================== */

    function createSaveControls() {

        if (!tableBody) {
            return;
        }


        const tableCard =
            document.querySelector(
                ".attendance-table-card"
            );


        if (!tableCard) {
            return;
        }


        if (
            document.getElementById(
                "attendanceSaveBar"
            )
        ) {

            return;

        }


        const bar =
            document.createElement(
                "div"
            );


        bar.id =
            "attendanceSaveBar";


        bar.innerHTML = `

            <div
                id="attendanceSaveInfo"
            >
                Select class, section and date.
            </div>


            <div
                style="
                    display:flex;
                    gap:8px;
                    flex-wrap:wrap;
                    align-items:center;
                "
            >

                <button
                    type="button"
                    id="saveAttendanceBtn"
                >
                    💾 Save Attendance
                </button>


                <button
                    type="button"
                    id="resetAttendanceBtn"
                >
                    ↺ Reset
                </button>

            </div>

        `;


        bar.style.display =
            "flex";

        bar.style.alignItems =
            "center";

        bar.style.justifyContent =
            "space-between";

        bar.style.gap =
            "12px";

        bar.style.flexWrap =
            "wrap";

        bar.style.padding =
            "14px 18px";

        bar.style.background =
            "#f8fafc";

        bar.style.borderBottom =
            "1px solid #e2e8f0";


        const info =
            bar.querySelector(
                "#attendanceSaveInfo"
            );


        info.style.fontSize =
            "12px";

        info.style.fontWeight =
            "700";

        info.style.color =
            "#64748b";


        const saveButton =
            bar.querySelector(
                "#saveAttendanceBtn"
            );


        saveButton.style.border =
            "none";

        saveButton.style.background =
            "#16a34a";

        saveButton.style.color =
            "#ffffff";

        saveButton.style.padding =
            "10px 14px";

        saveButton.style.borderRadius =
            "10px";

        saveButton.style.fontWeight =
            "800";

        saveButton.style.cursor =
            "pointer";


        const resetButton =
            bar.querySelector(
                "#resetAttendanceBtn"
            );


        resetButton.style.border =
            "1px solid #fecaca";

        resetButton.style.background =
            "#fff1f2";

        resetButton.style.color =
            "#dc2626";

        resetButton.style.padding =
            "10px 14px";

        resetButton.style.borderRadius =
            "10px";

        resetButton.style.fontWeight =
            "800";

        resetButton.style.cursor =
            "pointer";


        tableCard.insertBefore(
            bar,
            tableCard.querySelector(
                ".attendance-table-wrapper"
            )
        );


        saveButton.addEventListener(
            "click",
            saveCurrentAttendance
        );


        resetButton.addEventListener(
            "click",
            resetCurrentAttendance
        );

    }


    /* =====================================================
       UPDATE SAVE CONTROLS
       ===================================================== */

    function updateSaveControls() {

        const info =
            document.getElementById(
                "attendanceSaveInfo"
            );


        if (!info) {
            return;
        }


        if (
            !currentLoaded ||
            !selectedDate
        ) {

            info.textContent =
                "Select class, section and date.";

            return;

        }


        const stats =
            getCurrentAttendanceStats();


        const marked =
            stats.present +
            stats.absent +
            stats.late;


        if (!displayedStudents.length) {

            info.textContent =
                "No students available.";

            return;

        }


        if (
            marked ===
            displayedStudents.length
        ) {

            info.textContent =
                `✓ All ${marked} student${
                    marked === 1
                        ? ""
                        : "s"
                } marked for ${formatDisplayDate(
                    selectedDate
                )}.`;

        } else {

            info.textContent =
                `${marked} of ${
                    displayedStudents.length
                } attendance records marked.`;

        }

    }


    /* =====================================================
       SAVE CURRENT ATTENDANCE
       ===================================================== */

    function saveCurrentAttendance() {

        if (!currentLoaded) {

            showToast(
                "Please load attendance first.",
                "error"
            );

            return;

        }


        if (!displayedStudents.length) {

            showToast(
                "No students available to save.",
                "error"
            );

            return;

        }


        const attendance =
            getAttendanceData();


        let markedCount = 0;


        displayedStudents.forEach(
            student => {

                const status =
                    getAttendanceStatus(
                        student.id,
                        selectedDate
                    );


                if (
                    status === "pending"
                ) {

                    return;

                }


                const key =
                    createAttendanceKey(
                        student.id,
                        selectedDate
                    );


                attendance[key] = {

                    studentId:
                        String(
                            student.id
                        ),

                    date:
                        selectedDate,

                    className:
                        selectedClass,

                    section:
                        selectedSection,

                    status:
                        status,

                    updatedAt:
                        new Date().toISOString(),

                    savedAt:
                        new Date().toISOString()

                };


                markedCount++;

            }
        );


        saveAttendanceData(
            attendance
        );


        updateSaveControls();


        showToast(
            `${markedCount} attendance record${
                markedCount === 1
                    ? ""
                    : "s"
            } saved successfully.`
        );

    }


    /* =====================================================
       RESET CURRENT ATTENDANCE
       ===================================================== */

    function resetCurrentAttendance() {

        if (!currentLoaded) {

            showToast(
                "Please load attendance first.",
                "error"
            );

            return;

        }


        if (!displayedStudents.length) {

            return;

        }


        const confirmed =
            window.confirm(
                `Reset attendance for ${
                    displayedStudents.length
                } student${
                    displayedStudents.length === 1
                        ? ""
                        : "s"
                } on ${
                    formatDisplayDate(
                        selectedDate
                    )
                }?`
            );


        if (!confirmed) {
            return;
        }


        const attendance =
            getAttendanceData();


        displayedStudents.forEach(
            student => {

                const key =
                    createAttendanceKey(
                        student.id,
                        selectedDate
                    );


                delete attendance[key];

            }
        );


        saveAttendanceData(
            attendance
        );


        renderStudents(
            displayedStudents
        );


        updateSummary(
            displayedStudents
        );


        updateSaveControls();


        showToast(
            "Attendance reset successfully."
        );

    }


    /* =====================================================
       STATUS UPDATE
       ===================================================== */

    function updateStudentRowStatus(
        studentId,
        status
    ) {

        const statusElement =
            document.querySelector(
                `[data-status-for="${cssEscape(
                    studentId
                )}"]`
            );


        if (statusElement) {

            statusElement.className =
                `attendance-status ${status}`;

            statusElement.textContent =
                getStatusLabel(
                    status
                );

        }


        const row =
            document.querySelector(
                `tr[data-student-id="${cssEscape(
                    studentId
                )}"]`
            );


        if (!row) {
            return;
        }


        const buttons =
            row.querySelectorAll(
                "[data-action]"
            );


        buttons.forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.action ===
                    status
                );

            }
        );

    }


    /* =====================================================
       SUMMARY
       ===================================================== */

    function updateSummary(
        students
    ) {

        let present = 0;

        let absent = 0;

        let late = 0;


        students.forEach(
            student => {

                const status =
                    getAttendanceStatus(
                        student.id,
                        selectedDate
                    );


                if (
                    status === "present"
                ) {

                    present++;

                }


                if (
                    status === "absent"
                ) {

                    absent++;

                }


                if (
                    status === "late"
                ) {

                    late++;

                }

            }
        );


        if (totalStudents) {

            totalStudents.textContent =
                students.length;

        }


        if (presentStudents) {

            presentStudents.textContent =
                present;

        }


        if (absentStudents) {

            absentStudents.textContent =
                absent;

        }


        if (lateStudents) {

            lateStudents.textContent =
                late;

        }

    }


    /* =====================================================
       CURRENT STATS
       ===================================================== */

    function getCurrentAttendanceStats() {

        const stats = {

            present: 0,

            absent: 0,

            late: 0,

            pending: 0

        };


        displayedStudents.forEach(
            student => {

                const status =
                    getAttendanceStatus(
                        student.id,
                        selectedDate
                    );


                if (
                    Object.prototype.hasOwnProperty.call(
                        stats,
                        status
                    )
                ) {

                    stats[status]++;

                } else {

                    stats.pending++;

                }

            }
        );


        return stats;

    }


    /* =====================================================
       SEARCH
       ===================================================== */

    function handleSearch() {

        if (
            !currentLoaded ||
            !displayedStudents.length
        ) {

            return;

        }


        const query =
            String(
                searchInput.value || ""
            )
                .trim()
                .toLowerCase();


        if (!query) {

            renderStudents(
                displayedStudents
            );

            updateSummary(
                displayedStudents
            );

            updateSaveControls();

            return;

        }


        const filtered =
            displayedStudents.filter(
                student => {

                    const name =
                        String(
                            student.name || ""
                        ).toLowerCase();


                    const id =
                        String(
                            student.id || ""
                        ).toLowerCase();


                    const phone =
                        String(
                            student.studentPhone ||
                            student.parentPhone ||
                            ""
                        ).toLowerCase();


                    return (
                        name.includes(query) ||
                        id.includes(query) ||
                        phone.includes(query)
                    );

                }
            );


        renderStudents(
            filtered
        );

    }


    /* =====================================================
       TABLE MESSAGE
       ===================================================== */

    function updateTableMessage(
        title,
        message
    ) {

        if (!tableBody) {
            return;
        }


        tableBody.innerHTML = `

            <tr>

                <td colspan="6">

                    <div
                        class="attendance-empty"
                    >

                        <div
                            class="attendance-empty-icon"
                        >
                            📋
                        </div>

                        <h3>
                            ${escapeHtml(
                                title
                            )}
                        </h3>

                        <p>
                            ${escapeHtml(
                                message
                            )}
                        </p>

                    </div>

                </td>

            </tr>

        `;


        if (tableSubtitle) {

            tableSubtitle.textContent =
                message;

        }

    }


    /* =====================================================
       STORAGE READ
       ===================================================== */

    function getAttendanceData() {

        try {

            const raw =
                localStorage.getItem(
                    ATTENDANCE_STORAGE_KEY
                );


            if (!raw) {

                return {};

            }


            const parsed =
                JSON.parse(raw);


            if (
                !parsed ||
                typeof parsed !== "object" ||
                Array.isArray(parsed)
            ) {

                return {};

            }


            return parsed;


        } catch (error) {

            console.error(
                "Attendance storage error:",
                error
            );

            return {};

        }

    }


    /* =====================================================
       STORAGE SAVE
       ===================================================== */

    function saveAttendanceData(
        data
    ) {

        try {

            localStorage.setItem(
                ATTENDANCE_STORAGE_KEY,
                JSON.stringify(
                    data
                )
            );


            return true;


        } catch (error) {

            console.error(
                "Attendance save error:",
                error
            );


            showToast(
                "Attendance could not be saved.",
                "error"
            );


            return false;

        }

    }


    /* =====================================================
       GET STATUS
       ===================================================== */

    function getAttendanceStatus(
        studentId,
        date
    ) {

        if (
            !studentId ||
            !date
        ) {

            return "pending";

        }


        const attendance =
            getAttendanceData();


        const key =
            createAttendanceKey(
                studentId,
                date
            );


        const record =
            attendance[key];


        if (
            record &&
            record.status
        ) {

            return record.status;

        }


        return "pending";

    }


    /* =====================================================
       KEY
       ===================================================== */

    function createAttendanceKey(
        studentId,
        date
    ) {

        return `${date}__${studentId}`;

    }


    /* =====================================================
       STATUS LABEL
       ===================================================== */

    function getStatusLabel(
        status
    ) {

        switch (status) {

            case "present":
                return "Present";

            case "absent":
                return "Absent";

            case "late":
                return "Late";

            default:
                return "Pending";

        }

    }


    /* =====================================================
       CLASS
       ===================================================== */

    function normalizeClass(
        value
    ) {

        if (
            value === undefined ||
            value === null
        ) {

            return "";

        }


        return String(value)
            .trim()
            .toLowerCase()
            .replace(
                /^class\s*/i,
                ""
            )
            .replace(
                /\s+/g,
                "");

    }


    function formatClass(
        value
    ) {

        if (
            value === undefined ||
            value === null ||
            String(value).trim() === ""
        ) {

            return "—";

        }


        const text =
            String(value).trim();


        if (
            text
                .toLowerCase()
                .startsWith("class")
        ) {

            return text;

        }


        return `Class ${text}`;

    }


    /* =====================================================
       SECTION
       ===================================================== */

    function normalizeSection(
        value
    ) {

        if (
            value === undefined ||
            value === null
        ) {

            return "";

        }


        return String(value)
            .trim()
            .toLowerCase()
            .replace(
                /^section\s*/i,
                "");

    }


    function formatSection(
        value
    ) {

        if (
            value === undefined ||
            value === null ||
            String(value).trim() === ""
        ) {

            return "—";

        }


        const text =
            String(value).trim();


        if (
            text
                .toLowerCase()
                .startsWith("section")
        ) {

            return text;

        }


        return `Section ${text}`;

    }


    /* =====================================================
       INITIALS
       ===================================================== */

    function getInitials(
        name
    ) {

        if (!name) {
            return "ST";
        }


        const parts =
            String(name)
                .trim()
                .split(/\s+/)
                .filter(Boolean);


        if (parts.length === 1) {

            return parts[0]
                .substring(0, 2)
                .toUpperCase();

        }


        return (
            parts[0].charAt(0) +
            parts[
                parts.length - 1
            ].charAt(0)
        ).toUpperCase();

    }


    /* =====================================================
       DATE
       ===================================================== */

    function formatDisplayDate(
        value
    ) {

        if (!value) {
            return "—";
        }


        const date =
            new Date(
                `${value}T00:00:00`
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return value;

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


    /* =====================================================
       TOAST
       ===================================================== */

    function showToast(
        message,
        type = "success"
    ) {

        const old =
            document.querySelector(
                ".attendance-toast"
            );


        if (old) {
            old.remove();
        }


        const toast =
            document.createElement(
                "div"
            );


        toast.className =
            "attendance-toast";


        toast.textContent =
            message;


        Object.assign(
            toast.style,
            {

                position: "fixed",

                left: "50%",

                bottom: "24px",

                transform:
                    "translateX(-50%) translateY(20px)",

                zIndex: "99999",

                padding:
                    "13px 18px",

                borderRadius:
                    "13px",

                fontSize:
                    "14px",

                fontWeight:
                    "800",

                color:
                    "#ffffff",

                background:
                    type === "error"
                        ? "#dc2626"
                        : "#16a34a",

                boxShadow:
                    "0 12px 30px rgba(15,23,42,.20)",

                opacity: "0",

                transition:
                    "all .25s ease",

                maxWidth:
                    "calc(100% - 30px)",

                textAlign:
                    "center"

            }
        );


        document.body.appendChild(
            toast
        );


        requestAnimationFrame(
            () => {

                toast.style.opacity =
                    "1";

                toast.style.transform =
                    "translateX(-50%) translateY(0)";

            }
        );


        setTimeout(
            () => {

                toast.style.opacity =
                    "0";

                toast.style.transform =
                    "translateX(-50%) translateY(20px)";


                setTimeout(
                    () => {

                        toast.remove();

                    },
                    250
                );

            },
            2200
        );

    }


    /* =====================================================
       ESCAPE HTML
       ===================================================== */

    function escapeHtml(
        value
    ) {

        return String(value)
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


    /* =====================================================
       ESCAPE ATTRIBUTE
       ===================================================== */

    function escapeAttribute(
        value
    ) {

        return escapeHtml(
            value
        );

    }


    /* =====================================================
       CSS ESCAPE
       ===================================================== */

    function cssEscape(
        value
    ) {

        if (
            window.CSS &&
            typeof window.CSS.escape ===
                "function"
        ) {

            return window.CSS.escape(
                String(value)
            );

        }


        return String(value)
            .replace(
                /[^a-zA-Z0-9_-]/g,
                "\\$&"
            );

    }

});
