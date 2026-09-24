/* =========================================================
   SMARTSCHOOL360
   STUDENT PROFILE MODULE
   PROFILE + PHOTO + EDIT + ID CARD + DOCUMENTS
   + DELETE + PRINT
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       GET STUDENT ID
       ===================================================== */

    const params = new URLSearchParams(
        window.location.search
    );

    const studentId = params.get("id");


    /* =====================================================
       STORAGE
       ===================================================== */

    function getStudents() {

        try {

            const data = localStorage.getItem(
                "smartschool_students"
            );

            if (!data) {
                return [];
            }

            const parsed = JSON.parse(data);

            return Array.isArray(parsed)
                ? parsed
                : [];

        } catch (error) {

            console.error(
                "Unable to read student data:",
                error
            );

            return [];

        }

    }


    const students = getStudents();


    /* =====================================================
       FIND STUDENT
       ===================================================== */

    const student = students.find(
        item =>
            String(item.id) ===
            String(studentId)
    );


    /* =====================================================
       STUDENT NOT FOUND
       ===================================================== */

    if (!student) {

        showNotFound();

        return;

    }


    /* =====================================================
       HELPERS
       ===================================================== */

    function getElement(id) {

        return document.getElementById(id);

    }


    function setText(id, value) {

        const element = getElement(id);

        if (!element) {
            return;
        }

        const finalValue =
            value === undefined ||
            value === null ||
            String(value).trim() === ""
                ? "—"
                : value;

        element.textContent = finalValue;

    }


    function formatDate(value) {

        if (!value) {
            return "—";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
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

        const parts = String(name)
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
            parts[parts.length - 1].charAt(0)
        ).toUpperCase();

    }


    function normalizeStatus(value) {

        return String(
            value || "Active"
        )
            .trim()
            .toLowerCase();

    }


    /* =====================================================
       PAGE TITLE
       ===================================================== */

    document.title =
        `${student.name || "Student"} | SmartSchool360`;


    /* =====================================================
       PROFILE HERO
       ===================================================== */

    setText(
        "profileName",
        student.name
    );

    setText(
        "profileId",
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


    /* =====================================================
       PROFILE STATUS
       ===================================================== */

    const status =
        student.status || "Active";

    setText(
        "profileStatus",
        status
    );

    updateStatusStyles();


    function updateStatusStyles() {

        const normalized =
            normalizeStatus(status);

        const statusElements =
            document.querySelectorAll(
                ".profile-status, .info-status"
            );

        statusElements.forEach(
            element => {

                element.classList.remove(
                    "active",
                    "inactive",
                    "pending"
                );

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

            }
        );

    }


    /* =====================================================
       PROFILE PHOTO
       ===================================================== */

    renderStudentPhoto();


    function renderStudentPhoto() {

        const avatar =
            document.getElementById(
                "profileInitials"
            );

        if (!avatar) {
            return;
        }


        const photo =
            student.photo ||
            student.studentPhoto ||
            "";


        avatar.innerHTML = "";


        if (
            typeof photo === "string" &&
            photo.trim() !== ""
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


            image.onerror = () => {

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

            avatar.innerHTML = "";


            const initials =
                document.createElement("span");

            initials.className =
                "student-avatar-initials";

            initials.id =
                "studentAvatarInitials";

            initials.textContent =
                getInitials(student.name);

            avatar.appendChild(
                initials
            );

        }

    }


    /* =====================================================
       QUICK STATS
       ===================================================== */

    setText(
        "profileDob",
        formatDate(student.dob)
    );

    setText(
        "profileGender",
        student.gender
    );

    setText(
        "profileSessionStat",
        student.session
    );

    setText(
        "profileAdmissionDate",
        formatDate(student.admissionDate)
    );


    /* =====================================================
       PERSONAL INFORMATION
       ===================================================== */

    setText(
        "infoName",
        student.name
    );

    setText(
        "infoDob",
        formatDate(student.dob)
    );

    setText(
        "infoGender",
        student.gender
    );

    setText(
        "infoBlood",
        student.bloodGroup
    );

    setText(
        "infoStudentPhone",
        student.studentPhone
    );

    setText(
        "infoAddress",
        student.address
    );


    /* =====================================================
       PARENT / GUARDIAN INFORMATION
       ===================================================== */

    setText(
        "infoFather",
        student.fatherName
    );

    setText(
        "infoMother",
        student.motherName
    );

    setText(
        "infoParentPhone",
        student.parentPhone
    );

    setText(
        "infoParentEmail",
        student.parentEmail
    );

    setText(
        "infoOccupation",
        student.occupation
    );

    setText(
        "infoEmergency",
        student.emergencyContact
    );


    /* =====================================================
       ACADEMIC INFORMATION
       ===================================================== */

    setText(
        "infoClass",
        student.className
    );

    setText(
        "infoSection",
        student.section
    );

    setText(
        "infoSession",
        student.session
    );

    setText(
        "infoPreviousSchool",
        student.previousSchool
    );

    setText(
        "infoAdmissionDate",
        formatDate(student.admissionDate)
    );

    setText(
        "infoStatus",
        status
    );


    /* =====================================================
       STUDENT RECORD
       ===================================================== */

    setText(
        "recordStudentId",
        student.id
    );

    setText(
        "recordSession",
        student.session
    );

    setText(
        "recordStatus",
        status
    );


    /* =====================================================
       BACK BUTTON
       ===================================================== */

    const backButtons =
        document.querySelectorAll(
            "[data-back-students], .profile-back-btn"
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


    /* =====================================================
       EDIT STUDENT
       ===================================================== */

    const editButton =
        getElement(
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


    /* =====================================================
       PRINT PROFILE
       ===================================================== */

    const printButton =
        getElement(
            "printProfileBtn"
        );


    if (printButton) {

        printButton.addEventListener(
            "click",
            () => {

                window.print();

            }
        );

    }


    /* =====================================================
       GENERATE ID CARD
       ===================================================== */

    const generateIdCardButton =
        getElement(
            "generateIdCardBtn"
        );


    if (generateIdCardButton) {

        generateIdCardButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "student-id-card.html?id=" +
                    encodeURIComponent(
                        student.id
                    );

            }
        );

    }


    /* =====================================================
       DOCUMENTS BUTTON
       ===================================================== */

    createDocumentsButton();


    function createDocumentsButton() {

        const actions =
            getElement(
                "profileActions"
            ) ||
            document.querySelector(
                ".profile-actions"
            );


        if (!actions) {
            return;
        }


        /*
         * Prevent duplicate button
         */

        if (
            getElement(
                "studentDocumentsBtn"
            )
        ) {
            return;
        }


        const documentsButton =
            document.createElement(
                "a"
            );


        documentsButton.id =
            "studentDocumentsBtn";


        documentsButton.className =
            "profile-action-btn profile-documents-btn";


        documentsButton.href =
            "student-documents.html?id=" +
            encodeURIComponent(
                student.id
            );


        documentsButton.title =
            "View Student Documents";


        documentsButton.innerHTML =
            "📄 Documents";


        /*
         * Professional inline styling
         * so no extra CSS file is required
         * for this connection step.
         */

        documentsButton.style.textDecoration =
            "none";

        documentsButton.style.display =
            "inline-flex";

        documentsButton.style.alignItems =
            "center";

        documentsButton.style.justifyContent =
            "center";

        documentsButton.style.gap =
            "6px";

        documentsButton.style.cursor =
            "pointer";


        actions.appendChild(
            documentsButton
        );

    }


    /* =====================================================
       COPY STUDENT ID
       ===================================================== */

    const copyButtons =
        document.querySelectorAll(
            "[data-copy-student-id], .copy-student-id"
        );


    copyButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                async () => {

                    try {

                        await navigator
                            .clipboard
                            .writeText(
                                String(student.id)
                            );

                        showToast(
                            "Student ID copied successfully."
                        );

                    } catch (error) {

                        showToast(
                            `Student ID: ${student.id}`
                        );

                    }

                }
            );

        }
    );


    /* =====================================================
       DELETE BUTTON
       ===================================================== */

    createDeleteButton();


    function createDeleteButton() {

        const actions =
            getElement(
                "profileActions"
            ) ||
            document.querySelector(
                ".profile-actions"
            );


        if (!actions) {
            return;
        }


        if (
            getElement(
                "deleteStudentBtn"
            )
        ) {
            return;
        }


        const deleteButton =
            document.createElement(
                "button"
            );


        deleteButton.type =
            "button";

        deleteButton.id =
            "deleteStudentBtn";

        deleteButton.className =
            "profile-action-btn delete-btn";

        deleteButton.innerHTML =
            "🗑️ Delete";


        deleteButton.addEventListener(
            "click",
            openDeleteModal
        );


        actions.appendChild(
            deleteButton
        );

    }


    /* =====================================================
       DELETE MODAL
       ===================================================== */

    function openDeleteModal() {

        if (
            document.querySelector(
                ".profile-delete-overlay"
            )
        ) {

            return;

        }


        const overlay =
            document.createElement(
                "div"
            );


        overlay.className =
            "profile-delete-overlay";


        overlay.innerHTML = `

            <div
                class="profile-delete-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="deleteStudentTitle"
            >

                <h3 id="deleteStudentTitle">
                    Delete Student?
                </h3>

                <p>
                    You are about to delete
                    <strong>
                        ${escapeHtml(
                            student.name ||
                            "this student"
                        )}
                    </strong>.
                    This action cannot be undone.
                </p>

                <div
                    class="profile-delete-actions"
                >

                    <button
                        type="button"
                        class="profile-delete-cancel"
                        id="cancelStudentDelete"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        class="profile-delete-confirm"
                        id="confirmStudentDelete"
                    >
                        Delete Student
                    </button>

                </div>

            </div>

        `;


        document.body.appendChild(
            overlay
        );


        const cancelButton =
            getElement(
                "cancelStudentDelete"
            );


        const confirmButton =
            getElement(
                "confirmStudentDelete"
            );


        if (cancelButton) {

            cancelButton.addEventListener(
                "click",
                closeModal
            );

        }


        overlay.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    overlay
                ) {

                    closeModal();

                }

            }
        );


        if (confirmButton) {

            confirmButton.addEventListener(
                "click",
                deleteStudent
            );

        }


        document.addEventListener(
            "keydown",
            handleEscape
        );


        setTimeout(
            () => {

                if (cancelButton) {
                    cancelButton.focus();
                }

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

            overlay.remove();

            document.removeEventListener(
                "keydown",
                handleEscape
            );

        }

    }


    /* =====================================================
       DELETE STUDENT
       ===================================================== */

    function deleteStudent() {

        const allStudents =
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
                "Student deleted successfully."
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


    /* =====================================================
       MOBILE MENU
       ===================================================== */

    const mobileMenu =
        getElement(
            "mobileMenu"
        );

    const sidebar =
        getElement(
            "sidebar"
        );


    if (
        mobileMenu &&
        sidebar
    ) {

        mobileMenu.addEventListener(
            "click",
            () => {

                sidebar.classList.toggle(
                    "active"
                );

            }
        );

    }


    /* =====================================================
       CLOSE SIDEBAR ON MOBILE NAVIGATION
       ===================================================== */

    if (sidebar) {

        const sidebarLinks =
            sidebar.querySelectorAll(
                "a"
            );


        sidebarLinks.forEach(
            link => {

                link.addEventListener(
                    "click",
                    () => {

                        sidebar.classList.remove(
                            "active"
                        );

                    }
                );

            }
        );

    }


    /* =====================================================
       FULLSCREEN
       ===================================================== */

    const fullscreenButton =
        getElement(
            "fullscreenBtn"
        );


    if (fullscreenButton) {

        fullscreenButton.addEventListener(
            "click",
            async () => {

                try {

                    if (
                        !document.fullscreenElement
                    ) {

                        await document.documentElement
                            .requestFullscreen();

                    } else {

                        await document.exitFullscreen();

                    }

                } catch (error) {

                    console.log(
                        "Fullscreen unavailable:",
                        error
                    );

                }

            }
        );

    }


    /* =====================================================
       NOTIFICATION BUTTON
       ===================================================== */

    const notificationButton =
        getElement(
            "notificationBtn"
        );


    if (notificationButton) {

        notificationButton.addEventListener(
            "click",
            () => {

                showToast(
                    "No new notifications."
                );

            }
        );

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
       TOAST
       ===================================================== */

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
            document.createElement(
                "div"
            );


        toast.className =
            `profile-toast ${type}`;


        toast.textContent =
            message;


        document.body.appendChild(
            toast
        );


        requestAnimationFrame(
            () => {

                toast.style.opacity =
                    "1";

            }
        );


        setTimeout(
            () => {

                toast.style.opacity =
                    "0";

                setTimeout(
                    () => {

                        toast.remove();

                    },
                    300
                );

            },
            2800
        );

    }


    /* =====================================================
       KEYBOARD PRINT SHORTCUT
       Ctrl/Cmd + P
       ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                (event.ctrlKey ||
                 event.metaKey) &&
                event.key.toLowerCase() === "p"
            ) {

                event.preventDefault();

                window.print();

            }

        }
    );

});


/* =========================================================
   STUDENT NOT FOUND
   ========================================================= */

function showNotFound() {

    const container =
        document.querySelector(
            ".profile-container"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="profile-not-found">

            <div
                style="
                    font-size:52px;
                    margin-bottom:15px;
                "
            >
                🔍
            </div>

            <h2>
                Student Not Found
            </h2>

            <p>
                The requested student record
                could not be found in
                SmartSchool360.
            </p>

            <a
                href="students.html"
                class="profile-back-btn"
            >
                ← Back to Students
            </a>

        </div>

    `;

}
