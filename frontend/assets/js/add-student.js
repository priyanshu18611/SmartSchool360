/* =========================================================
   SMARTSCHOOL360
   STUDENT ADMISSION + EDIT MODULE
   ========================================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    const STORAGE_KEY = "smartschool_students";

    /* =====================================================
       DOM
    ===================================================== */

    const form =
        document.getElementById("admissionForm");

    const resetBtn =
        document.getElementById("resetBtn");

    const saveBtn =
        document.getElementById("saveStudentBtn");

    const admissionDate =
        document.getElementById("admissionDate");


    /* =====================================================
       EDIT MODE
    ===================================================== */

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    const editStudentId =
        urlParams.get("id");

    let editMode =
        Boolean(editStudentId);


    /* =====================================================
       LOAD STUDENTS
    ===================================================== */

    function getStudents() {

        try {

            const raw =
                localStorage.getItem(
                    STORAGE_KEY
                );

            if (!raw) {
                return [];
            }

            const data =
                JSON.parse(raw);

            return Array.isArray(data)
                ? data
                : [];

        } catch (error) {

            console.error(
                "Unable to read student data:",
                error
            );

            return [];
        }
    }


    /* =====================================================
       SAVE STUDENTS
    ===================================================== */

    function saveStudents(students) {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(students)
        );
    }


    /* =====================================================
       TODAY'S DATE
    ===================================================== */

    function setToday() {

        if (!admissionDate) {
            return;
        }

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

        admissionDate.value =
            `${year}-${month}-${day}`;
    }


    /* =====================================================
       MOBILE SIDEBAR
    ===================================================== */

    const mobileMenu =
        document.getElementById(
            "mobileMenu"
        );

    const sidebar =
        document.getElementById(
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


    phoneFields.forEach(field => {

        if (!field) {
            return;
        }

        field.addEventListener(
            "input",
            () => {

                field.value =
                    field.value
                        .replace(/\D/g, "")
                        .slice(0, 10);

            }
        );

    });


    /* =====================================================
       FILE UPLOAD DISPLAY
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


    uploadFields.forEach(item => {

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

                    title.textContent =
                        input.files[0].name;

                    box.style.borderColor =
                        "#22c55e";

                } else {

                    title.textContent =
                        item.defaultText;

                    box.style.borderColor =
                        "";

                }

            }
        );

    });


    /* =====================================================
       FORM HELPERS
    ===================================================== */

    function getValue(id) {

        const element =
            document.getElementById(id);

        return element
            ? element.value.trim()
            : "";
    }


    function setValue(id, value) {

        const element =
            document.getElementById(id);

        if (!element) {
            return;
        }

        element.value =
            value ?? "";
    }


    /* =====================================================
       EDIT MODE - LOAD EXISTING STUDENT
    ===================================================== */

    function loadEditStudent() {

        if (!editMode) {
            return;
        }


        const students =
            getStudents();


        const student =
            students.find(
                item =>
                    String(item.id) ===
                    String(editStudentId)
            );


        if (!student) {

            alert(
                "Student record not found."
            );

            window.location.href =
                "students.html";

            return;
        }


        /* ================================================
           FORM VALUES
        ================================================ */

        setValue(
            "studentName",
            student.name
        );

        setValue(
            "dob",
            student.dob
        );

        setValue(
            "gender",
            student.gender
        );

        setValue(
            "bloodGroup",
            student.bloodGroup
        );

        setValue(
            "studentPhone",
            student.studentPhone
        );

        setValue(
            "address",
            student.address
        );

        setValue(
            "fatherName",
            student.fatherName
        );

        setValue(
            "motherName",
            student.motherName
        );

        setValue(
            "parentPhone",
            student.parentPhone
        );

        setValue(
            "parentEmail",
            student.parentEmail
        );

        setValue(
            "occupation",
            student.occupation
        );

        setValue(
            "emergencyContact",
            student.emergencyContact
        );

        setValue(
            "className",
            student.className
        );

        setValue(
            "section",
            student.section
        );

        setValue(
            "session",
            student.session
        );

        setValue(
            "previousSchool",
            student.previousSchool
        );

        setValue(
            "admissionDate",
            student.admissionDate
        );

        setValue(
            "studentStatus",
            student.status
        );


        /* ================================================
           CHANGE PAGE TITLE
        ================================================ */

        const heading =
            document.querySelector(
                ".page-heading h1"
            );

        const subtitle =
            document.querySelector(
                ".page-heading p"
            );


        if (heading) {

            heading.textContent =
                "Edit Student";

        }


        if (subtitle) {

            subtitle.textContent =
                `Update student record · ${student.id}`;

        }


        /* ================================================
           CHANGE SAVE BUTTON
        ================================================ */

        if (saveBtn) {

            saveBtn.innerHTML =
                "✓ Update Student";

        }


        /* ================================================
           UPDATE DOCUMENT TITLE
        ================================================ */

        document.title =
            "Edit Student | SmartSchool360";


        console.log(
            "Edit mode loaded:",
            student
        );

    }


    /* =====================================================
       FORM SUBMIT
    ===================================================== */

    if (form) {

        form.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                /* =========================================
                   HTML VALIDATION
                ========================================= */

                if (!form.checkValidity()) {

                    form.reportValidity();

                    return;
                }


                /* =========================================
                   PHONE VALIDATION
                ========================================= */

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
                   GET EXISTING STUDENTS
                ========================================= */

                const students =
                    getStudents();


                /* =========================================
                   EDIT EXISTING STUDENT
                ========================================= */

                if (editMode) {

                    const index =
                        students.findIndex(
                            student =>
                                String(student.id) ===
                                String(editStudentId)
                        );


                    if (index === -1) {

                        showToast(
                            "Student record not found.",
                            "error"
                        );

                        return;
                    }


                    const oldStudent =
                        students[index];


                    /* =====================================
                       UPDATE RECORD
                    ===================================== */

                    students[index] = {

                        ...oldStudent,

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
                            ),

                        updatedAt:
                            new Date()
                                .toISOString()

                    };


                    /* =====================================
                       SAVE UPDATED DATA
                    ===================================== */

                    saveStudents(
                        students
                    );


                    /* =====================================
                       BUTTON
                    ===================================== */

                    if (saveBtn) {

                        saveBtn.disabled =
                            true;

                        saveBtn.innerHTML =
                            "✓ Student Updated";

                    }


                    showToast(
                        "Student record updated successfully.",
                        "success"
                    );


                    /* =====================================
                       REDIRECT
                    ===================================== */

                    setTimeout(
                        () => {

                            window.location.href =
                                "student-profile.html?id=" +
                                encodeURIComponent(
                                    editStudentId
                                );

                        },
                        1200
                    );


                    return;
                }


                /* =========================================
                   NEW STUDENT
                ========================================= */

                const student = {

                    id:
                        generateStudentId(),

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
                        ),

                    createdAt:
                        new Date()
                            .toISOString()

                };


                /* =========================================
                   ADD STUDENT
                ========================================= */

                students.push(
                    student
                );


                saveStudents(
                    students
                );


                /* =========================================
                   SUCCESS
                ========================================= */

                if (saveBtn) {

                    saveBtn.disabled =
                        true;

                    saveBtn.innerHTML =
                        "✓ Student Registered";

                }


                showToast(
                    `Student registered successfully. ID: ${student.id}`,
                    "success"
                );


                /* =========================================
                   REDIRECT
                ========================================= */

                setTimeout(
                    () => {

                        window.location.href =
                            "students.html";

                    },
                    1500
                );

            }
        );

    }


    /* =====================================================
       RESET
    ===================================================== */

    if (resetBtn) {

        resetBtn.addEventListener(
            "click",
            () => {

                const confirmed =
                    window.confirm(
                        "Are you sure you want to reset the complete admission form?"
                    );


                if (!confirmed) {
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
       GENERATE STUDENT ID
    ===================================================== */

    function generateStudentId() {

        const year =
            new Date().getFullYear();


        const random =
            Math.floor(
                1000 +
                Math.random() * 9000
            );


        return (
            `SS${year}${random}`
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


        document.body.appendChild(
            toast
        );


        setTimeout(
            () => {

                toast.style.opacity =
                    "0";

                toast.style.transform =
                    "translateY(20px)";


                setTimeout(
                    () => {

                        toast.remove();

                    },
                    300
                );

            },
            3500
        );

    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    if (editMode) {

        loadEditStudent();

    } else {

        setToday();

    }


    console.log(
        "SmartSchool360 Admission/Edit Module loaded."
    );

});
