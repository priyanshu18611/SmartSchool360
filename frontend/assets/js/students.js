document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = "smartschool_students";

    const studentTableBody = document.getElementById("studentTableBody");
    const searchInput = document.getElementById("studentSearch");
    const classFilter = document.getElementById("classFilter");
    const statusFilter = document.getElementById("statusFilter");
    const exportButton = document.getElementById("exportStudentsBtn");

    let students = [];

    // ----------------------------------------
    // Load Students from Local Storage
    // ----------------------------------------
    function loadStudents() {
        try {
            const savedStudents = localStorage.getItem(STORAGE_KEY);

            students = savedStudents
                ? JSON.parse(savedStudents)
                : [];

            if (!Array.isArray(students)) {
                students = [];
            }
        } catch (error) {
            console.error("Error loading students:", error);
            students = [];
        }

        renderStudents();
        updateStudentStats();
    }

    // ----------------------------------------
    // Get Student ID
    // ----------------------------------------
    function getStudentId(student) {
        return (
            student.id ||
            student.studentId ||
            student.admissionId ||
            "N/A"
        );
    }

    // ----------------------------------------
    // Get Student Name
    // ----------------------------------------
    function getStudentName(student) {
        return (
            student.name ||
            student.fullName ||
            student.studentName ||
            "Unnamed Student"
        );
    }

    // ----------------------------------------
    // Get Class
    // ----------------------------------------
    function getStudentClass(student) {
        return (
            student.class ||
            student.className ||
            student.standard ||
            "N/A"
        );
    }

    // ----------------------------------------
    // Get Section
    // ----------------------------------------
    function getStudentSection(student) {
        return (
            student.section ||
            student.classSection ||
            "-"
        );
    }

    // ----------------------------------------
    // Get Gender
    // ----------------------------------------
    function getStudentGender(student) {
        return student.gender || "-";
    }

    // ----------------------------------------
    // Get Parent / Guardian
    // ----------------------------------------
    function getParentName(student) {
        return (
            student.fatherName ||
            student.father ||
            student.parentName ||
            student.guardianName ||
            "-"
        );
    }

    // ----------------------------------------
    // Get Status
    // ----------------------------------------
    function getStudentStatus(student) {
        return student.status || "Active";
    }

    // ----------------------------------------
    // Get Date
    // ----------------------------------------
    function getAdmissionDate(student) {
        return (
            student.admissionDate ||
            student.dateOfAdmission ||
            ""
        );
    }

    // ----------------------------------------
    // Format Date
    // ----------------------------------------
    function formatDate(dateValue) {
        if (!dateValue) {
            return "-";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return dateValue;
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    // ----------------------------------------
    // Escape HTML
    // ----------------------------------------
    function escapeHTML(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ----------------------------------------
    // Get Initials
    // ----------------------------------------
    function getInitials(name) {
        if (!name) {
            return "ST";
        }

        const words = name
            .trim()
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

    // ----------------------------------------
    // Render Students
    // ----------------------------------------
    function renderStudents() {
        if (!studentTableBody) {
            return;
        }

        const searchValue = searchInput
            ? searchInput.value.toLowerCase().trim()
            : "";

        const selectedClass = classFilter
            ? classFilter.value
            : "";

        const selectedStatus = statusFilter
            ? statusFilter.value
            : "";

        const filteredStudents = students.filter(student => {
            const name = getStudentName(student).toLowerCase();
            const id = getStudentId(student).toLowerCase();
            const studentClass = getStudentClass(student).toLowerCase();
            const parent = getParentName(student).toLowerCase();

            const studentStatus =
                getStudentStatus(student).toLowerCase();

            const matchesSearch =
                !searchValue ||
                name.includes(searchValue) ||
                id.includes(searchValue) ||
                studentClass.includes(searchValue) ||
                parent.includes(searchValue);

            const matchesClass =
                !selectedClass ||
                studentClass === selectedClass.toLowerCase();

            const matchesStatus =
                !selectedStatus ||
                studentStatus === selectedStatus.toLowerCase();

            return (
                matchesSearch &&
                matchesClass &&
                matchesStatus
            );
        });

        // ----------------------------------------
        // Empty State
        // ----------------------------------------
        if (filteredStudents.length === 0) {
            studentTableBody.innerHTML = `
                <tr>
                    <td colspan="100%" style="text-align:center;padding:50px 20px;">
                        <div style="
                            display:flex;
                            flex-direction:column;
                            align-items:center;
                            gap:10px;
                        ">
                            <div style="
                                width:60px;
                                height:60px;
                                border-radius:50%;
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                background:#eef2ff;
                                font-size:28px;
                            ">
                                👨‍🎓
                            </div>

                            <strong style="font-size:16px;">
                                No students found
                            </strong>

                            <span style="color:#6b7280;font-size:14px;">
                                Try changing your search or filter.
                            </span>
                        </div>
                    </td>
                </tr>
            `;

            return;
        }

        // ----------------------------------------
        // Student Rows
        // ----------------------------------------
        studentTableBody.innerHTML = filteredStudents
            .map(student => {
                const id = getStudentId(student);
                const name = getStudentName(student);
                const studentClass = getStudentClass(student);
                const section = getStudentSection(student);
                const gender = getStudentGender(student);
                const parent = getParentName(student);
                const status = getStudentStatus(student);
                const admissionDate = getAdmissionDate(student);

                const statusClass =
                    String(status).toLowerCase() === "active"
                        ? "active"
                        : "inactive";

                return `
                    <tr>
                        <td>
                            <div class="student-cell">
                                <div class="student-avatar">
                                    ${escapeHTML(getInitials(name))}
                                </div>

                                <div>
                                    <strong>
                                        ${escapeHTML(name)}
                                    </strong>

                                    <small>
                                        ${escapeHTML(id)}
                                    </small>
                                </div>
                            </div>
                        </td>

                        <td>
                            ${escapeHTML(studentClass)}
                        </td>

                        <td>
                            ${escapeHTML(section)}
                        </td>

                        <td>
                            ${escapeHTML(gender)}
                        </td>

                        <td>
                            ${escapeHTML(parent)}
                        </td>

                        <td>
                            ${escapeHTML(formatDate(admissionDate))}
                        </td>

                        <td>
                            <span class="status-badge ${statusClass}">
                                ${escapeHTML(status)}
                            </span>
                        </td>

                        <td>
                            <div class="student-actions">
                                <button
                                    type="button"
                                    class="action-btn view-btn"
                                    data-id="${escapeHTML(id)}"
                                    title="View Student"
                                >
                                    👁️ View
                                </button>

                                <button
                                    type="button"
                                    class="action-btn edit-btn"
                                    data-id="${escapeHTML(id)}"
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

    // ----------------------------------------
    // View + Edit Events
    // ----------------------------------------
    function attachActionEvents() {
        const viewButtons =
            document.querySelectorAll(".view-btn");

        viewButtons.forEach(button => {
            button.addEventListener("click", () => {
                const studentId =
                    button.getAttribute("data-id");

                if (!studentId) {
                    alert("Student ID not found.");
                    return;
                }

                window.location.href =
                    `student-profile.html?id=${encodeURIComponent(studentId)}`;
            });
        });

        const editButtons =
            document.querySelectorAll(".edit-btn");

        editButtons.forEach(button => {
            button.addEventListener("click", () => {
                alert(
                    "Edit Student module will be connected in the next update."
                );
            });
        });
    }

    // ----------------------------------------
    // Search
    // ----------------------------------------
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            renderStudents();
        });
    }

    // ----------------------------------------
    // Class Filter
    // ----------------------------------------
    if (classFilter) {
        classFilter.addEventListener("change", () => {
            renderStudents();
        });
    }

    // ----------------------------------------
    // Status Filter
    // ----------------------------------------
    if (statusFilter) {
        statusFilter.addEventListener("change", () => {
            renderStudents();
        });
    }

    // ----------------------------------------
    // Student Statistics
    // ----------------------------------------
    function updateStudentStats() {
        const totalElement =
            document.getElementById("totalStudents");

        const activeElement =
            document.getElementById("activeStudents");

        const inactiveElement =
            document.getElementById("inactiveStudents");

        const totalStudents = students.length;

        const activeStudents = students.filter(student => {
            return (
                String(getStudentStatus(student))
                    .toLowerCase() === "active"
            );
        }).length;

        const inactiveStudents =
            totalStudents - activeStudents;

        if (totalElement) {
            totalElement.textContent = totalStudents;
        }

        if (activeElement) {
            activeElement.textContent = activeStudents;
        }

        if (inactiveElement) {
            inactiveElement.textContent = inactiveStudents;
        }
    }

    // ----------------------------------------
    // Export CSV
    // ----------------------------------------
    if (exportButton) {
        exportButton.addEventListener("click", () => {
            if (students.length === 0) {
                alert("There are no students to export.");
                return;
            }

            const headers = [
                "Student ID",
                "Student Name",
                "Class",
                "Section",
                "Gender",
                "Parent/Guardian",
                "Admission Date",
                "Status"
            ];

            const rows = students.map(student => [
                getStudentId(student),
                getStudentName(student),
                getStudentClass(student),
                getStudentSection(student),
                getStudentGender(student),
                getParentName(student),
                formatDate(getAdmissionDate(student)),
                getStudentStatus(student)
            ]);

            const csvContent = [
                headers,
                ...rows
            ]
                .map(row =>
                    row
                        .map(value =>
                            `"${String(value)
                                .replace(/"/g, '""')}"`
                        )
                        .join(",")
                )
                .join("\n");

            const blob = new Blob(
                [csvContent],
                {
                    type: "text/csv;charset=utf-8;"
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
        });
    }

    // ----------------------------------------
    // Initial Load
    // ----------------------------------------
    loadStudents();
});
