/* =========================================================
   SMARTSCHOOL360
   ATTENDANCE MANAGEMENT
   STEP 7A
   Attendance Dashboard + LocalStorage
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       STORAGE KEYS
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

    }


    /* =====================================================
       LOAD STUDENTS
       ===================================================== */

    function loadStudents() {

        try {

            const rawData =
                localStorage.getItem(
                    STUDENT_STORAGE_KEY
                );


            if (!rawData) {

                allStudents = [];

                return;

            }


            const parsed =
                JSON.parse(rawData);


            allStudents =
                Array.isArray(parsed)
                    ? parsed
                    : [];


        } catch (error) {

            console.error(
                "Unable to load students:",
                error
            );

            allStudents = [];

        }

    }


    /* =====================================================
       SET TODAY
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
       NORMALIZE CLASS
       ===================================================== */

    function normalizeClass(value) {

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
                ""
            );

    }


    /* =====================================================
       NORMALIZE SECTION
       ===================================================== */

    function normalizeSection(value) {

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
                ""
            );

    }


    /* =====================================================
       DYNAMIC CLASS OPTIONS
       ===================================================== */

    function buildDynamicClassOptions() {

        if (!classSelect) {
            return;
        }


        const existingValues =
            new Set();


        Array.from(
            classSelect.options
        ).forEach(
            option => {

                existingValues.add(
                    normalizeClass(
                        option.value
                    )
                );

            }
        );


        allStudents.forEach(
            student => {

                const classValue =
                    student.className;


                const normalized =
                    normalizeClass(
                        classValue
                    );


                if (
                    !normalized ||
                    existingValues.has(
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
                    String(
                        classValue
                    );


                option.textContent =
                    String(
                        classValue
                    )
                        .toLowerCase()
                        .startsWith(
                            "class"
                        )
                        ? String(
                            classValue
                        )
                        : `Class ${classValue}`;


                classSelect.appendChild(
                    option
                );


                existingValues.add(
                    normalized
                );

            }
        );

    }


    /* =====================================================
       DYNAMIC SECTION OPTIONS
       ===================================================== */

    function buildDynamicSectionOptions() {

        if (!sectionSelect) {
            return;
        }


        const existingValues =
            new Set();


        Array.from(
            sectionSelect.options
        ).forEach(
            option => {

                existingValues.add(
                    normalizeSection(
                        option.value
                    )
                );

            }
        );


        allStudents.forEach(
            student => {

                const sectionValue =
                    student.section;


                const normalized =
                    normalizeSection(
                        sectionValue
                    );


                if (
                    !normalized ||
                    existingValues.has(
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
                    String(
                        sectionValue
                    );


                option.textContent =
                    String(
                        sectionValue
                    )
                        .toLowerCase()
                        .startsWith(
                            "section"
                        )
                        ? String(
                            sectionValue
                        )
                        : `Section ${sectionValue}`;


                sectionSelect.appendChild(
                    option
                );


                existingValues.add(
                    normalized
                );

            }
        );

    }


    /* =====================================================
       LOAD ATTENDANCE
       ===================================================== */

    if (loadButton) {

        loadButton.addEventListener(
            "click",
            loadAttendance
        );

    }


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
                "Please select an attendance date.",
                "error"
            );

            return;

        }


        const classStudents =
            allStudents.filter(
                student =>
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


        displayedStudents =
            classStudents;


        renderStudents(
            classStudents
        );


        updateSummary(
            classStudents
        );


        updateTableSubtitle(
            classStudents.length
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

            tableBody.innerHTML = `

                <tr>

                    <td colspan="6">

                        <div
                            class="attendance-empty"
                        >

                            <div
                                class="attendance-empty-icon"
                            >
                                🔍
                            </div>

                            <h3>
                                No Students Found
                            </h3>

                            <p>
                                No students match
                                the selected class
                                and section.
                            </p>

                        </div>

                    </td>

                </tr>

            `;

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


        attachAttendanceEvents();

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


        const avatarContent =
            photo
                ? `
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
                        style="display:none;"
                    >
                        ${escapeHtml(
                            initials
                        )}
                    </span>
                `
                : `
                    ${escapeHtml(
                        initials
                    )}
                `;


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
                            ${avatarContent}
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
                                ${status === "present"
                                    ? "active"
                                    : ""}
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
                                ${status === "absent"
                                    ? "active"
                                    : ""}
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
                                ${status === "late"
                                    ? "active"
                                    : ""}
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
       ATTENDANCE EVENTS
       ===================================================== */

    function attachAttendanceEvents() {

        const buttons =
            document.querySelectorAll(
                "[data-action][data-student-id]"
            );


        buttons.forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const studentId =
                            button.dataset.studentId;


                        const action =
                            button.dataset.action;


                        markAttendance(
                            studentId,
                            action
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

        if (!selectedDate) {

            showToast(
                "Please select a date first.",
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


        showToast(
            `Attendance marked ${getStatusLabel(
                status
            ).toLowerCase()}.`
        );

    }


    /* =====================================================
       UPDATE ROW STATUS
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


                if (status === "present") {

                    present++;

                } else if (
                    status === "absent"
                ) {

                    absent++;

                } else if (
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
       TABLE SUBTITLE
       ===================================================== */

    function updateTableSubtitle(
        count
    ) {

        if (!tableSubtitle) {
            return;
        }


        const formattedDate =
            formatDisplayDate(
                selectedDate
            );


        tableSubtitle.textContent =
            `${count} student${
                count === 1 ? "" : "s"
            } · ${
                formatClass(
                    selectedClass
                )
            } · ${
                formatSection(
                    selectedSection
                )
            } · ${
                formattedDate
            }`;

    }


    /* =====================================================
       SEARCH
       ===================================================== */

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            handleSearch
        );

    }


    function handleSearch() {

        const query =
            String(
                searchInput.value || ""
            )
                .trim()
                .toLowerCase();


        if (!displayedStudents.length) {
            return;
        }


        if (!query) {

            renderStudents(
                displayedStudents
            );

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
       ATTENDANCE STORAGE
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


            return (
                parsed &&
                typeof parsed === "object"
            )
                ? parsed
                : {};


        } catch (error) {

            console.error(
                "Unable to read attendance:",
                error
            );

            return {};

        }

    }


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


        } catch (error) {

            console.error(
                "Unable to save attendance:",
                error
            );


            showToast(
                "Attendance could not be saved.",
                "error"
            );

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


        if (
            attendance[key] &&
            attendance[key].status
        ) {

            return attendance[key].status;

        }


        return "pending";

    }


    /* =====================================================
       ATTENDANCE KEY
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
       FORMAT CLASS
       ===================================================== */

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
       FORMAT SECTION
       ===================================================== */

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
       FORMAT DATE
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

        const existing =
            document.querySelector(
                ".attendance-toast"
            );


        if (existing) {
            existing.remove();
        }


        const toast =
            document.createElement(
                "div"
            );


        toast.className =
            "attendance-toast";


        toast.textContent =
            message;


        toast.style.position =
            "fixed";

        toast.style.left =
            "50%";

        toast.style.bottom =
            "25px";

        toast.style.transform =
            "translateX(-50%) translateY(20px)";

        toast.style.zIndex =
            "9999";

        toast.style.padding =
            "13px 18px";

        toast.style.borderRadius =
            "12px";

        toast.style.fontSize =
            "14px";

        toast.style.fontWeight =
            "700";

        toast.style.color =
            "#ffffff";

        toast.style.background =
            type === "error"
                ? "#dc2626"
                : "#16a34a";

        toast.style.boxShadow =
            "0 12px 30px rgba(15,23,42,.20)";

        toast.style.opacity =
            "0";

        toast.style.transition =
            "all .25s ease";


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
