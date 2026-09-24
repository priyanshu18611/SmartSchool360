/* =========================================================
   SMARTSCHOOL360
   STUDENT ADMISSION + EDIT MODULE
   CREATE / UPDATE / PHOTO / VALIDATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTS
       ===================================================== */

    const form =
        document.getElementById("admissionForm");

    const resetBtn =
        document.getElementById("resetBtn");

    const saveBtn =
        document.getElementById("saveStudentBtn");

    const admissionDate =
        document.getElementById("admissionDate");

    const mobileMenu =
        document.getElementById("mobileMenu");

    const sidebar =
        document.getElementById("sidebar");


    /* =====================================================
       URL / EDIT MODE
       ===================================================== */

    const params =
        new URLSearchParams(
            window.location.search
        );

    const editStudentId =
        params.get("id");

    const isEditMode =
        Boolean(editStudentId);


    /* =====================================================
       STORAGE
       ===================================================== */

    function getStudents() {

        try {

            const stored =
                localStorage.getItem(
                    "smartschool_students"
                );

            if (!stored) {
                return [];
            }

            const parsed =
                JSON.parse(stored);

            return Array.isArray(parsed)
                ? parsed
                : [];

        } catch (error) {

            console.error(
                "Unable to read students:",
                error
            );

            return [];

        }

    }


    function saveStudents(students) {

        try {

            localStorage.setItem(
                "smartschool_students",
                JSON.stringify(students)
            );

            return true;

        } catch (error) {

            console.error(
                "Unable to save students:",
                error
            );

            return false;

        }

    }


    let students =
        getStudents();


    /* =====================================================
       FIND EDIT STUDENT
       ===================================================== */

    let editStudent = null;


    if (isEditMode) {

        editStudent =
            students.find(
                student =>
                    String(student.id) ===
                    String(editStudentId)
            );


        if (!editStudent) {

            showToast(
                "Student record could not be found.",
                "error"
            );

            setTimeout(
                () => {

                    window.location.href =
                        "students.html";

                },
                1200
            );

            return;

        }

    }


    /* =====================================================
       TODAY'S DATE
       ===================================================== */

    function getToday() {

        const today =
            new Date();

        const year =
            today.getFullYear();

        const month =
            String(
                today.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                today.getDate()
            ).padStart(2, "0");

        return `${year}-${month}-${day}`;

    }


    function setToday() {

        if (!admissionDate) {
            return;
        }

        admissionDate.value =
            getToday();

    }


    /* =====================================================
       EDIT MODE UI
       ===================================================== */

    function setupPageMode() {

        if (!isEditMode) {

            document.title =
                "Student Admission | SmartSchool360";

            setToday();

            return;

        }


        document.title =
            "Edit Student | SmartSchool360";


        /* PAGE HEADING */

        const pageHeading =
            document.querySelector(
                ".page-heading h1"
            );

        const pageSubtitle =
            document.querySelector(
                ".page-heading p"
            );


        if (pageHeading) {

            pageHeading.textContent =
                "Edit Student";

        }


        if (pageSubtitle) {

            pageSubtitle.textContent =
                "Update student information";

        }


        /* ADMISSION HEADER */

        const admissionHeaderTitle =
            document.querySelector(
                ".admission-header h2"
            );

        const admissionHeaderText =
            document.querySelector(
                ".admission-header p"
            );


        if (admissionHeaderTitle) {

            admissionHeaderTitle.textContent =
                "Update Student Record";

        }


        if (admissionHeaderText) {

            admissionHeaderText.textContent =
                "Edit the student and guardian information below.";

        }


        /* SECTION BADGE */

        const sectionBadge =
            document.querySelector(
                ".section-badge"
            );


        if (sectionBadge) {

            sectionBadge.textContent =
                "EDIT STUDENT MODULE";

        }


        /* SAVE BUTTON */

        if (saveBtn) {

            saveBtn.innerHTML =
                "✓ Update Student";

        }


        /* FORM PRE-FILL */

        populateForm(
            editStudent
        );

    }


    /* =====================================================
       POPULATE FORM
       ===================================================== */

    function populateForm(student) {

        if (!student) {
            return;
        }


        setInputValue(
            "studentName",
            student.name
        );

        setInputValue(
            "dob",
            student.dob
        );

        setInputValue(
            "gender",
            student.gender
        );

        setInputValue(
            "bloodGroup",
            student.bloodGroup
        );

        setInputValue(
            "studentPhone",
            student.studentPhone
        );

        setInputValue(
            "address",
            student.address
        );

        setInputValue(
            "fatherName",
            student.fatherName
        );

        setInputValue(
            "motherName",
            student.motherName
        );

        setInputValue(
            "parentPhone",
            student.parentPhone
        );

        setInputValue(
            "parentEmail",
            student.parentEmail
        );

        setInputValue(
            "occupation",
            student.occupation
        );

        setInputValue(
            "emergencyContact",
            student.emergencyContact
        );

        setInputValue(
            "className",
            student.className
        );

        setInputValue(
            "section",
            student.section
        );

        setInputValue(
            "session",
            student.session
        );

        setInputValue(
            "previousSchool",
            student.previousSchool
        );

        setInputValue(
            "admissionDate",
            student.admissionDate
        );

        setInputValue(
            "studentStatus",
            student.status || "Active"
        );


        /* PHOTO INFORMATION */

        const existingPhoto =
            student.photo ||
            student.studentPhoto ||
            "";


        if (existingPhoto) {

            showExistingPhoto(
                existingPhoto
            );

        }

    }


    /* =====================================================
       SET INPUT VALUE
       ===================================================== */

    function setInputValue(
        id,
        value
    ) {

        const element =
            document.getElementById(id);

        if (!element) {
            return;
        }


        if (
            value === undefined ||
            value === null
        ) {

            element.value = "";

            return;

        }


        element.value =
            value;

    }


    /* =====================================================
       EXISTING PHOTO
       ===================================================== */

    function showExistingPhoto(
        photo
    ) {

        const input =
            document.getElementById(
                "studentPhoto"
            );


        if (!input) {
            return;
        }


        const box =
            input.closest(
                ".upload-box"
            );


        if (!box) {
            return;
        }


        const title =
            box.querySelector(
                "strong"
            );


        if (title) {

            title.textContent =
                "✓ Existing photo saved";

        }


        box.style.borderColor =
            "#22c55e";


        box.dataset.existingPhoto =
            photo;

    }


    /* =====================================================
       MOBILE SIDEBAR
       ===================================================== */

    if (
        mobileMenu &&
        sidebar
    ) {

        mobileMenu.addEventListener(
            "click",
            () => {

                sidebar.classList.toggle(
                    "show"
                );

            }
        );

    }


    /* =====================================================
       PHONE INPUT
       ===================================================== */

    const phoneFields = [

        document.getElementById(
            "studentPhone"
        ),

        document.getElementById(
            "parentPhone"
        ),

        document.getElementById(
            "emergencyContact"
        )

    ];


    phoneFields.forEach(
        field => {

            if (!field) {
                return;
            }


            field.addEventListener(
                "input",
                () => {

                    field.value =
                        field.value
                            .replace(
                                /\D/g,
                                ""
                            )
                            .slice(
                                0,
                                10
                            );

                }
            );

        }
    );


    /* =====================================================
       UPLOAD FIELDS
       ===================================================== */

    const uploadFields = [

        {
            id: "studentPhoto",
            defaultText: "Student Photo"
        },

        {
            id: "birthCertificate",
            defaultText: "Birth Certificate"
        },

        {
            id: "previousCertificate",
            defaultText: "Previous Certificate"
        }

    ];


    uploadFields.forEach(
        item => {

            const input =
                document.getElementById(
                    item.id
                );


            if (!input) {
                return;
            }


            input.addEventListener(
                "change",
                () => {

                    const box =
                        input.closest(
                            ".upload-box"
                        );


                    if (!box) {
                        return;
                    }


                    const title =
                        box.querySelector(
                            "strong"
                        );


                    if (
                        input.files &&
                        input.files.length > 0
                    ) {

                        if (title) {

                            title.textContent =
                                input.files[0].name;

                        }


                        box.style.borderColor =
                            "#22c55e";

                    } else {

                        if (title) {

                            title.textContent =
                                item.defaultText;

                        }


                        if (
                            !isEditMode ||
                            item.id !==
                                "studentPhoto"
                        ) {

                            box.style.borderColor =
                                "";

                        }

                    }

                }
            );

        }
    );


    /* =====================================================
       STUDENT PHOTO VALIDATION
       ===================================================== */

    const studentPhotoInput =
        document.getElementById(
            "studentPhoto"
        );


    if (studentPhotoInput) {

        studentPhotoInput.addEventListener(
            "change",
            () => {

                const file =
                    studentPhotoInput.files &&
                    studentPhotoInput.files[0];


                if (!file) {
                    return;
                }


                /* IMAGE CHECK */

                if (
                    !file.type.startsWith(
                        "image/"
                    )
                ) {

                    showToast(
                        "Please select a valid image file.",
                        "error"
                    );

                    studentPhotoInput.value =
                        "";

                    return;

                }


                /* SIZE CHECK */

                if (
                    file.size >
                    2 * 1024 * 1024
                ) {

                    showToast(
                        "Student photo must be smaller than 2 MB.",
                        "error"
                    );

                    studentPhotoInput.value =
                        "";

                    return;

                }


                console.log(
                    "Student photo selected:",
                    file.name
                );

            }
        );

    }


    /* =====================================================
       FORM SUBMIT
       ===================================================== */

    if (form) {

        form.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                /* HTML VALIDATION */

                if (
                    !form.checkValidity()
                ) {

                    form.reportValidity();

                    return;

                }


                /* PHONE VALUES */

                const parentPhone =
                    getValue(
                        "parentPhone"
                    );

                const studentPhone =
                    getValue(
                        "studentPhone"
                    );

                const emergencyContact =
                    getValue(
                        "emergencyContact"
                    );


                /* PHONE VALIDATION */

                if (
                    parentPhone.length !== 10
                ) {

                    showToast(
                        "Please enter a valid 10-digit parent mobile number.",
                        "error"
                    );

                    return;

                }


                if (
                    studentPhone.length > 0 &&
                    studentPhone.length !== 10
                ) {

                    showToast(
                        "Student mobile number must contain 10 digits.",
                        "error"
                    );

                    return;

                }


                if (
                    emergencyContact.length > 0 &&
                    emergencyContact.length !== 10
                ) {

                    showToast(
                        "Emergency contact must contain 10 digits.",
                        "error"
                    );

                    return;

                }


                /* =========================================
                   PHOTO
                   ========================================= */

                let studentPhoto =
                    "";


                const existingPhoto =
                    editStudent
                        ? (
                            editStudent.photo ||
                            editStudent.studentPhoto ||
                            ""
                        )
                        : "";


                if (
                    studentPhotoInput &&
                    studentPhotoInput.files &&
                    studentPhotoInput.files.length > 0
                ) {

                    const file =
                        studentPhotoInput.files[0];


                    if (
                        !file.type.startsWith(
                            "image/"
                        )
                    ) {

                        showToast(
                            "Please select a valid student image.",
                            "error"
                        );

                        return;

                    }


                    if (
                        file.size >
                        2 * 1024 * 1024
                    ) {

                        showToast(
                            "Student photo must be smaller than 2 MB.",
                            "error"
                        );

                        return;

                    }


                    try {

                        studentPhoto =
                            await readFileAsDataURL(
                                file
                            );

                    } catch (error) {

                        console.error(
                            "Photo processing failed:",
                            error
                        );

                        showToast(
                            "Unable to process student photo.",
                            "error"
                        );

                        return;

                    }

                } else {

                    /*
                       EDIT MODE:
                       If user does not select
                       a new photo, preserve
                       the existing photo.
                    */

                    studentPhoto =
                        existingPhoto;

                }


                /* =========================================
                   CREATE NEW STUDENT OBJECT
                   ========================================= */

                const studentData = {

                    id:
                        isEditMode
                            ? editStudent.id
                            : generateStudentId(),

                    name:
                        getValue(
                            "studentName"
                        ),

                    dob:
                        getValue(
                            "dob"
                        ),

                    gender:
                        getValue(
                            "gender"
                        ),

                    bloodGroup:
                        getValue(
                            "bloodGroup"
                        ),

                    studentPhone:
                        studentPhone,

                    address:
                        getValue(
                            "address"
                        ),

                    fatherName:
                        getValue(
                            "fatherName"
                        ),

                    motherName:
                        getValue(
                            "motherName"
                        ),

                    parentPhone:
                        parentPhone,

                    parentEmail:
                        getValue(
                            "parentEmail"
                        ),

                    occupation:
                        getValue(
                            "occupation"
                        ),

                    emergencyContact:
                        emergencyContact,

                    className:
                        getValue(
                            "className"
                        ),

                    section:
                        getValue(
                            "section"
                        ),

                    session:
                        getValue(
                            "session"
                        ),

                    previousSchool:
                        getValue(
                            "previousSchool"
                        ),

                    admissionDate:
                        getValue(
                            "admissionDate"
                        ),

                    status:
                        getValue(
                            "studentStatus"
                        ) || "Active",

                    photo:
                        studentPhoto,

                    createdAt:
                        isEditMode
                            ? (
                                editStudent.createdAt ||
                                new Date().toISOString()
                            )
                            : new Date().toISOString(),

                    updatedAt:
                        new Date().toISOString()

                };


                /* =========================================
                   SAVE
                   ========================================= */

                if (isEditMode) {

                    const index =
                        students.findIndex(
                            student =>
                                String(
                                    student.id
                                ) ===
                                String(
                                    editStudent.id
                                )
                        );


                    if (index === -1) {

                        showToast(
                            "Student record could not be updated.",
                            "error"
                        );

                        return;

                    }


                    students[index] =
                        studentData;

                } else {

                    students.push(
                        studentData
                    );

                }


                /* =========================================
                   LOCAL STORAGE
                   ========================================= */

                const saved =
                    saveStudents(
                        students
                    );


                if (!saved) {

                    showToast(
                        "Unable to save student data. Storage may be full.",
                        "error"
                    );

                    return;

                }


                /* =========================================
                   SUCCESS BUTTON
                   ========================================= */

                if (saveBtn) {

                    saveBtn.disabled =
                        true;


                    saveBtn.innerHTML =
                        isEditMode
                            ? "✓ Student Updated"
                            : "✓ Student Registered";

                }


                /* =========================================
                   SUCCESS MESSAGE
                   ========================================= */

                showToast(
                    isEditMode
                        ? "Student record updated successfully."
                        : `Student registered successfully. ID: ${studentData.id}`,
                    "success"
                );


                /* =========================================
                   REDIRECT
                   ========================================= */

                setTimeout(
                    () => {

                        if (isEditMode) {

                            /*
                               Return directly
                               to updated profile.
                            */

                            window.location.href =
                                "student-profile.html?id=" +
                                encodeURIComponent(
                                    studentData.id
                                );

                        } else {

                            window.location.href =
                                "students.html";

                        }

                    },
                    1000
                );

            }
        );

    }


    /* =====================================================
       RESET FORM
       ===================================================== */

    if (resetBtn) {

        resetBtn.addEventListener(
            "click",
            () => {

                const confirmed =
                    window.confirm(
                        isEditMode
                            ? "Are you sure you want to reset the changes?"
                            : "Are you sure you want to reset the complete admission form?"
                    );


                if (!confirmed) {
                    return;
                }


                if (isEditMode) {

                    /*
                       Restore original
                       student values.
                    */

                    populateForm(
                        editStudent
                    );


                    if (
                        studentPhotoInput
                    ) {

                        studentPhotoInput.value =
                            "";

                    }


                    showToast(
                        "Original student information restored.",
                        "success"
                    );


                    return;

                }


                form.reset();

                setToday();


                uploadFields.forEach(
                    item => {

                        const input =
                            document.getElementById(
                                item.id
                            );


                        if (!input) {
                            return;
                        }


                        const box =
                            input.closest(
                                ".upload-box"
                            );


                        if (!box) {
                            return;
                        }


                        const title =
                            box.querySelector(
                                "strong"
                            );


                        if (title) {

                            title.textContent =
                                item.defaultText;

                        }


                        box.style.borderColor =
                            "";

                    }
                );


                showToast(
                    "Admission form has been reset.",
                    "success"
                );

            }
        );

    }


    /* =====================================================
       FILE READER
       ===================================================== */

    function readFileAsDataURL(
        file
    ) {

        return new Promise(
            (resolve, reject) => {

                const reader =
                    new FileReader();


                reader.onload =
                    () => {

                        resolve(
                            reader.result
                        );

                    };


                reader.onerror =
                    () => {

                        reject(
                            new Error(
                                "File reading failed."
                            )
                        );

                    };


                reader.readAsDataURL(
                    file
                );

            }
        );

    }


    /* =====================================================
       VALUE HELPER
       ===================================================== */

    function getValue(id) {

        const element =
            document.getElementById(
                id
            );


        if (!element) {
            return "";
        }


        return element.value
            .trim();

    }


    /* =====================================================
       STUDENT ID
       ===================================================== */

    function generateStudentId() {

        const year =
            new Date()
                .getFullYear();


        let id;


        do {

            const random =
                Math.floor(
                    1000 +
                    Math.random() *
                    9000
                );


            id =
                `SS${year}${random}`;

        } while (
            students.some(
                student =>
                    String(
                        student.id
                    ) ===
                    String(id)
            )
        );


        return id;

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
                ".admission-toast"
            );


        if (oldToast) {
            oldToast.remove();
        }


        const toast =
            document.createElement(
                "div"
            );


        toast.className =
            `admission-toast ${type}`;


        toast.textContent =
            message;


        toast.style.position =
            "fixed";

        toast.style.left =
            "50%";

        toast.style.bottom =
            "25px";

        toast.style.transform =
            "translateX(-50%)";

        toast.style.zIndex =
            "99999";

        toast.style.padding =
            "13px 20px";

        toast.style.borderRadius =
            "10px";

        toast.style.fontSize =
            "13px";

        toast.style.fontWeight =
            "700";

        toast.style.maxWidth =
            "calc(100% - 30px)";

        toast.style.textAlign =
            "center";

        toast.style.boxShadow =
            "0 10px 30px rgba(0,0,0,.18)";


        if (type === "error") {

            toast.style.background =
                "#dc2626";

            toast.style.color =
                "#ffffff";

        } else {

            toast.style.background =
                "#16a34a";

            toast.style.color =
                "#ffffff";

        }


        document.body.appendChild(
            toast
        );


        setTimeout(
            () => {

                toast.style.opacity =
                    "0";

                toast.style.transition =
                    "opacity .3s ease";


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


    /* =====================================================
       INITIALIZE
       ===================================================== */

    setupPageMode();


    console.log(
        isEditMode
            ? `SmartSchool360 Edit Mode loaded for ${editStudentId}`
            : "SmartSchool360 Admission Mode loaded."
    );

});
