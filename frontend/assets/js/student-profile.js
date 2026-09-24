/* =========================================
   SMARTSCHOOL360
   STUDENT PROFILE MODULE
   PHOTO + EDIT + DELETE + PRINT
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =========================================
       GET STUDENT ID
       ========================================= */

    const params =
        new URLSearchParams(window.location.search);

    const studentId =
        params.get("id");


    /* =========================================
       STORAGE
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
       FIND STUDENT
       ========================================= */

    const students =
        getStudents();

    const student =
        students.find(
            item =>
                String(item.id) ===
                String(studentId)
        );


    /* =========================================
       NOT FOUND
       ========================================= */

    if (!student) {

        showNotFound();

        return;

    }


    /* =========================================
       BASIC HELPERS
       ========================================= */

    function getElement(id) {

        return document.getElementById(id);

    }


    function setText(id, value) {

        const element =
            getElement(id);

        if (!element) return;

        element.textContent =
            value || "—";

    }


    function formatDate(value) {

        if (!value) return "—";

        const date =
            new Date(value);

        if (Number.isNaN(date.getTime())) {

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


    function getInitials(name) {

        if (!name) return "ST";

        const parts =
            name
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


    /* =========================================
       PAGE TITLE
       ========================================= */

    document.title =
        `${student.name || "Student"} | SmartSchool360`;


    /* =========================================
       PROFILE BASIC INFORMATION
       ========================================= */

    setText(
        "profileName",
        student.name
    );

    setText(
        "profileStudentId",
        student.id
    );

    setText(
        "studentId",
        student.id
    );

    setText(
        "profileClass",
        student.className
    );

    setText(
        "profileSection",
        student.section
    );

    setText(
        "profileSession",
        student.session
    );


    /* =========================================
       PERSONAL INFORMATION
       ========================================= */

    setText(
        "profileDob",
        formatDate(student.dob)
    );

    setText(
        "profileGender",
        student.gender
    );

    setText(
        "profileBloodGroup",
        student.bloodGroup
    );

    setText(
        "profilePhone",
        student.studentPhone
    );

    setText(
        "profileAddress",
        student.address
    );


    /* =========================================
       PARENT INFORMATION
       ========================================= */

    setText(
        "profileFather",
        student.fatherName
    );

    setText(
        "profileMother",
        student.motherName
    );

    setText(
        "profileParentPhone",
        student.parentPhone
    );

    setText(
        "profileParentEmail",
        student.parentEmail
    );

    setText(
        "profileOccupation",
        student.occupation
    );

    setText(
        "profileEmergency",
        student.emergencyContact
    );


    /* =========================================
       ACADEMIC INFORMATION
       ========================================= */

    setText(
        "profileClassAcademic",
        student.className
    );

    setText(
        "profileSectionAcademic",
        student.section
    );

    setText(
        "profileSessionAcademic",
        student.session
    );

    setText(
        "profilePreviousSchool",
        student.previousSchool
    );


    /* =========================================
       ADMISSION INFORMATION
       ========================================= */

    setText(
        "profileAdmissionDate",
        formatDate(
            student.admissionDate
        )
    );

    setText(
        "profileCreatedAt",
        formatDate(
            student.createdAt
        )
    );


    /* =========================================
       STATUS
       ========================================= */

    const status =
        student.status ||
        "Active";

    setText(
        "profileStatus",
        status
    );


    const statusElements =
        document.querySelectorAll(
            ".profile-status, .status-badge"
        );


    statusElements.forEach(element => {

        element.classList.remove(
            "active",
            "inactive",
            "pending"
        );


        const normalized =
            String(status)
                .toLowerCase();


        if (
            normalized === "active"
        ) {

            element.classList.add(
                "active"
            );

        } else if (
            normalized === "inactive"
        ) {

            element.classList.add(
                "inactive"
            );

        } else {

            element.classList.add(
                "pending"
            );

        }

    });


    /* =========================================
       PROFILE AVATAR / PHOTO
       ========================================= */

    renderStudentPhoto();


    function renderStudentPhoto() {

        const avatar =
            document.querySelector(
                ".profile-avatar"
            );


        if (!avatar) return;


        const initials =
            getInitials(
                student.name
            );


        /*
         * Remove old dynamic image
         */

        const oldImage =
            avatar.querySelector(
                ".student-profile-photo"
            );


        if (oldImage) {

            oldImage.remove();

        }


        /*
         * Remove old initials
         */

        const oldInitials =
            avatar.querySelector(
                ".student-avatar-initials"
            );


        if (oldInitials) {

            oldInitials.remove();

        }


        /*
         * PHOTO EXISTS
         */

        const photo =
            student.photo ||
            student.studentPhoto ||
            "";


        if (
            photo &&
            typeof photo === "string"
        ) {

            const image =
                document.createElement("img");


            image.className =
                "student-profile-photo";


            image.src =
                photo;


            image.alt =
                `${student.name || "Student"} Photo`;


            image.loading =
                "eager";


            image.decoding =
                "async";


            image.style.width =
                "100%";


            image.style.height =
                "100%";


            image.style.objectFit =
                "cover";


            image.style.borderRadius =
                "inherit";


            image.style.display =
                "block";


            image.onerror =
                () => {

                    image.remove();

                    showInitials();

                };


            avatar.appendChild(
                image
            );


            avatar.classList.add(
                "has-photo"
            );


        } else {

            showInitials();

        }


        function showInitials() {

            avatar.classList.remove(
                "has-photo"
            );


            const initialsElement =
                document.createElement(
                    "span"
                );


            initialsElement.className =
                "student-avatar-initials";


            initialsElement.textContent =
                initials;


            avatar.appendChild(
                initialsElement
            );

        }

    }


    /* =========================================
       QUICK STATS
       ========================================= */

    setText(
        "statStudentId",
        student.id
    );

    setText(
        "statClass",
        student.className
    );

    setText(
        "statSection",
        student.section
    );

    setText(
        "statAdmission",
        formatDate(
            student.admissionDate
        )
    );


    /* =========================================
       BACK BUTTONS
       ========================================= */

    const backButtons =
        document.querySelectorAll(
            "[data-back-students], .profile-back"
        );


    backButtons.forEach(button => {

        button.addEventListener(
            "click",
            event => {

                event.preventDefault();

                window.location.href =
                    "students.html";

            }
        );

    });


    /* =========================================
       EDIT STUDENT
       ========================================= */

    const editButton =
        document.getElementById(
            "editStudentBtn"
        );


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


    /* =========================================
       PRINT PROFILE
       ========================================= */

    const printButton =
        document.getElementById(
            "printStudentBtn"
        );


    if (printButton) {

        printButton.addEventListener(
            "click",
            () => {

                window.print();

            }
        );

    }


    /* =========================================
       COPY STUDENT ID
       ========================================= */

    const copyButtons =
        document.querySelectorAll(
            "[data-copy-student-id], .copy-student-id"
        );


    copyButtons.forEach(button => {

        button.addEventListener(
            "click",
            async () => {

                try {

                    await navigator.clipboard.writeText(
                        String(student.id)
                    );

                    showToast(
                        "Student ID copied successfully.",
                        "success"
                    );

                } catch (error) {

                    showToast(
                        `Student ID: ${student.id}`,
                        "success"
                    );

                }

            }
        );

    });


    /* =========================================
       DELETE BUTTON
       ========================================= */

    createDeleteButton();


    function createDeleteButton() {

        const actions =
            document.querySelector(
                ".profile-actions"
            ) ||
            document.querySelector(
                ".profile-action-bar"
            );


        if (!actions) return;


        /*
         * Prevent duplicate delete button
         */

        if (
            document.getElementById(
                "deleteStudentBtn"
            )
        ) {

            return;

        }


        const deleteButton =
            document.createElement("button");


        deleteButton.type =
            "button";


        deleteButton.id =
            "deleteStudentBtn";


        deleteButton.className =
            "profile-action-btn delete-btn";


        deleteButton.innerHTML =
            "🗑 Delete";


        deleteButton.addEventListener(
            "click",
            openDeleteModal
        );


        actions.appendChild(
            deleteButton
        );

    }


    /* =========================================
       DELETE CONFIRMATION MODAL
       ========================================= */

    function openDeleteModal() {

        if (
            document.querySelector(
                ".student-delete-modal"
            )
        ) {

            return;

        }


        const backdrop =
            document.createElement("div");


        backdrop.className =
            "student-delete-modal";


        backdrop.innerHTML = `

            <div class="student-delete-backdrop"></div>

            <div
                class="student-delete-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="deleteStudentTitle"
            >

                <div class="student-delete-icon">
                    🗑️
                </div>

                <h2 id="deleteStudentTitle">
                    Delete Student?
                </h2>

                <p class="student-delete-info">
                    You are about to delete
                    <strong>
                        ${escapeHtml(
                            student.name ||
                            "this student"
                        )}
                    </strong>.
                </p>

                <p class="student-delete-warning">
                    This action cannot be undone.
                    The student record will be permanently
                    removed from this browser.
                </p>

                <div class="student-delete-actions">

                    <button
                        type="button"
                        class="student-delete-cancel"
                        id="cancelStudentDelete"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        class="student-delete-confirm"
                        id="confirmStudentDelete"
                    >
                        Delete Student
                    </button>

                </div>

            </div>
        `;


        document.body.appendChild(
            backdrop
        );


        const cancelButton =
            document.getElementById(
                "cancelStudentDelete"
            );


        const confirmButton =
            document.getElementById(
                "confirmStudentDelete"
            );


        const background =
            backdrop.querySelector(
                ".student-delete-backdrop"
            );


        cancelButton.addEventListener(
            "click",
            closeModal
        );


        background.addEventListener(
            "click",
            closeModal
        );


        confirmButton.addEventListener(
            "click",
            deleteStudent
        );


        document.addEventListener(
            "keydown",
            handleEscape
        );


        setTimeout(
            () => {

                cancelButton.focus();

            },
            50
        );


        function handleEscape(event) {

            if (
                event.key === "Escape"
            ) {

                closeModal();

            }

        }


        function closeModal() {

            backdrop.remove();

            document.removeEventListener(
                "keydown",
                handleEscape
            );

        }

    }


    /* =========================================
       DELETE STUDENT
       ========================================= */

    function deleteStudent() {

        let allStudents =
            getStudents();


        const updatedStudents =
            allStudents.filter(
                item =>
                    String(item.id) !==
                    String(student.id)
            );


        try {

            localStorage.setItem(
                "smartschool_students",
                JSON.stringify(
                    updatedStudents
                )
            );


            showToast(
                "Student deleted successfully.",
                "success"
            );


            setTimeout(
                () => {

                    window.location.href =
                        "students.html";

                },
                900
            );


        } catch (error) {

            console.error(
                "Delete failed:",
                error
            );


            showToast(
                "Unable to delete student.",
                "error"
            );

        }

    }


    /* =========================================
       ESCAPE HTML
       ========================================= */

    function escapeHtml(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* =========================================
       TOAST
       ========================================= */

    function showToast(
        message,
        type = "success"
    ) {

        const oldToast =
            document.querySelector(
                ".profile-toast"
            );


        if (oldToast) {

            oldToast.remove();

        }


        const toast =
            document.createElement("div");


        toast.className =
            `profile-toast ${type}`;


        toast.textContent =
            message;


        toast.style.position =
            "fixed";


        toast.style.right =
            "20px";


        toast.style.bottom =
            "20px";


        toast.style.zIndex =
            "99999";


        toast.style.padding =
            "13px 18px";


        toast.style.borderRadius =
            "12px";


        toast.style.background =
            "#111827";


        toast.style.color =
            "#ffffff";


        toast.style.border =
            "1px solid rgba(255,255,255,.12)";


        toast.style.boxShadow =
            "0 15px 40px rgba(0,0,0,.35)";


        toast.style.fontWeight =
            "600";


        toast.style.fontSize =
            "14px";


        toast.style.opacity =
            "0";


        toast.style.transform =
            "translateY(15px)";


        toast.style.transition =
            "all .3s ease";


        document.body.appendChild(
            toast
        );


        requestAnimationFrame(
            () => {

                toast.style.opacity =
                    "1";

                toast.style.transform =
                    "translateY(0)";

            }
        );


        setTimeout(
            () => {

                toast.style.opacity =
                    "0";

                toast.style.transform =
                    "translateY(15px)";


                setTimeout(
                    () => {

                        toast.remove();

                    },
                    300
                );

            },
            3000
        );

    }


    /* =========================================
       NOT FOUND SCREEN
       ========================================= */

    function showNotFound() {

        document.body.innerHTML = `

            <div
                style="
                    min-height:100vh;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    padding:20px;
                    background:#f5f7fb;
                    font-family:Arial,sans-serif;
                "
            >

                <div
                    style="
                        max-width:480px;
                        width:100%;
                        padding:40px 25px;
                        text-align:center;
                        background:#ffffff;
                        border-radius:20px;
                        box-shadow:0 15px 50px rgba(0,0,0,.08);
                    "
                >

                    <div
                        style="
                            font-size:55px;
                            margin-bottom:15px;
                        "
                    >
                        👨‍🎓
                    </div>

                    <h2
                        style="
                            margin:0 0 10px;
                            color:#111827;
                        "
                    >
                        Student Not Found
                    </h2>

                    <p
                        style="
                            color:#6b7280;
                            line-height:1.6;
                            margin-bottom:25px;
                        "
                    >
                        The requested student record
                        could not be found.
                    </p>

                    <button
                        onclick="window.location.href='students.html'"
                        style="
                            border:0;
                            padding:12px 20px;
                            border-radius:10px;
                            background:#2563eb;
                            color:#ffffff;
                            font-weight:700;
                            cursor:pointer;
                        "
                    >
                        ← Back to Students
                    </button>

                </div>

            </div>

        `;

    }


    /* =========================================
       MODULE READY
       ========================================= */

    console.log(
        "SmartSchool360 Student Profile Module loaded:",
        student.id
    );

});
