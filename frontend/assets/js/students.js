/* =========================================================
   SMARTSCHOOL360
   STUDENT MANAGEMENT JAVASCRIPT
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const searchInput =
        document.querySelector(".search-box input");

    const classFilter =
        document.getElementById("classFilter");

    const studentsTable =
        document.getElementById("studentsTable");

    const addStudentBtn =
        document.getElementById("addStudentBtn");

    const exportStudents =
        document.getElementById("exportStudents");

    const menuBtn =
        document.querySelector(".menu-btn");

    const sidebar =
        document.querySelector(".sidebar");


    /* =====================================================
       MOBILE SIDEBAR
    ===================================================== */

    if (menuBtn && sidebar) {

        menuBtn.addEventListener("click", () => {

            sidebar.classList.toggle("mobile-open");

        });

    }


    /* =====================================================
       STUDENT SEARCH
    ===================================================== */

    function filterStudents() {

        const searchValue =
            searchInput
                ? searchInput.value
                    .trim()
                    .toLowerCase()
                : "";

        const selectedClass =
            classFilter
                ? classFilter.value
                : "all";


        const rows =
            studentsTable
                ? studentsTable.querySelectorAll("tbody tr")
                : [];


        rows.forEach((row) => {

            const rowText =
                row.innerText.toLowerCase();

            const classCell =
                row.children[2]
                    ? row.children[2].innerText
                    : "";


            const matchesSearch =
                rowText.includes(searchValue);


            const matchesClass =
                selectedClass === "all" ||
                classCell.includes(
                    `Class ${selectedClass}`
                );


            if (
                matchesSearch &&
                matchesClass
            ) {

                row.style.display = "";

            } else {

                row.style.display = "none";

            }

        });

    }


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            filterStudents
        );

    }


    if (classFilter) {

        classFilter.addEventListener(
            "change",
            filterStudents
        );

    }


    /* =====================================================
       ADD STUDENT
    ===================================================== */

    if (addStudentBtn) {

        addStudentBtn.addEventListener(
            "click",
            () => {

                alert(
                    "Student Admission module is coming next."
                );

            }
        );

    }


    /* =====================================================
       EXPORT STUDENTS
    ===================================================== */

    if (exportStudents) {

        exportStudents.addEventListener(
            "click",
            () => {

                const rows =
                    studentsTable
                        ? studentsTable.querySelectorAll(
                            "tr"
                        )
                        : [];


                let csv = "";


                rows.forEach((row) => {

                    const columns =
                        row.querySelectorAll(
                            "th, td"
                        );


                    const values =
                        Array.from(columns)
                            .map(
                                (column) =>
                                    `"${column.innerText
                                        .replace(
                                            /"/g,
                                            '""'
                                        )
                                        .replace(
                                            /\n/g,
                                            " "
                                        )}"`
                            );


                    csv +=
                        values.join(",") +
                        "\n";

                });


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
                    "smartschool-students.csv";


                document.body.appendChild(link);

                link.click();

                document.body.removeChild(link);

                URL.revokeObjectURL(url);

            }
        );

    }


    /* =====================================================
       STUDENT VIEW BUTTONS
    ===================================================== */

    const viewButtons =
        document.querySelectorAll(
            "#studentsTable .more-btn"
        );


    viewButtons.forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                const row =
                    button.closest("tr");


                if (!row) {
                    return;
                }


                const studentName =
                    row.querySelector(
                        ".student-cell strong"
                    )?.innerText ||
                    "Student";


                const studentId =
                    row.children[1]?.innerText ||
                    "N/A";


                alert(
                    `Student Profile\n\n` +
                    `Name: ${studentName}\n` +
                    `Student ID: ${studentId}\n\n` +
                    `Full profile module will be connected with the database.`
                );

            }
        );

    });


    /* =====================================================
       CTRL + K SEARCH
    ===================================================== */

    document.addEventListener(
        "keydown",
        (event) => {

            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "k"
            ) {

                event.preventDefault();

                if (searchInput) {

                    searchInput.focus();

                }

            }

        }
    );


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    console.log(
        "SmartSchool360 Student Management initialized."
    );

});
