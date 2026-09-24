/* =========================================================
   SMARTSCHOOL360
   STUDENT PROFILE MODULE
   ========================================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    const STORAGE_KEY = "smartschool_students";


    /* =====================================================
       URL
    ===================================================== */

    const params =
        new URLSearchParams(
            window.location.search
        );

    const studentId =
        params.get("id");


    /* =====================================================
       HELPERS
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
                "Unable to load student records:",
                error
            );

            return [];
        }
    }


    function getValue(
        value,
        fallback = "Not Available"
    ) {

        if (
            value === undefined ||
            value === null ||
            String(value).trim() === ""
        ) {

            return fallback;
        }

        return String(value);
    }


    function setText(
        id,
        value,
        fallback = "Not Available"
    ) {

        const element =
            document.getElementById(id);


        if (!element) {
            return;
        }


        element.textContent =
            getValue(
                value,
                fallback
            );
    }


    function formatDate(value) {

        if (!value) {
            return "Not Available";
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


    function getInitials(name) {

        const cleanName =
            getValue(
                name,
                "Student"
            );


        const words =
            cleanName
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


    /* =====================================================
       STATUS
    ===================================================== */

    function setStatus(
        id,
        status
    ) {

        const element =
            document.getElementById(id);


        if (!element) {
            return;
        }


        const finalStatus =
            getValue(
                status,
                "Active"
            );


        element.textContent =
            finalStatus;


        element.classList.remove(
            "status-active",
            "status-inactive",
            "status-pending",
            "active",
            "inactive"
        );


        const normalized =
            finalStatus.toLowerCase();


        if (
            normalized === "active" ||
            normalized === "approved"
        ) {

            element.classList.add(
                "status-active"
            );

        } else if (
            normalized === "inactive" ||
            normalized === "left"
        ) {

            element.classList.add(
                "status-inactive"
            );

        } else {

            element.classList.add(
                "status-pending"
            );
        }
    }


    /* =====================================================
       FIND STUDENT
    ===================================================== */

    const students =
        getStudents();


    const student =
        students.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    studentId
                )
        );


    /* =====================================================
       STUDENT NOT FOUND
    ===================================================== */

    if (!student) {

        document.body.innerHTML = `

            <div
                style="
                    min-height:100vh;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    padding:24px;
                    background:#f5f7fb;
                    font-family:Arial,sans-serif;
                "
            >

                <div
                    style="
                        width:100%;
                        max-width:480px;
                        background:#ffffff;
                        padding:40px 25px;
                        border-radius:22px;
                        text-align:center;
                        box-shadow:0 20px 60px rgba(0,0,0,.10);
                    "
                >

                    <div
                        style="
                            width:70px;
                            height:70px;
                            margin:0 auto 20px;
                            border-radius:50%;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            background:#fff1f2;
                            font-size:32px;
                        "
                    >
                        ⚠️
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


                    <a
                        href="students.html"
                        style="
                            display:inline-block;
                            padding:12px 22px;
                            border-radius:10px;
                            background:#4f46e5;
                            color:#ffffff;
                            text-decoration:none;
                            font-weight:600;
                        "
                    >
                        ← Back to Students
                    </a>

                </div>

            </div>

        `;

        return;
    }


    /* =====================================================
       STUDENT DATA
    ===================================================== */

    const name =
        getValue(
            student.name,
            "Student"
        );


    const id =
        getValue(
            student.id,
            "N/A"
        );


    const className =
        getValue(
            student.className,
            "N/A"
        );


    const section =
        getValue(
            student.section,
            "N/A"
        );


    const gender =
        getValue(
            student.gender,
            "N/A"
        );


    const dob =
        student.dob || "";


    const bloodGroup =
        getValue(
            student.bloodGroup,
            "N/A"
        );


    const studentPhone =
        getValue(
            student.studentPhone,
            "N/A"
        );


    const address =
        getValue(
            student.address,
            "N/A"
        );


    const fatherName =
        getValue(
            student.fatherName,
            "N/A"
        );


    const motherName =
        getValue(
            student.motherName,
            "N/A"
        );


    const parentPhone =
        getValue(
            student.parentPhone,
            "N/A"
        );


    const parentEmail =
        getValue(
            student.parentEmail,
            "N/A"
        );


    const occupation =
        getValue(
            student.occupation,
            "N/A"
        );


    const emergencyContact =
        getValue(
            student.emergencyContact,
            "N/A"
        );


    const session =
        getValue(
            student.session,
            "2026-27"
        );


    const previousSchool =
        getValue(
            student.previousSchool,
            "N/A"
        );


    const admissionDate =
        student.admissionDate || "";


    const status =
        getValue(
            student.status,
            "Active"
        );


    /* =====================================================
       PROFILE HERO
    ===================================================== */

    setText(
        "profileName",
        name
    );


    setText(
        "profileId",
        id
    );


    setText(
        "profileClass",
        className
    );


    setText(
        "profileSection",
        section
    );


    const initials =
        document.getElementById(
            "profileInitials"
        );


    if (initials) {

        initials.textContent =
            getInitials(name);

    }


    setStatus(
        "profileStatus",
        status
    );


    /* =====================================================
       QUICK STATS
    ===================================================== */

    setText(
        "profileDob",
        formatDate(dob)
    );


    setText(
        "profileGender",
        gender
    );


    setText(
        "profileSession",
        session
    );


    setText(
        "profileAdmissionDate",
        formatDate(
            admissionDate
        )
    );


    /* =====================================================
       PERSONAL INFORMATION
    ===================================================== */

    setText(
        "infoName",
        name
    );


    setText(
        "infoDob",
        formatDate(dob)
    );


    setText(
        "infoGender",
        gender
    );


    setText(
        "infoBlood",
        bloodGroup
    );


    setText(
        "infoStudentPhone",
        studentPhone
    );


    setText(
        "infoAddress",
        address
    );


    /* =====================================================
       PARENT / GUARDIAN
    ===================================================== */

    setText(
        "infoFather",
        fatherName
    );


    setText(
        "infoMother",
        motherName
    );


    setText(
        "infoParentPhone",
        parentPhone
    );


    setText(
        "infoParentEmail",
        parentEmail
    );


    setText(
        "infoOccupation",
        occupation
    );


    setText(
        "infoEmergency",
        emergencyContact
    );


    /* =====================================================
       ACADEMIC INFORMATION
    ===================================================== */

    setText(
        "infoClass",
        className
    );


    setText(
        "infoSection",
        section
    );


    setText(
        "infoSession",
        session
    );


    setText(
        "infoPreviousSchool",
        previousSchool
    );


    setText(
        "infoAdmissionDate",
        formatDate(
            admissionDate
        )
    );


    setStatus(
        "infoStatus",
        status
    );


    /* =====================================================
       STUDENT RECORD
    ===================================================== */

    setText(
        "recordStudentId",
        id
    );


    setStatus(
        "recordStatus",
        status
    );


    setText(
        "recordSession",
        session
    );


    /* =====================================================
       PRINT
    ===================================================== */

    const printButton =
        document.getElementById(
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
       EDIT STUDENT
    ===================================================== */

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
                        id
                    );

            }
        );

    }


    /* =====================================================
       BACK TO STUDENTS
    ===================================================== */

    const backButtons =
        document.querySelectorAll(
            '[href="students.html"]'
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
       DOCUMENT TITLE
    ===================================================== */

    document.title =
        `${name} | Student Profile | SmartSchool360`;


    /* =====================================================
       LOG
    ===================================================== */

    console.log(
        "SmartSchool360 Student Profile:",
        student
    );

});
