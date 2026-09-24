/* =========================================
   SMARTSCHOOL360
   STUDENT ADMISSION MODULE
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("admissionForm");
    const resetBtn = document.getElementById("resetBtn");
    const saveBtn = document.getElementById("saveStudentBtn");

    const admissionDate =
        document.getElementById("admissionDate");


    /* =========================================
       TODAY'S DATE
       ========================================= */

    function setToday() {

        if (!admissionDate) return;

        const today = new Date();

        const year = today.getFullYear();

        const month =
            String(today.getMonth() + 1).padStart(2, "0");

        const day =
            String(today.getDate()).padStart(2, "0");

        admissionDate.value =
            `${year}-${month}-${day}`;
    }

    setToday();


    /* =========================================
       MOBILE SIDEBAR
       ========================================= */

    const mobileMenu =
        document.getElementById("mobileMenu");

    const sidebar =
        document.getElementById("sidebar");

    if (mobileMenu && sidebar) {

        mobileMenu.addEventListener("click", () => {

            sidebar.classList.toggle("show");

        });

    }


    /* =========================================
       PHONE NUMBER INPUT
       ========================================= */

    const phoneFields = [

        document.getElementById("studentPhone"),

        document.getElementById("parentPhone"),

        document.getElementById("emergencyContact")

    ];


    phoneFields.forEach(field => {

        if (!field) return;

        field.addEventListener("input", () => {

            field.value =
                field.value
                    .replace(/\D/g, "")
                    .slice(0, 10);

        });

    });


    /* =========================================
       FILE UPLOAD DISPLAY
       ========================================= */

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
            document.getElementById(item.id);

        if (!input) return;

        input.addEventListener("change", () => {

            const box =
                input.closest(".upload-box");

            if (!box) return;

            const title =
                box.querySelector("strong");

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

        });

    });


    /* =========================================
       FORM SUBMIT
       ========================================= */

    if (form) {

        form.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                /* HTML VALIDATION */

                if (!form.checkValidity()) {

                    form.reportValidity();

                    return;

                }


                /* PHONE VALIDATION */

                const parentPhone =
                    document
                        .getElementById("parentPhone")
                        .value
                        .trim();


                const studentPhone =
                    document
                        .getElementById("studentPhone")
                        .value
                        .trim();


                const emergencyContact =
                    document
                        .getElementById("emergencyContact")
                        .value
                        .trim();


                if (parentPhone.length !== 10) {

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
                   CREATE STUDENT
                   ========================================= */

                const student = {

                    id: generateStudentId(),

                    name:
                        getValue("studentName"),

                    dob:
                        getValue("dob"),

                    gender:
                        getValue("gender"),

                    bloodGroup:
                        getValue("bloodGroup"),

                    studentPhone:
                        studentPhone,

                    address:
                        getValue("address"),

                    fatherName:
                        getValue("fatherName"),

                    motherName:
                        getValue("motherName"),

                    parentPhone:
                        parentPhone,

                    parentEmail:
                        getValue("parentEmail"),

                    occupation:
                        getValue("occupation"),

                    emergencyContact:
                        emergencyContact,

                    className:
                        getValue("className"),

                    section:
                        getValue("section"),

                    session:
                        getValue("session"),

                    previousSchool:
                        getValue("previousSchool"),

                    admissionDate:
                        getValue("admissionDate"),

                    status:
                        getValue("studentStatus"),

                    createdAt:
                        new Date().toISOString()

                };


                /* =========================================
                   GET OLD STUDENTS
                   ========================================= */

                let students = [];


                try {

                    students =
                        JSON.parse(
                            localStorage.getItem(
                                "smartschool_students"
                            )
                        ) || [];

                } catch (error) {

                    console.error(
                        "Unable to read student data:",
                        error
                    );

                    students = [];

                }


                /* =========================================
                   SAVE STUDENT
                   ========================================= */

                students.push(student);


                localStorage.setItem(
                    "smartschool_students",
                    JSON.stringify(students)
                );


                /* =========================================
                   SUCCESS
                   ========================================= */

                if (saveBtn) {

                    saveBtn.disabled = true;

                    saveBtn.innerHTML =
                        "✓ Student Registered";

                }


                showToast(
                    `Student registered successfully. ID: ${student.id}`,
                    "success"
                );


                /* =========================================
                   REDIRECT TO STUDENTS
                   ========================================= */

                setTimeout(() => {

                    window.location.href =
                        "students.html";

                }, 1500);

            }
        );

    }


    /* =========================================
       RESET FORM
       ========================================= */

    if (resetBtn) {

        resetBtn.addEventListener(
            "click",
            () => {

                const confirmed =
                    window.confirm(
                        "Are you sure you want to reset the complete admission form?"
                    );


                if (!confirmed) return;


                form.reset();


                setToday();


                uploadFields.forEach(item => {

                    const input =
                        document.getElementById(item.id);

                    if (!input) return;

                    const box =
                        input.closest(".upload-box");

                    const title =
                        box.querySelector("strong");

                    title.textContent =
                        item.defaultText;

                    box.style.borderColor =
                        "";

                });


                showToast(
                    "Admission form has been reset.",
                    "success"
                );

            }
        );

    }


    /* =========================================
       HELPER
       ========================================= */

    function getValue(id) {

        const element =
            document.getElementById(id);

        return element
            ? element.value.trim()
            : "";

    }


    /* =========================================
       STUDENT ID
       ========================================= */

    function generateStudentId() {

        const year =
            new Date().getFullYear();

        const random =
            Math.floor(
                1000 + Math.random() * 9000
            );

        return `SS${year}${random}`;

    }


    /* =========================================
       TOAST MESSAGE
       ========================================= */

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
            document.createElement("div");


        toast.className =
            `admission-toast ${type}`;


        toast.textContent =
            message;


        document.body.appendChild(toast);


        setTimeout(() => {

            toast.style.opacity = "0";

            toast.style.transform =
                "translateY(20px)";


            setTimeout(() => {

                toast.remove();

            }, 300);

        }, 3500);

    }


    console.log(
        "SmartSchool360 Admission Module loaded."
    );

});
