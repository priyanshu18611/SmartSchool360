document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = "smartschool_students";

    // =====================================================
    // DOM ELEMENTS
    // =====================================================

    const tableBody = document.getElementById("studentsTableBody");
    const searchInput = document.getElementById("studentSearch");
    const classFilter = document.getElementById("classFilter");

    const totalStudentsEl = document.getElementById("totalStudents");
    const activeStudentsEl = document.getElementById("activeStudents");
    const classCountEl = document.getElementById("classCount");
    const newAdmissionsEl = document.getElementById("newAdmissions");

    const emptyState = document.getElementById("emptyState");

    const addStudentBtn = document.getElementById("addStudentBtn");
    const emptyAddBtn = document.getElementById("emptyAddBtn");

    const exportButton = document.getElementById("exportStudents");


    // =====================================================
    // STUDENT DATA
    // =====================================================

    let students = [];


    // =====================================================
    // LOAD STUDENTS
    // =====================================================

    function loadStudents() {
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);

            if (!savedData) {
                students = [];
            } else {
                const parsedData = JSON.parse(savedData);

                students = Array.isArray(parsedData)
                    ? parsedData
                    : [];
            }

        } catch (error) {
            console.error(
                "SmartSchool360: Error loading students",
                error
            );

            students = [];
        }

        updateDashboardStats();
        renderStudents();
    }


    // =====================================================
    // SAFE VALUE
    // =====================================================

    function safeValue(value, fallback = "") {
        if (
            value === undefined ||
            value === null
        ) {
            return fallback;
        }

        const text = String(value).trim();

        return text === ""
            ? fallback
            : text;
    }


    // =====================================================
    // GET STUDENT ID
    // =====================================================

    function getStudentId(student) {
        return safeValue(
            student.studentId ||
            student.id ||
            student.admissionId ||
            student.registrationId ||
            student.rollNumber,
            "N/A"
        );
    }


    // =====================================================
    // GET STUDENT NAME
    // =====================================================

    function getStudentName(student) {
        return safeValue(
            student.name ||
            student.fullName ||
            student.studentName ||
            student.studentFullName,
            "Unnamed Student"
        );
    }


    // =====================================================
    // GET CLASS
    // =====================================================

    function getStudentClass(student) {
        return safeValue(
            student.className ||
            student.class ||
            student.standard ||
            student.grade,
            "N/A"
        );
    }


    // =====================================================
    // GET SECTION
    // =====================================================

    function getStudentSection(student) {
        return safeValue(
            student.section ||
            student.classSection,
            "-"
        );
    }


    // =====================================================
    // GET PARENT CONTACT
    // =====================================================

    function getParentContact(student) {
        return safeValue(
            student.parentPhone ||
            student.fatherPhone ||
            student.motherPhone ||
            student.guardianPhone ||
            student.contactNumber ||
            student.phone ||
            student.mobile,
            "N/A"
        );
    }


    // =====================================================
    // GET PARENT NAME
    // =====================================================

    function getParentName(student) {
        return safeValue(
            student.fatherName ||
            student.father ||
            student.motherName ||
            student.mother ||
            student.parentName ||
            student.guardianName,
            "N/A"
        );
    }


    // =====================================================
    // GET ADMISSION DATE
    // =====================================================

    function getAdmissionDate(student) {
        return (
            student.admissionDate ||
            student.dateOfAdmission ||
            student.admission_date ||
            ""
        );
    }


    // =====================================================
    // GET STATUS
    // =====================================================

    function getStudentStatus(student) {
        return safeValue(
            student.status ||
            student.studentStatus,
            "Active"
        );
    }


    // =====================================================
    // FORMAT DATE
    // =====================================================

    function formatDate(value) {

        if (!value) {
            return "N/A";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return safeValue(value, "N/A");
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


    // =====================================================
    // GET INITIALS
    // =====================================================

    function getInitials(name) {

        const cleanName = safeValue(
            name,
            "Student"
        );

        const words = cleanName
            .split(/\s+/)
            .filter(Boolean);

        if (words.length === 1) {
            return words[0]
                .substring(0, 2)
                .toUpperCase();
        }

        return (
            words[0].charAt(0) +
            words[words.length - 1].charAt(0)
        ).toUpperCase();
    }


    // =====================================================
    // ESCAPE HTML
    // =====================================================

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    // =====================================================
    // UPDATE DASHBOARD STATS
    // =====================================================

    function updateDashboardStats() {

        const total = students.length;

        const active = students.filter(student => {

            const status =
                getStudentStatus(student)
                    .toLowerCase();

            return (
                status === "active" ||
                status === "approved"
            );

        }).length;


        const classes = new Set();

        students.forEach(student => {

            const studentClass =
                getStudentClass(student);

            if (
                studentClass &&
                studentClass !== "N/A"
            ) {
                classes.add(
                    studentClass.toLowerCase()
                );
            }

        });


        // New admissions:
        // Records from the last 30 days

        const now = new Date();

        const newAdmissions =
            students.filter(student => {

                const admissionDate =
                    getAdmissionDate(student);

                if (!admissionDate) {
                    return false;
                }

                const date =
                    new Date(admissionDate);

                if (Number.isNaN(date.getTime())) {
                    return false;
                }

                const difference =
                    now.getTime() -
                    date.getTime();

                const days =
                    difference /
                    (1000 * 60 * 60 * 24);

                return days >= 0 && days <= 30;

            }).length;


        if (totalStudentsEl) {
            totalStudentsEl.textContent = total;
        }

        if (activeStudentsEl) {
            activeStudentsEl.textContent = active;
        }

        if (classCountEl) {
            classCountEl.textContent =
                classes.size;
        }

        if (newAdmissionsEl) {
            newAdmissionsEl.textContent =
                newAdmissions;
        }
    }


    // =====================================================
    // RENDER STUDENTS
    // =====================================================

    function renderStudents() {

        if (!tableBody) {
            console.error(
                "studentsTableBody not found."
            );

            return;
        }


        const searchTerm =
            searchInput
                ? searchInput.value
                    .trim()
                    .toLowerCase()
                : "";


        const selectedClass =
            classFilter
                ? classFilter.value
                    .trim()
                    .toLowerCase()
                : "";


        const filteredStudents =
            students.filter(student => {

                const id =
                    getStudentId(student)
                        .toLowerCase();

                const name =
                    getStudentName(student)
                        .toLowerCase();

                const studentClass =
                    getStudentClass(student)
                        .toLowerCase();

                const section =
                    getStudentSection(student)
                        .toLowerCase();

                const parent =
                    getParentName(student)
                        .toLowerCase();

                const phone =
                    getParentContact(student)
                        .toLowerCase();


                const matchesSearch =
                    !searchTerm ||
                    id.includes(searchTerm) ||
                    name.includes(searchTerm) ||
                    studentClass.includes(searchTerm) ||
                    section.includes(searchTerm) ||
                    parent.includes(searchTerm) ||
                    phone.includes(searchTerm);


                const matchesClass =
                    !selectedClass ||
                    studentClass === selectedClass;


                return (
                    matchesSearch &&
                    matchesClass
                );
            });


        // =================================================
        // EMPTY STATE
        // =================================================

        if (filteredStudents.length === 0) {

            tableBody.innerHTML = "";

            if (emptyState) {
                emptyState.style.display = "flex";
            }

            return;
        }


        // Hide empty state

        if (emptyState) {
            emptyState.style.display = "none";
        }


        // =================================================
        // TABLE ROWS
        // =================================================

        tableBody.innerHTML =
            filteredStudents
                .map(student => {

                    const id =
                        getStudentId(student);

                    const name =
                        getStudentName(student);

                    const studentClass =
                        getStudentClass(student);

                    const section =
                        getStudentSection(student);

                    const parent =
                        getParentName(student);

                    const phone =
                        getParentContact(student);

                    const admissionDate =
                        getAdmissionDate(student);

                    const status =
                        getStudentStatus(student);


                    const normalizedStatus =
                        status.toLowerCase();


                    const statusClass =
                        normalizedStatus === "active" ||
                        normalizedStatus === "approved"
                            ? "active"
                            : "inactive";


                    return `
                        <tr>

                            <!-- STUDENT ID -->
                            <td>
                                <strong>
                                    ${escapeHTML(id)}
                                </strong>
                            </td>


                            <!-- STUDENT -->
                            <td>

                                <div
                                    class="student-cell"
                                    style="
                                        display:flex;
                                        align-items:center;
                                        gap:10px;
                                    "
                                >

                                    <div
                                        class="student-avatar"
                                        style="
                                            width:40px;
                                            height:40px;
                                            min-width:40px;
                                            border-radius:50%;
                                            display:flex;
                                            align-items:center;
                                            justify-content:center;
                                            font-weight:700;
                                        "
                                    >
                                        ${escapeHTML(
                                            getInitials(name)
                                        )}
                                    </div>


                                    <div>

                                        <strong>
                                            ${escapeHTML(name)}
                                        </strong>

                                    </div>

                                </div>

                            </td>


                            <!-- CLASS -->
                            <td>
                                ${escapeHTML(studentClass)}
                            </td>


                            <!-- SECTION -->
                            <td>
                                ${escapeHTML(section)}
                            </td>


                            <!-- PARENT CONTACT -->
                            <td>

                                <div>
                                    <strong>
                                        ${escapeHTML(parent)}
                                    </strong>

                                    <br>

                                    <small>
                                        ${escapeHTML(phone)}
                                    </small>
                                </div>

                            </td>


                            <!-- ADMISSION DATE -->
                            <td>
                                ${escapeHTML(
                                    formatDate(admissionDate)
                                )}
                            </td>


                            <!-- STATUS -->
                            <td>

                                <span
                                    class="status-badge ${statusClass}"
                                >
                                    ${escapeHTML(status)}
                                </span>

                            </td>


                            <!-- ACTION -->
                            <td>

                                <div
                                    class="student-actions"
                                    style="
                                        display:flex;
                                        gap:6px;
                                        flex-wrap:wrap;
                                    "
                                >

                                    <button
                                        type="button"
                                        class="action-btn view-btn"
                                        data-student-id="${escapeHTML(id)}"
                                        title="View Student Profile"
                                    >
                                        👁️ View
                                    </button>


                                    <button
                                        type="button"
                                        class="action-btn edit-btn"
                                        data-student-id="${escapeHTML(id)}"
                                        title="Edit Student"
                                    >
                                        ✏️ Edit
                                    </button>

                                </div>

                            </td>

                        </tr>
                    `;

                })
                .join("");


        attachActionEvents();
    }


    // =====================================================
    // VIEW + EDIT BUTTONS
    // =====================================================

    function attachActionEvents() {

        const viewButtons =
            document.querySelectorAll(
                ".view-btn"
            );


        viewButtons.forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const studentId =
                        button.getAttribute(
                            "data-student-id"
                        );


                    if (
                        !studentId ||
                        studentId === "N/A"
                    ) {

                        alert(
                            "Student ID is missing."
                        );

                        return;
                    }


                    // Student Profile page
                    window.location.href =
                        "student-profile.html?id=" +
                        encodeURIComponent(
                            studentId
                        );
                }
            );
        });


        const editButtons =
            document.querySelectorAll(
                ".edit-btn"
            );


        editButtons.forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const studentId =
                        button.getAttribute(
                            "data-student-id"
                        );


                    if (!studentId) {
                        alert(
                            "Student ID is missing."
                        );

                        return;
                    }


                    alert(
                        "Edit Student module will be connected next."
                    );
                }
            );
        });
    }


    // =====================================================
    // SEARCH
    // =====================================================

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            () => {
                renderStudents();
            }
        );
    }


    // =====================================================
    // CLASS FILTER
    // =====================================================

    if (classFilter) {

        classFilter.addEventListener(
            "change",
            () => {
                renderStudents();
            }
        );
    }


    // =====================================================
    // ADD STUDENT BUTTON
    // =====================================================

    function openAdmissionPage() {

        window.location.href =
            "add-student.html";
    }


    if (addStudentBtn) {

        addStudentBtn.addEventListener(
            "click",
            openAdmissionPage
        );
    }


    if (emptyAddBtn) {

        emptyAddBtn.addEventListener(
            "click",
            openAdmissionPage
        );
    }


    // =====================================================
    // EXPORT STUDENTS
    // =====================================================

    if (exportButton) {

        exportButton.addEventListener(
            "click",
            () => {

                if (students.length === 0) {

                    alert(
                        "No student records available for export."
                    );

                    return;
                }


                const headers = [
                    "Student ID",
                    "Student Name",
                    "Class",
                    "Section",
                    "Parent Name",
                    "Parent Contact",
                    "Admission Date",
                    "Status"
                ];


                const rows =
                    students.map(student => {

                        return [
                            getStudentId(student),
                            getStudentName(student),
                            getStudentClass(student),
                            getStudentSection(student),
                            getParentName(student),
                            getParentContact(student),
                            formatDate(
                                getAdmissionDate(student)
                            ),
                            getStudentStatus(student)
                        ];

                    });


                const csvRows = [
                    headers,
                    ...rows
                ];


                const csvContent =
                    csvRows
                        .map(row => {

                            return row
                                .map(value => {

                                    return `"${String(value)
                                        .replace(
                                            /"/g,
                                            '""'
                                        )}"`;

                                })
                                .join(",");

                        })
                        .join("\n");


                const blob =
                    new Blob(
                        [csvContent],
                        {
                            type:
                                "text/csv;charset=utf-8;"
                        }
                    );


                const url =
                    URL.createObjectURL(blob);


                const link =
                    document.createElement("a");


                link.href = url;

                link.download =
                    "SmartSchool360_Students.csv";


                document.body.appendChild(link);

                link.click();

                document.body.removeChild(link);


                URL.revokeObjectURL(url);
            }
        );
    }


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    loadStudents();


    console.log(
        "SmartSchool360 Students Module Loaded"
    );

    console.log(
        "Students found:",
        students.length
    );
});
