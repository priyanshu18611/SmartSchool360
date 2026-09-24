/* =========================================
   SMARTSCHOOL360
   STUDENT MANAGEMENT MODULE
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {

    const tableBody =
        document.getElementById("studentsTableBody");

    const emptyState =
        document.getElementById("emptyState");

    const searchInput =
        document.getElementById("studentSearch");

    const classFilter =
        document.getElementById("classFilter");

    const addStudentBtn =
        document.getElementById("addStudentBtn");

    const emptyAddBtn =
        document.getElementById("emptyAddBtn");

    const exportBtn =
        document.getElementById("exportStudents");


    /* =========================================
       GET STUDENTS
       ========================================= */

    function getStudents() {

        try {

            return JSON.parse(
                localStorage.getItem(
                    "smartschool_students"
                )
            ) || [];

        } catch (error) {

            console.error(
                "Unable to read student data:",
                error
            );

            return [];
        }
    }


    /* =========================================
       DISPLAY STUDENTS
       ========================================= */

    function renderStudents() {

        if (!tableBody) return;

        const students = getStudents();

        const search =
            searchInput
                ? searchInput.value
                    .trim()
                    .toLowerCase()
                : "";

        const selectedClass =
            classFilter
                ? classFilter.value
                : "";


        const filteredStudents =
            students.filter(student => {

                const searchableText = [

                    student.id,

                    student.name,

                    student.className,

                    student.section,

                    student.parentPhone,

                    student.fatherName

                ]
                    .join(" ")
                    .toLowerCase();


                const matchesSearch =
                    !search ||
                    searchableText.includes(search);


                const matchesClass =
                    !selectedClass ||
                    student.className === selectedClass;


                return (
                    matchesSearch &&
                    matchesClass
                );

            });


        tableBody.innerHTML = "";


        /* =====================================
           EMPTY STATE
           ===================================== */

        if (filteredStudents.length === 0) {

            if (emptyState) {

                emptyState.style.display =
                    "block";

            }

        } else {

            if (emptyState) {

                emptyState.style.display =
                    "none";

            }

        }


        /* =====================================
           TABLE ROWS
           ===================================== */

        filteredStudents.forEach(student => {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    <strong>
                        ${escapeHTML(student.id)}
                    </strong>
                </td>


                <td>

                    <div class="student-table-user">

                        <div class="student-mini-avatar">
                            ${getInitials(student.name)}
                        </div>

                        <div>

                            <strong>
                                ${escapeHTML(student.name)}
                            </strong>

                            <small>
                                ${escapeHTML(student.gender || "Student")}
                            </small>

                        </div>

                    </div>

                </td>


                <td>
                    ${escapeHTML(student.className)}
                </td>


                <td>
                    ${escapeHTML(student.section)}
                </td>


                <td>
                    ${escapeHTML(student.parentPhone)}
                </td>


                <td>
                    ${formatDate(student.admissionDate)}
                </td>


                <td>

                    <span class="status-badge ${getStatusClass(student.status)}">

                        ${escapeHTML(student.status || "Active")}

                    </span>

                </td>


                <td>

                    <button
                        class="student-view-btn"
                        data-id="${escapeHTML(student.id)}"
                        type="button"
                    >
                        View
                    </button>

                </td>

            `;


            tableBody.appendChild(row);

        });


        updateStatistics(students);

        attachViewButtons();

    }


    /* =========================================
       STATISTICS
       ========================================= */

    function updateStatistics(students) {

        const totalStudents =
            document.getElementById(
                "totalStudents"
            );


        const activeStudents =
            document.getElementById(
                "activeStudents"
            );


        const classCount =
            document.getElementById(
                "classCount"
            );


        const newAdmissions =
            document.getElementById(
                "newAdmissions"
            );


        if (totalStudents) {

            totalStudents.textContent =
                students.length;

        }


        if (activeStudents) {

            activeStudents.textContent =
                students.filter(
                    student =>
                        student.status === "Active"
                ).length;

        }


        if (classCount) {

            const uniqueClasses =
                new Set(
                    students
                        .map(
                            student =>
                                student.className
                        )
                        .filter(Boolean)
                );

            classCount.textContent =
                uniqueClasses.size;

        }


        if (newAdmissions) {

            const currentMonth =
                new Date().getMonth();

            const currentYear =
                new Date().getFullYear();


            const count =
                students.filter(student => {

                    if (!student.admissionDate) {
                        return false;
                    }

                    const date =
                        new Date(
                            student.admissionDate
                        );

                    return (
                        date.getMonth() ===
                        currentMonth &&
                        date.getFullYear() ===
                        currentYear
                    );

                }).length;


            newAdmissions.textContent =
                count;

        }

    }


    /* =========================================
       SEARCH
       ========================================= */

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            renderStudents
        );

    }


    /* =========================================
       CLASS FILTER
       ========================================= */

    if (classFilter) {

        classFilter.addEventListener(
            "change",
            renderStudents
        );

    }


    /* =========================================
       ADD STUDENT
       ========================================= */

    function openAdmission() {

        window.location.href =
            "add-student.html";

    }


    if (addStudentBtn) {

        addStudentBtn.addEventListener(
            "click",
            openAdmission
        );

    }


    if (emptyAddBtn) {

        emptyAddBtn.addEventListener(
            "click",
            openAdmission
        );

    }


    /* =========================================
       VIEW STUDENT
       ========================================= */

    function attachViewButtons() {

        const buttons =
            document.querySelectorAll(
                ".student-view-btn"
            );


        buttons.forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        button.dataset.id;

                    const students =
                        getStudents();

                    const student =
                        students.find(
                            item =>
                                item.id === id
                        );


                    if (!student) {

                        alert(
                            "Student record not found."
                        );

                        return;

                    }


                    const message = [

                        `Student ID: ${student.id}`,

                        `Name: ${student.name}`,

                        `Class: ${student.className} - ${student.section}`,

                        `Gender: ${student.gender}`,

                        `Father: ${student.fatherName}`,

                        `Parent Mobile: ${student.parentPhone}`,

                        `Admission Date: ${formatDate(student.admissionDate)}`,

                        `Status: ${student.status}`

                    ].join("\n");


                    alert(message);

                }
            );

        });

    }


    /* =========================================
       EXPORT CSV
       ========================================= */

    if (exportBtn) {

        exportBtn.addEventListener(
            "click",
            exportStudents
        );

    }


    function exportStudents() {

        const students =
            getStudents();


        if (students.length === 0) {

            alert(
                "There are no student records to export."
            );

            return;

        }


        const headers = [

            "Student ID",

            "Student Name",

            "Date of Birth",

            "Gender",

            "Blood Group",

            "Student Phone",

            "Address",

            "Father Name",

            "Mother Name",

            "Parent Phone",

            "Parent Email",

            "Occupation",

            "Emergency Contact",

            "Class",

            "Section",

            "Session",

            "Previous School",

            "Admission Date",

            "Status"

        ];


        const rows =
            students.map(student => [

                student.id,

                student.name,

                student.dob,

                student.gender,

                student.bloodGroup,

                student.studentPhone,

                student.address,

                student.fatherName,

                student.motherName,

                student.parentPhone,

                student.parentEmail,

                student.occupation,

                student.emergencyContact,

                student.className,

                student.section,

                student.session,

                student.previousSchool,

                student.admissionDate,

                student.status

            ]);


        const csvRows = [

            headers,

            ...rows

        ];


        const csv =
            csvRows
                .map(row =>
                    row
                        .map(value =>
                            `"${String(
                                value ?? ""
                            ).replace(
                                /"/g,
                                '""'
                            )}"`
                        )
                        .join(",")
                )
                .join("\n");


        const blob =
            new Blob(
                [csv],
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
            "smartschool_students.csv";


        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);

    }


    /* =========================================
       HELPERS
       ========================================= */

    function formatDate(dateString) {

        if (!dateString) {
            return "-";
        }


        const date =
            new Date(dateString);


        if (Number.isNaN(date.getTime())) {
            return dateString;
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


    function getInitials(name) {

        if (!name) {
            return "ST";
        }


        const parts =
            name
                .trim()
                .split(/\s+/);


        if (parts.length === 1) {

            return parts[0]
                .substring(0, 2)
                .toUpperCase();

        }


        return (
            parts[0][0] +
            parts[parts.length - 1][0]
        ).toUpperCase();

    }


    function getStatusClass(status) {

        if (
            String(status).toLowerCase() ===
            "active"
        ) {

            return "status-active";

        }


        return "status-pending";

    }


    function escapeHTML(value) {

        return String(
            value ?? ""
        )
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* =========================================
       EXTRA TABLE STYLES
       ========================================= */

    const style =
        document.createElement("style");


    style.textContent = `

        .student-table-user {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .student-mini-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #eef2ff;
            color: #4f46e5;
            font-size: 12px;
            font-weight: 800;
        }

        .student-table-user strong {
            display: block;
        }

        .student-table-user small {
            display: block;
            margin-top: 2px;
            color: #94a3b8;
            font-size: 11px;
        }

        .status-badge {
            display: inline-flex;
            align-items: center;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
        }

        .status-active {
            background: #dcfce7;
            color: #15803d;
        }

        .status-pending {
            background: #fef3c7;
            color: #b45309;
        }

        .student-view-btn {
            border: 1px solid #e2e8f0;
            background: #ffffff;
            color: #4f46e5;
            padding: 7px 12px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 700;
            font-size: 12px;
        }

        .student-view-btn:hover {
            background: #eef2ff;
        }

        .empty-state {
            display: none;
            padding: 50px 20px;
            text-align: center;
        }

        .empty-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }

        .empty-state h3 {
            margin: 0 0 8px;
        }

        .empty-state p {
            color: #64748b;
            margin-bottom: 20px;
        }

    `;


    document.head.appendChild(style);


    /* =========================================
       INITIALIZE
       ========================================= */

    renderStudents();


    console.log(
        "SmartSchool360 Student Management loaded."
    );

});
