/* =========================================
   SMARTSCHOOL360
   STUDENT ID CARD MODULE
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


    const students = getStudents();


    const student =
        students.find(
            item =>
                String(item.id) ===
                String(studentId)
        );


    /* =========================================
       STUDENT NOT FOUND
       ========================================= */

    if (!student) {

        showNotFound();

        return;

    }


    /* =========================================
       HELPER
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


    /* =========================================
       DATE FORMAT
       ========================================= */

    function formatDate(value) {

        if (!value) return "—";


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


    /* =========================================
       INITIALS
       ========================================= */

    function getInitials(name) {

        if (!name) return "ST";


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


    /* =========================================
       PAGE TITLE
       ========================================= */

    document.title =
        `${student.name || "Student"} ID Card | SmartSchool360`;


    /* =========================================
       POPULATE STUDENT DATA
       ========================================= */

    setText(
        "studentName",
        student.name
    );


    setText(
        "studentId",
        student.id
    );


    setText(
        "studentClass",
        student.className
    );


    setText(
        "studentSection",
        student.section
    );


    setText(
        "studentSession",
        student.session
    );


    setText(
        "parentPhone",
        student.parentPhone
    );


    setText(
        "admissionDate",
        formatDate(
            student.admissionDate
        )
    );


    setText(
        "verificationId",
        student.id
    );


    /* =========================================
       STATUS
       ========================================= */

    const status =
        student.status || "Active";


    setText(
        "studentStatus",
        String(status).toUpperCase() +
        " STUDENT"
    );


    /* =========================================
       STUDENT PHOTO
       ========================================= */

    renderStudentPhoto();


    function renderStudentPhoto() {

        const photoBox =
            getElement("studentPhoto");


        const initials =
            getElement("studentInitials");


        if (!photoBox) return;


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


            image.src =
                photo;


            image.alt =
                `${student.name || "Student"} Photo`;


            image.loading =
                "eager";


            image.decoding =
                "async";


            image.onerror = () => {

                image.remove();

                if (initials) {

                    initials.style.display =
                        "flex";

                }

            };


            photoBox.insertBefore(
                image,
                initials || null
            );


            if (initials) {

                initials.style.display =
                    "none";

            }

        } else {

            if (initials) {

                initials.textContent =
                    getInitials(
                        student.name
                    );

                initials.style.display =
                    "flex";

            }

        }

    }


    /* =========================================
       SIMPLE QR / VERIFICATION PATTERN
       ========================================= */

    createVerificationPattern();


    function createVerificationPattern() {

        const qr =
            getElement("qrCode");


        if (!qr) return;


        const existing =
            qr.querySelector(
                ".qr-generated"
            );


        if (existing) {

            existing.remove();

        }


        const pattern =
            document.createElement("div");


        pattern.className =
            "qr-generated";


        pattern.setAttribute(
            "aria-hidden",
            "true"
        );


        pattern.style.position =
            "absolute";

        pattern.style.inset =
            "0";

        pattern.style.opacity =
            "0.75";

        pattern.style.backgroundImage =
            `
            linear-gradient(
                90deg,
                transparent 40%,
                #ffffff 40%,
                #ffffff 47%,
                transparent 47%
            ),
            linear-gradient(
                transparent 40%,
                #ffffff 40%,
                #ffffff 47%,
                transparent 47%
            )
            `;

        pattern.style.backgroundSize =
            "8px 8px";

        pattern.style.pointerEvents =
            "none";


        qr.appendChild(pattern);

    }


    /* =========================================
       PRINT
       ========================================= */

    const printButton =
        getElement("printBtn");


    if (printButton) {

        printButton.addEventListener(
            "click",
            () => {

                window.print();

            }
        );

    }


    /* =========================================
       SAVE / PRINT BUTTON
       ========================================= */

    const downloadButton =
        getElement("downloadBtn");


    if (downloadButton) {

        downloadButton.addEventListener(
            "click",
            () => {

                window.print();

            }
        );

    }


    /* =========================================
       BACK BUTTON
       ========================================= */

    const backButton =
        getElement("backBtn");


    if (backButton) {

        backButton.addEventListener(
            "click",
            () => {

                window.history.back();

            }
        );

    }


    /* =========================================
       KEYBOARD SHORTCUT
       ========================================= */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.ctrlKey &&
                event.key.toLowerCase() === "p"
            ) {

                event.preventDefault();

                window.print();

            }

        }
    );


    /* =========================================
       CONSOLE
       ========================================= */

    console.log(
        "SmartSchool360 Student ID Card loaded:",
        student.id
    );


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
                    background:#f8fafc;
                    font-family:Arial,sans-serif;
                "
            >

                <div
                    style="
                        width:100%;
                        max-width:460px;
                        padding:40px 25px;
                        text-align:center;
                        background:#ffffff;
                        border-radius:22px;
                        box-shadow:
                            0 20px 60px
                            rgba(15,23,42,.10);
                    "
                >

                    <div
                        style="
                            font-size:55px;
                            margin-bottom:15px;
                        "
                    >
                        🪪
                    </div>


                    <h2
                        style="
                            margin:0 0 10px;
                            color:#0f172a;
                        "
                    >
                        Student Not Found
                    </h2>


                    <p
                        style="
                            margin:0 0 25px;
                            color:#64748b;
                            line-height:1.6;
                        "
                    >
                        The requested student record
                        could not be found in
                        SmartSchool360.
                    </p>


                    <button
                        onclick="
                            window.location.href='students.html'
                        "
                        style="
                            border:0;
                            padding:12px 20px;
                            border-radius:10px;
                            background:#2563eb;
                            color:white;
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

});
