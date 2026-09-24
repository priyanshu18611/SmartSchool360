document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = "smartschool_students";

    // -----------------------------
    // Get Student ID from URL
    // -----------------------------
    const params = new URLSearchParams(window.location.search);
    const studentId = params.get("id");

    // -----------------------------
    // Helper Functions
    // -----------------------------
    function getStudents() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error("Unable to read student data:", error);
            return [];
        }
    }

    function formatDate(dateValue) {
        if (!dateValue) return "Not Available";

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

    function getInitials(name) {
        if (!name) return "ST";

        const words = name
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (words.length === 1) {
            return words[0].substring(0, 2).toUpperCase();
        }

        return (
            words[0].charAt(0) +
            words[words.length - 1].charAt(0)
        ).toUpperCase();
    }

    function valueOrFallback(value) {
        if (
            value === undefined ||
            value === null ||
            String(value).trim() === ""
        ) {
            return "Not Available";
        }

        return value;
    }

    function setText(id, value) {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = valueOrFallback(value);
        }
    }

    function setStatus(elementId, status) {
        const element = document.getElementById(elementId);

        if (!element) return;

        const finalStatus = valueOrFallback(status);

        element.textContent = finalStatus;

        element.classList.remove(
            "status-active",
            "status-inactive",
            "status-pending"
        );

        const normalizedStatus = String(finalStatus).toLowerCase();

        if (
            normalizedStatus === "active" ||
            normalizedStatus === "approved"
        ) {
            element.classList.add("status-active");
        } else if (
            normalizedStatus === "inactive" ||
            normalizedStatus === "left"
        ) {
            element.classList.add("status-inactive");
        } else {
            element.classList.add("status-pending");
        }
    }

    // -----------------------------
    // Find Student
    // -----------------------------
    const students = getStudents();

    const student = students.find(
        item =>
            String(item.id || item.studentId || "") ===
            String(studentId || "")
    );

    // -----------------------------
    // Student Not Found
    // -----------------------------
    if (!student) {
        document.body.innerHTML = `
            <div style="
                min-height:100vh;
                display:flex;
                align-items:center;
                justify-content:center;
                padding:24px;
                font-family:Arial,sans-serif;
                background:#f5f7fb;
            ">
                <div style="
                    max-width:520px;
                    width:100%;
                    background:white;
                    padding:40px 28px;
                    border-radius:20px;
                    text-align:center;
                    box-shadow:0 15px 50px rgba(0,0,0,0.08);
                ">
                    <div style="
                        width:70px;
                        height:70px;
                        margin:0 auto 20px;
                        border-radius:50%;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        background:#fff1f2;
                        font-size:32px;
                    ">
                        ⚠️
                    </div>

                    <h2 style="
                        margin:0 0 10px;
                        color:#111827;
                    ">
                        Student Not Found
                    </h2>

                    <p style="
                        margin:0 0 25px;
                        color:#6b7280;
                        line-height:1.6;
                    ">
                        The requested student record could not be found.
                        Please return to the student list and try again.
                    </p>

                    <a href="students.html" style="
                        display:inline-block;
                        padding:12px 22px;
                        border-radius:10px;
                        background:#2563eb;
                        color:white;
                        text-decoration:none;
                        font-weight:600;
                    ">
                        ← Back to Students
                    </a>
                </div>
            </div>
        `;

        return;
    }

    // -----------------------------
    // Extract Student Information
    // -----------------------------
    const name =
        student.name ||
        student.fullName ||
        student.studentName ||
        "Student";

    const id =
        student.id ||
        student.studentId ||
        "Not Available";

    const className =
        student.class ||
        student.className ||
        student.standard ||
        "Not Available";

    const section =
        student.section ||
        student.classSection ||
        "Not Available";

    const status =
        student.status ||
        "Active";

    const dob =
        student.dob ||
        student.dateOfBirth ||
        "";

    const gender =
        student.gender ||
        "Not Available";

    const session =
        student.session ||
        student.academicSession ||
        "2026-27";

    const admissionDate =
        student.admissionDate ||
        student.dateOfAdmission ||
        "";

    const bloodGroup =
        student.bloodGroup ||
        student.blood ||
        "";

    const studentPhone =
        student.studentPhone ||
        student.phone ||
        "";

    const address =
        student.address ||
        student.fullAddress ||
        "";

    const father =
        student.fatherName ||
        student.father ||
        student.parentName ||
        "";

    const mother =
        student.motherName ||
        student.mother ||
        "";

    const parentPhone =
        student.parentPhone ||
        student.fatherPhone ||
        student.guardianPhone ||
        student.contactNumber ||
        "";

    const parentEmail =
        student.parentEmail ||
        student.email ||
        "";

    const occupation =
        student.parentOccupation ||
        student.occupation ||
        "";

    const emergency =
        student.emergencyContact ||
        student.emergencyPhone ||
        parentPhone ||
        "";

    const previousSchool =
        student.previousSchool ||
        student.previousSchoolName ||
        "";

    // -----------------------------
    // Profile Hero
    // -----------------------------
    setText("profileName", name);
    setText("profileId", id);
    setText("profileClass", className);
    setText("profileSection", section);

    const initialsElement = document.getElementById("profileInitials");

    if (initialsElement) {
        initialsElement.textContent = getInitials(name);
    }

    setStatus("profileStatus", status);

    // -----------------------------
    // Quick Stats
    // -----------------------------
    setText("profileDob", formatDate(dob));
    setText("profileGender", gender);
    setText("profileSession", session);
    setText("profileAdmissionDate", formatDate(admissionDate));

    // -----------------------------
    // Personal Information
    // -----------------------------
    setText("infoName", name);
    setText("infoDob", formatDate(dob));
    setText("infoGender", gender);
    setText("infoBlood", bloodGroup);
    setText("infoStudentPhone", studentPhone);
    setText("infoAddress", address);

    // -----------------------------
    // Parent / Guardian Information
    // -----------------------------
    setText("infoFather", father);
    setText("infoMother", mother);
    setText("infoParentPhone", parentPhone);
    setText("infoParentEmail", parentEmail);
    setText("infoOccupation", occupation);
    setText("infoEmergency", emergency);

    // -----------------------------
    // Academic Information
    // -----------------------------
    setText("infoClass", className);
    setText("infoSection", section);
    setText("infoSession", session);
    setText("infoPreviousSchool", previousSchool);
    setText("infoAdmissionDate", formatDate(admissionDate));
    setStatus("infoStatus", status);

    // -----------------------------
    // Student Record
    // -----------------------------
    setText("recordStudentId", id);
    setStatus("recordStatus", status);
    setText("recordSession", session);

    // -----------------------------
    // Print Profile
    // -----------------------------
    const printButton = document.getElementById("printProfileBtn");

    if (printButton) {
        printButton.addEventListener("click", () => {
            window.print();
        });
    }

    // -----------------------------
    // Back to Students
    // -----------------------------
    const backButtons = document.querySelectorAll(
        '[href="students.html"]'
    );

    backButtons.forEach(button => {
        button.addEventListener("click", event => {
            event.preventDefault();
            window.location.href = "students.html";
        });
    });

    // -----------------------------
    // Edit Student
    // -----------------------------
    const editButton = document.getElementById("editStudentBtn");

    if (editButton) {
        editButton.addEventListener("click", () => {
            alert(
                "Edit Student module is coming next. Your student record is safe."
            );
        });
    }

    // -----------------------------
    // Mobile Sidebar Fallback
    // -----------------------------
    const menuButton = document.querySelector(
        ".mobile-menu-btn, .menu-toggle"
    );

    const sidebar = document.querySelector(".sidebar");

    if (menuButton && sidebar) {
        menuButton.addEventListener("click", () => {
            sidebar.classList.toggle("active");
        });
    }

    console.log("SmartSchool360 Student Profile Loaded:", student);
});
