/* =========================================================
   SMARTSCHOOL360
   STUDENT PROFILE MODULE
   VIEW • EDIT • PRINT • DELETE
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       STORAGE
       ===================================================== */

    const STORAGE_KEY =
        "smartschool_students";


    /* =====================================================
       GET STUDENT ID FROM URL
       ===================================================== */

    const params =
        new URLSearchParams(
            window.location.search
        );

    const studentId =
        params.get("id");


    /* =====================================================
       BASIC ELEMENTS
       ===================================================== */

    const editButton =
        document.getElementById("editStudent");

    const printButton =
        document.getElementById("printStudent");


    /* =====================================================
       READ STUDENTS
       ===================================================== */

    let students = [];

    try {

        students =
            JSON.parse(
                localStorage.getItem(
                    STORAGE_KEY
                )
            ) || [];

    } catch (error) {

        console.error(
            "Unable to read student records:",
            error
        );

        students = [];
    }


    /* =====================================================
       FIND CURRENT STUDENT
       ===================================================== */

    const student =
        students.find(
            item =>
                String(item.id) ===
                String(studentId)
        );


    /* =====================================================
       STUDENT NOT FOUND
       ===================================================== */

    if (!student) {

        showStudentNotFound();

        return;
    }


    /* =====================================================
       POPULATE PROFILE
       ===================================================== */

    populateProfile(student);


    /* =====================================================
       EDIT BUTTON
       ===================================================== */

    if (editButton) {

        editButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "add-student.html?id=" +
                    encodeURIComponent(
                        student.id
                    );

            }
        );

    }


    /* =====================================================
       PRINT BUTTON
       ===================================================== */

    if (printButton) {

        printButton.addEventListener(
            "click",
            () => {

                window.print();

            }
        );

    }


    /* =====================================================
       CREATE DELETE BUTTON
       ===================================================== */

    createDeleteButton(student);


    /* =====================================================
       BACK BUTTONS
       ===================================================== */

    setupBackButtons();


    /* =====================================================
       PAGE TITLE
       ===================================================== */

    document.title =
        `${student.name || "Student"} | SmartSchool360`;


    /* =====================================================
       PROFILE POPULATION
       ===================================================== */

    function populateProfile(data) {

        /* -------------------------------------------------
           BASIC
           ------------------------------------------------- */

        setText(
            "profileStudentName",
            data.name
        );

        setText(
            "profileStudentId",
            data.id
        );


        /* -------------------------------------------------
           AVATAR
           ------------------------------------------------- */

        const avatar =
            document.getElementById(
                "profileAvatar"
            );

        if (avatar) {

            avatar.textContent =
                getInitials(
                    data.name
                );

        }


        /* -------------------------------------------------
           PERSONAL INFORMATION
           ------------------------------------------------- */

        setText(
            "profileName",
            data.name
        );

        setText(
            "profileDob",
            formatDate(data.dob)
        );

        setText(
            "profileGender",
            data.gender
        );

        setText(
            "profileBloodGroup",
            data.bloodGroup
        );

        setText(
            "profileStudentPhone",
            data.studentPhone
        );

        setText(
            "profileAddress",
            data.address
        );


        /* -------------------------------------------------
           PARENT INFORMATION
           ------------------------------------------------- */

        setText(
            "profileFatherName",
            data.fatherName
        );

        setText(
            "profileMotherName",
            data.motherName
        );

        setText(
            "profileParentPhone",
            data.parentPhone
        );

        setText(
            "profileParentEmail",
            data.parentEmail
        );

        setText(
            "profileOccupation",
            data.occupation
        );

        setText(
            "profileEmergencyContact",
            data.emergencyContact
        );


        /* -------------------------------------------------
           ACADEMIC INFORMATION
           ------------------------------------------------- */

        setText(
            "profileClass",
            data.className
        );

        setText(
            "profileSection",
            data.section
        );

        setText(
            "profileSession",
            data.session
        );

        setText(
            "profilePreviousSchool",
            data.previousSchool
        );


        /* -------------------------------------------------
           ADMISSION INFORMATION
           ------------------------------------------------- */

        setText(
            "profileAdmissionDate",
            formatDate(
                data.admissionDate
            )
        );

        setText(
            "profileCreatedAt",
            formatDateTime(
                data.createdAt
            )
        );

        setText(
            "profileUpdatedAt",
            formatDateTime(
                data.updatedAt
            )
        );


        /* -------------------------------------------------
           STATUS
           ------------------------------------------------- */

        setStatus(
            data.status
        );


        /* -------------------------------------------------
           QUICK STATS
           ------------------------------------------------- */

        setText(
            "profileStatClass",
            data.className
        );

        setText(
            "profileStatSection",
            data.section
        );

        setText(
            "profileStatSession",
            data.session
        );

        setText(
            "profileStatStatus",
            data.status
        );


        /* -------------------------------------------------
           OPTIONAL CONTACT LINKS
           ------------------------------------------------- */

        setupContactLinks(data);

    }


    /* =====================================================
       CREATE DELETE BUTTON
       ===================================================== */

    function createDeleteButton(data) {

        /*
         * Try to find existing action area.
         */

        let actionArea =
            document.querySelector(
                ".profile-actions"
            );


        /*
         * If not available, try action bar.
         */

        if (!actionArea) {

            actionArea =
                document.querySelector(
                    ".profile-action-bar"
                );

        }


        if (!actionArea) {

            console.warn(
                "Profile action area not found."
            );

            return;
        }


        /*
         * Prevent duplicate button.
         */

        if (
            document.getElementById(
                "deleteStudent"
            )
        ) {

            return;
        }


        /*
         * Create button.
         */

        const deleteButton =
            document.createElement(
                "button"
            );


        deleteButton.type =
            "button";


        deleteButton.id =
            "deleteStudent";


        deleteButton.className =
            "profile-action-btn delete-btn";


        deleteButton.innerHTML =
            "🗑 Delete";


        deleteButton.setAttribute(
            "aria-label",
            "Delete student"
        );


        /*
         * Add button.
         */

        actionArea.appendChild(
            deleteButton
        );


        /*
         * Delete click.
         */

        deleteButton.addEventListener(
            "click",
            () => {

                openDeleteModal(data);

            }
        );

    }


    /* =====================================================
       DELETE CONFIRMATION MODAL
       ===================================================== */

    function openDeleteModal(data) {

        /*
         * Remove old modal if it exists.
         */

        const oldModal =
            document.getElementById(
                "deleteStudentModal"
            );

        if (oldModal) {

            oldModal.remove();

        }


        /*
         * Create modal.
         */

        const modal =
            document.createElement(
                "div"
            );


        modal.id =
            "deleteStudentModal";


        modal.className =
            "student-delete-modal";


        modal.innerHTML = `

            <div class="student-delete-backdrop"></div>

            <div
                class="student-delete-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="deleteModalTitle"
            >

                <div class="student-delete-icon">
                    🗑️
                </div>

                <h2 id="deleteModalTitle">
                    Delete Student?
                </h2>

                <p>
                    Are you sure you want to delete
                    <strong>
                        ${escapeHtml(
                            data.name || "this student"
                        )}
                    </strong>
                    from SmartSchool360?
                </p>

                <div class="student-delete-info">

                    <span>
                        Student ID
                    </span>

                    <strong>
                        ${escapeHtml(
                            data.id || "-"
                        )}
                    </strong>

                </div>

                <div class="student-delete-warning">

                    ⚠ This action cannot be undone.

                </div>

                <div class="student-delete-actions">

                    <button
                        type="button"
                        class="student-delete-cancel"
                        id="cancelDeleteStudent"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        class="student-delete-confirm"
                        id="confirmDeleteStudent"
                    >
                        Yes, Delete Student
                    </button>

                </div>

            </div>

        `;


        document.body.appendChild(
            modal
        );


        /*
         * Small delay for animation.
         */

        requestAnimationFrame(() => {

            modal.classList.add(
                "show"
            );

        });


        /*
         * Cancel.
         */

        const cancelButton =
            document.getElementById(
                "cancelDeleteStudent"
            );


        if (cancelButton) {

            cancelButton.addEventListener(
                "click",
                closeDeleteModal
            );

        }


        /*
         * Backdrop click.
         */

        const backdrop =
            modal.querySelector(
                ".student-delete-backdrop"
            );


        if (backdrop) {

            backdrop.addEventListener(
                "click",
                closeDeleteModal
            );

        }


        /*
         * Confirm.
         */

        const confirmButton =
            document.getElementById(
                "confirmDeleteStudent"
            );


        if (confirmButton) {

            confirmButton.addEventListener(
                "click",
                () => {

                    deleteStudent(
                        data.id
                    );

                }
            );

        }


        /*
         * Escape key.
         */

        document.addEventListener(
            "keydown",
            handleEscape
        );

    }


    /* =====================================================
       CLOSE DELETE MODAL
       ===================================================== */

    function closeDeleteModal() {

        const modal =
            document.getElementById(
                "deleteStudentModal"
            );


        if (!modal) {

            return;
        }


        modal.classList.remove(
            "show"
        );


        setTimeout(
            () => {

                modal.remove();

            },
            220
        );


        document.removeEventListener(
            "keydown",
            handleEscape
        );

    }


    /* =====================================================
       ESCAPE KEY
       ===================================================== */

    function handleEscape(event) {

        if (
            event.key ===
            "Escape"
        ) {

            closeDeleteModal();

        }

    }


    /* =====================================================
       DELETE STUDENT
       ===================================================== */

    function deleteStudent(id) {

        let currentStudents = [];


        try {

            currentStudents =
                JSON.parse(
                    localStorage.getItem(
                        STORAGE_KEY
                    )
                ) || [];

        } catch (error) {

            console.error(
                "Unable to read student records:",
                error
            );

            showToast(
                "Unable to delete student.",
                "error"
            );

            return;
        }


        const updatedStudents =
            currentStudents.filter(
                item =>
                    String(item.id) !==
                    String(id)
            );


        /*
         * Verify that a student was actually removed.
         */

        if (
            updatedStudents.length ===
            currentStudents.length
        ) {

            showToast(
                "Student record was not found.",
                "error"
            );

            return;
        }


        /*
         * Save updated records.
         */

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                updatedStudents
            )
        );


        /*
         * Close modal.
         */

        closeDeleteModal();


        /*
         * Success notification.
         */

        showToast(
            "Student deleted successfully.",
            "success"
        );


        /*
         * Redirect to student directory.
         */

        setTimeout(
            () => {

                window.location.href =
                    "students.html";

            },
            900
        );

    }


    /* =====================================================
       STATUS
       ===================================================== */

    function setStatus(status) {

        const elements =
            document.querySelectorAll(
                "[data-profile-status]"
            );


        elements.forEach(
            element => {

                element.textContent =
                    status || "Active";

                element.classList.remove(
                    "active",
                    "inactive"
                );


                if (
                    String(status)
                        .toLowerCase() ===
                    "active"
                ) {

                    element.classList.add(
                        "active"
                    );

                } else {

                    element.classList.add(
                        "inactive"
                    );

                }

            }
        );


        /*
         * Support common status IDs.
         */

        const statusIds = [
            "profileStatus",
            "profileStudentStatus",
            "studentStatusDisplay"
        ];


        statusIds.forEach(
            id => {

                const element =
                    document.getElementById(
                        id
                    );


                if (!element) {

                    return;
                }


                element.textContent =
                    status || "Active";


                element.classList.remove(
                    "active",
                    "inactive"
                );


                if (
                    String(status)
                        .toLowerCase() ===
                    "active"
                ) {

                    element.classList.add(
                        "active"
                    );

                } else {

                    element.classList.add(
                        "inactive"
                    );

                }

            }
        );

    }


    /* =====================================================
       CONTACT LINKS
       ===================================================== */

    function setupContactLinks(data) {

        /*
         * Parent phone.
         */

        const phoneLinks =
            document.querySelectorAll(
                "[data-parent-phone]"
            );


        phoneLinks.forEach(
            element => {

                if (!data.parentPhone) {

                    return;
                }


                element.href =
                    "tel:" +
                    data.parentPhone;

            }
        );


        /*
         * Parent email.
         */

        const emailLinks =
            document.querySelectorAll(
                "[data-parent-email]"
            );


        emailLinks.forEach(
            element => {

                if (!data.parentEmail) {

                    return;
                }


                element.href =
                    "mailto:" +
                    data.parentEmail;

            }
        );

    }


    /* =====================================================
       BACK BUTTONS
       ===================================================== */

    function setupBackButtons() {

        const backButtons =
            document.querySelectorAll(
                "[data-back-students]"
            );


        backButtons.forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        window.location.href =
                            "students.html";

                    }
                );

            }
        );

    }


    /* =====================================================
       TEXT HELPER
       ===================================================== */

    function setText(
        id,
        value
    ) {

        const element =
            document.getElementById(
                id
            );


        if (!element) {

            return;
        }


        const cleanValue =
            value === undefined ||
            value === null ||
            String(value).trim() === ""
                ? "—"
                : value;


        element.textContent =
            cleanValue;

    }


    /* =====================================================
       DATE FORMAT
       ===================================================== */

    function formatDate(value) {

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
       DATE + TIME FORMAT
       ===================================================== */

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


        return date.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }


    /* =====================================================
       INITIALS
       ===================================================== */

    function getInitials(name) {

        if (!name) {

            return "S";
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
            parts[0][0] +
            parts[parts.length - 1][0]
        ).toUpperCase();

    }


    /* =====================================================
       ESCAPE HTML
       ===================================================== */

    function escapeHtml(value) {

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
       STUDENT NOT FOUND
       ===================================================== */

    function showStudentNotFound() {

        const page =
            document.querySelector(
                ".profile-page"
            );


        if (page) {

            page.innerHTML = `

                <div
                    style="
                        min-height:420px;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        text-align:center;
                        padding:30px;
                    "
                >

                    <div>

                        <div
                            style="
                                font-size:55px;
                                margin-bottom:15px;
                            "
                        >
                            🔍
                        </div>

                        <h2>
                            Student Not Found
                        </h2>

                        <p
                            style="
                                margin:10px 0 22px;
                                opacity:.7;
                            "
                        >
                            The requested student record
                            does not exist.
                        </p>

                        <a
                            href="students.html"
                            style="
                                display:inline-flex;
                                align-items:center;
                                justify-content:center;
                                padding:11px 18px;
                                border-radius:10px;
                                background:#635cff;
                                color:#fff;
                                text-decoration:none;
                                font-weight:700;
                            "
                        >
                            ← Back to Students
                        </a>

                    </div>

                </div>

            `;

        }

    }


    /* =====================================================
       TOAST
       ===================================================== */

    function showToast(
        message,
        type = "success"
    ) {

        /*
         * Remove previous toast.
         */

        const oldToast =
            document.getElementById(
                "profileToast"
            );


        if (oldToast) {

            oldToast.remove();

        }


        /*
         * Create toast.
         */

        const toast =
            document.createElement(
                "div"
            );


        toast.id =
            "profileToast";


        toast.className =
            `profile-toast ${type}`;


        toast.innerHTML = `

            <span class="profile-toast-icon">
                ${
                    type === "error"
                        ? "!"
                        : "✓"
                }
            </span>

            <span>
                ${escapeHtml(message)}
            </span>

        `;


        document.body.appendChild(
            toast
        );


        requestAnimationFrame(
            () => {

                toast.classList.add(
                    "show"
                );

            }
        );


        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );


                setTimeout(
                    () => {

                        toast.remove();

                    },
                    250
                );

            },
            2800
        );

    }

});
