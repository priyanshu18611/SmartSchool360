/* =========================================================
   SMARTSCHOOL360
   STUDENT MANAGEMENT MODULE
   ========================================================= */

"use strict";

document.addEventListener("DOMContentLoaded", function () {

    const STORAGE_KEY = "smartschool_students";

    /* =====================================================
       DOM
    ===================================================== */

    const tableBody = document.getElementById("studentsTableBody");
    const emptyState = document.getElementById("emptyState");

    const searchInput = document.getElementById("studentSearch");
    const classFilter = document.getElementById("classFilter");

    const totalStudents = document.getElementById("totalStudents");
    const activeStudents = document.getElementById("activeStudents");
    const classCount = document.getElementById("classCount");
    const newAdmissions = document.getElementById("newAdmissions");

    const addStudentBtn = document.getElementById("addStudentBtn");
    const emptyAddBtn = document.getElementById("emptyAddBtn");

    const exportButton =
        document.getElementById("exportStudents");


    /* =====================================================
       STUDENTS
    ===================================================== */

    let students = [];


    /* =====================================================
       LOAD STUDENTS
    ===================================================== */

    function loadStudents() {

        try {

            const raw =
                localStorage.getItem(STORAGE_KEY);

            if (!raw) {

                students = [];

            } else {

                const data = JSON.parse(raw);

                students =
                    Array.isArray(data)
                        ? data
                        : [];

            }

        } catch (error) {

            console.error(
                "SmartSchool360 student data error:",
                error
            );

            students = [];
        }


        console.log(
            "SmartSchool360 students:",
            students
        );

        updateStats();

        renderStudents();
    }


    /* =====================================================
       VALUE HELPERS
    ===================================================== */

    function value(value, fallback = "N/A") {

        if (
            value === undefined ||
            value === null ||
            String(value).trim() === ""
        ) {

            return fallback;
        }

        return String(value).trim();
    }


    function studentId(student) {

        return value(
            student.id,
            "N/A"
        );
    }


    function studentName(student) {

        return value(
            student.name,
            "Unnamed Student"
        );
    }


    function studentClass(student) {

        return value(
            student.className,
            "N/A"
        );
    }


    function studentSection(student) {

        return value(
            student.section,
            "N/A"
        );
    }


    function parentName(student) {

        return value(
            student.fatherName,
            "N/A"
        );
    }


    function parentPhone(student) {

        return value(
            student.parentPhone,
            "N/A"
        );
    }


    function admissionDate(student) {

        return value(
            student.admissionDate,
            ""
        );
    }


    function status(student) {

        return value(
            student.status,
            "Active"
        );
    }


    /* =====================================================
       DATE FORMAT
    ===================================================== */

    function formatDate(dateValue) {

        if (!dateValue) {
            return "N/A";
        }

        const date =
            new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return dateValue;
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
       INITIALS
    ===================================================== */

    function getInitials(name) {

        const clean =
            value(name, "Student");

        const parts =
            clean
                .split(/\s+/)
                .filter(Boolean);


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


    /* =====================================================
       HTML ESCAPE
    ===================================================== */

    function escapeHTML(text) {

        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =====================================================
       UPDATE STATS
    ===================================================== */

    function updateStats() {

        const total =
            students.length;


        const active =
            students.filter(function (student) {

                return status(student)
                    .toLowerCase() === "active";

            }).length;


        const uniqueClasses =
            new Set();


        students.forEach(function (student) {

            const cls =
                studentClass(student);

            if (
                cls !== "N/A" &&
                cls !== ""
            ) {

                uniqueClasses.add(
                    cls.toLowerCase()
                );
            }

        });


        let newCount = 0;

        const today = new Date();

        students.forEach(function (student) {

            const date =
                admissionDate(student);

            if (!date) {
                return;
            }

            const admission =
                new Date(date);

            if (Number.isNaN(admission.getTime())) {
                return;
            }

            const difference =
                today.getTime() -
                admission.getTime();

            const days =
                difference /
                (1000 * 60 * 60 * 24);

            if (
                days >= 0 &&
                days <= 30
            ) {

                newCount++;
            }

        });


        if (totalStudents) {
            totalStudents.textContent =
                total;
        }


        if (activeStudents) {
            activeStudents.textContent =
                active;
        }


        if (classCount) {
            classCount.textContent =
                uniqueClasses.size;
        }


        if (newAdmissions) {
            newAdmissions.textContent =
                newCount;
        }
    }


    /* =====================================================
       RENDER
    ===================================================== */

    function renderStudents() {

        if (!tableBody) {

            console.error(
                "studentsTableBody not found"
            );

            return;
        }


        const search =
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


        const filtered =
            students.filter(function (student) {

                const id =
                    studentId(student)
                        .toLowerCase();

                const name =
                    studentName(student)
                        .toLowerCase();

                const cls =
                    studentClass(student)
                        .toLowerCase();

                const section =
                    studentSection(student)
                        .toLowerCase();

                const father =
                    parentName(student)
                        .toLowerCase();

                const phone =
                    parentPhone(student)
                        .toLowerCase();


                const matchesSearch =
                    !search ||
                    id.includes(search) ||
                    name.includes(search) ||
                    cls.includes(search) ||
                    section.includes(search) ||
                    father.includes(search) ||
                    phone.includes(search);


                const matchesClass =
                    !selectedClass ||
                    cls === selectedClass;


                return (
                    matchesSearch &&
                    matchesClass
                );
            });


        /* =================================================
           NO STUDENTS
        ================================================= */

        if (filtered.length === 0) {

            tableBody.innerHTML = "";


            if (emptyState) {

                emptyState.style.display =
                    "block";

            }

            return;
        }


        /* =================================================
           STUDENTS FOUND
        ================================================= */

        if (emptyState) {

            emptyState.style.display =
                "none";
        }


        tableBody.innerHTML =
            filtered.map(function (student) {

                const id =
                    studentId(student);

                const name =
                    studentName(student);

                const cls =
                    studentClass(student);

                const section =
                    studentSection(student);

                const father =
                    parentName(student);

                const phone =
                    parentPhone(student);

                const date =
                    admissionDate(student);

                const currentStatus =
                    status(student);


                const isActive =
                    currentStatus
                        .toLowerCase() === "active";


                const statusClass =
                    isActive
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
                            ${escapeHTML(cls)}
                        </td>


                        <!-- SECTION -->

                        <td>
                            ${escapeHTML(section)}
                        </td>


                        <!-- PARENT -->

                        <td>

                            <strong>
                                ${escapeHTML(father)}
                            </strong>

                            <br>

                            <small>
                                ${escapeHTML(phone)}
                            </small>

                        </td>


                        <!-- ADMISSION DATE -->

                        <td>
                            ${escapeHTML(
                                formatDate(date)
                            )}
                        </td>


                        <!-- STATUS -->

                        <td>

                            <span
                                class="status-badge ${statusClass}"
                            >
                                ${escapeHTML(
                                    currentStatus
                                )}
                            </span>

                        </td>


                        <!-- ACTION -->

                        <td>

                            <div
                                style="
                                    display:flex;
                                    gap:6px;
                                    flex-wrap:wrap;
                                "
                            >

                                <button
                                    type="button"
                                    class="action-btn view-student-btn"
                                    data-id="${escapeHTML(id)}"
                                >
                                    👁️ View
                                </button>


                                <button
                                    type="button"
                                    class="action-btn edit-student-btn"
                                    data-id="${escapeHTML(id)}"
                                >
                                    ✏️ Edit
                                </button>

                            </div>

                        </td>

                    </tr>

                `;

            }).join("");


        attachButtons();
    }


    /* =====================================================
       BUTTON EVENTS
    ===================================================== */

    function attachButtons() {

        const viewButtons =
            document.querySelectorAll(
                ".view-student-btn"
            );


        viewButtons.forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const id =
                        button.dataset.id;


                    if (!id) {

                        alert(
                            "Student ID not found."
                        );

                        return;
                    }


                    console.log(
                        "Opening student profile:",
                        id
                    );


                    window.location.href =
                        "student-profile.html?id=" +
                        encodeURIComponent(id);
                }
            );

        });


        const editButtons =
            document.querySelectorAll(
                ".edit-student-btn"
            );


        editButtons.forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    alert(
                        "Edit Student module will be connected in the next step."
                    );

                }
            );

        });

    }


    /* =====================================================
       SEARCH
    ===================================================== */

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            renderStudents
        );

    }


    /* =====================================================
       CLASS FILTER
    ===================================================== */

    if (classFilter) {

        classFilter.addEventListener(
            "change",
            renderStudents
        );

    }


    /* =====================================================
       ADD STUDENT
    ===================================================== */

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


    /* =====================================================
       EXPORT
    ===================================================== */

    if (exportButton) {

        exportButton.addEventListener(
            "click",
            function () {

                if (students.length === 0) {

                    alert(
                        "No students available to export."
                    );

                    return;
                }


                const headers = [
                    "Student ID",
                    "Student Name",
                    "Class",
                    "Section",
                    "Father Name",
                    "Parent Phone",
                    "Admission Date",
                    "Status"
                ];


                const rows =
                    students.map(function (student) {

                        return [

                            studentId(student),

                            studentName(student),

                            studentClass(student),

                            studentSection(student),

                            parentName(student),

                            parentPhone(student),

                            formatDate(
                                admissionDate(student)
                            ),

                            status(student)

                        ];

                    });


                const csv =
                    [
                        headers,
                        ...rows
                    ]
                    .map(function (row) {

                        return row
                            .map(function (cell) {

                                return '"' +
                                    String(cell)
                                        .replace(
                                            /"/g,
                                            '""'
                                        ) +
                                    '"';

                            })
                            .join(",");

                    })
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
                    "SmartSchool360_Students.csv";


                document.body.appendChild(link);

                link.click();

                document.body.removeChild(link);

                URL.revokeObjectURL(url);

            }
        );

    }


    /* =====================================================
       START
    ===================================================== */

    loadStudents();


    console.log(
        "SmartSchool360 Student Management loaded successfully."
    );

});
