/* =========================================================
   SMARTSCHOOL360
   STUDENT ADMISSION + EDIT MODULE
   PHOTO + DOCUMENT MANAGEMENT
   ========================================================= */

"use strict";

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

    const studentPhotoInput =
        document.getElementById("studentPhoto");

    const birthCertificateInput =
        document.getElementById("birthCertificate");

    const previousCertificateInput =
        document.getElementById("previousCertificate");


    /* =====================================================
       URL / MODE
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

    const STORAGE_KEY =
        "smartschool_students";


    function getStudents() {

        try {

            const data =
                localStorage.getItem(
                    STORAGE_KEY
                );

            if (!data) {
                return [];
            }

            const parsed =
                JSON.parse(data);

            return Array.isArray(parsed)
                ? parsed
                : [];

        } catch (error) {

            console.error(
                "Student storage read error:",
                error
            );

            return [];

        }

    }


    function saveStudents(students) {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(students)
            );

            return true;

        } catch (error) {

            console.error(
                "Student storage save error:",
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
                "Student record not found.",
                "error"
            );

            setTimeout(() => {

                window.location.href =
                    "students.html";

            }, 1200);

            return;

        }

    }


    /* =====================================================
       FILE LIMITS
       ===================================================== */

    const PHOTO_MAX_SIZE =
        1 * 1024 * 1024;

    const DOCUMENT_MAX_SIZE =
        700 * 1024;


    /* =====================================================
       TODAY
       ===================================================== */

    function getToday() {

        const date =
            new Date();

        const year =
            date.getFullYear();

        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                date.getDate()
            ).padStart(2, "0");

        return `${year}-${month}-${day}`;

    }


    /* =====================================================
       PAGE MODE
       ===================================================== */

    function setupPageMode() {

        if (!isEditMode) {

            document.title =
                "Student Admission | SmartSchool360";

            if (admissionDate) {

                admissionDate.value =
                    getToday();

            }

            return;

        }


        document.title =
            "Edit Student | SmartSchool360";


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
                "Update student information";

        }


        const moduleTitle =
            document.querySelector(
                ".admission-header h2"
            );

        const moduleText =
            document.querySelector(
                ".admission-header p"
            );


        if (moduleTitle) {

            moduleTitle.textContent =
                "Update Student Record";

        }


        if (moduleText) {

            moduleText.textContent =
                "Edit the student and guardian information below.";

        }


        const badge =
            document.querySelector(
                ".section-badge"
            );


        if (badge) {

            badge.textContent =
                "EDIT STUDENT MODULE";

        }


        if (saveBtn) {

            saveBtn.innerHTML =
                "✓ Update Student";

        }


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
            student.status || "Active"
        );


        /* EXISTING PHOTO */

        const photo =
            student.photo ||
            student.studentPhoto ||
            "";


        if (photo) {

            renderExistingPhoto(
                photo
            );

        }


        /* EXISTING DOCUMENTS */

        renderExistingDocuments(
            student.documents
        );

    }


    /* =====================================================
       SET VALUE
       ===================================================== */

    function setValue(
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


        element.value =
            value === undefined ||
            value === null
                ? ""
                : value;

    }


    /* =====================================================
       PHOTO MANAGEMENT
       ===================================================== */

    function getUploadBox(
        input
    ) {

        if (!input) {
            return null;
        }

        return input.closest(
            ".upload-box"
        );

    }


    function renderExistingPhoto(
        photo
    ) {

        const input =
            studentPhotoInput;

        const box =
            getUploadBox(
                input
            );


        if (!box) {
            return;
        }


        let preview =
            box.querySelector(
                ".existing-photo-preview"
            );


        if (!preview) {

            preview =
                document.createElement(
                    "div"
                );

            preview.className =
                "existing-photo-preview";


            box.prepend(
                preview
            );

        }


        preview.innerHTML = `

            <div
                style="
                    display:flex;
                    flex-direction:column;
                    align-items:center;
                    gap:8px;
                    width:100%;
                "
            >

                <img
                    src="${escapeHTML(photo)}"
                    alt="Existing Student Photo"
                    style="
                        width:82px;
                        height:82px;
                        object-fit:cover;
                        border-radius:50%;
                        border:4px solid #ffffff;
                        box-shadow:0 5px 18px rgba(0,0,0,.15);
                    "
                >

                <span
                    style="
                        font-size:11px;
                        font-weight:800;
                        color:#16a34a;
                    "
                >
                    ✓ Current Photo
                </span>

                <button
                    type="button"
                    id="removeStudentPhoto"
                    style="
                        border:0;
                        border-radius:8px;
                        padding:7px 11px;
                        background:#fee2e2;
                        color:#dc2626;
                        font-size:10px;
                        font-weight:800;
                        cursor:pointer;
                    "
                >
                    Remove Photo
                </button>

            </div>

        `;


        const title =
            box.querySelector(
                "strong"
            );


        if (title) {

            title.textContent =
                "Replace Student Photo";

        }


        box.style.borderColor =
            "#22c55e";


        const removeButton =
            document.getElementById(
                "removeStudentPhoto"
            );


        if (removeButton) {

            removeButton.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    removeCurrentPhoto();

                }
            );

        }

    }


    function removeCurrentPhoto() {

        if (
            !editStudent
        ) {
            return;
        }


        editStudent.photo =
            "";

        editStudent.studentPhoto =
            "";


        const box =
            getUploadBox(
                studentPhotoInput
            );


        if (box) {

            const preview =
                box.querySelector(
                    ".existing-photo-preview"
                );


            if (preview) {
                preview.remove();
            }


            const title =
                box.querySelector(
                    "strong"
                );


            if (title) {

                title.textContent =
                    "Student Photo";

            }


            box.style.borderColor =
                "";

        }


        if (studentPhotoInput) {

            studentPhotoInput.value =
                "";

        }


        showToast(
            "Current photo removed. Save the student to confirm."
        );

    }


    /* =====================================================
       PHOTO INPUT
       ===================================================== */

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


                if (
                    !file.type.startsWith(
                        "image/"
                    )
                ) {

                    showToast(
                        "Please select a valid image.",
                        "error"
                    );

                    studentPhotoInput.value =
                        "";

                    return;

                }


                if (
                    file.size >
                    PHOTO_MAX_SIZE
                ) {

                    showToast(
                        "Student photo must be smaller than 1 MB.",
                        "error"
                    );

                    studentPhotoInput.value =
                        "";

                    return;

                }


                previewSelectedPhoto(
                    file
                );

            }
        );

    }


    function previewSelectedPhoto(
        file
    ) {

        const box =
            getUploadBox(
                studentPhotoInput
            );


        if (!box) {
            return;
        }


        const reader =
            new FileReader();


        reader.onload =
            event => {

                let preview =
                    box.querySelector(
                        ".existing-photo-preview"
                    );


                if (!preview) {

                    preview =
                        document.createElement(
                            "div"
                        );

                    preview.className =
                        "existing-photo-preview";


                    box.prepend(
                        preview
                    );

                }


                preview.innerHTML = `

                    <div
                        style="
                            display:flex;
                            flex-direction:column;
                            align-items:center;
                            gap:7px;
                        "
                    >

                        <img
                            src="${event.target.result}"
                            alt="Selected Student Photo"
                            style="
                                width:82px;
                                height:82px;
                                object-fit:cover;
                                border-radius:50%;
                                border:4px solid #ffffff;
                                box-shadow:0 5px 18px rgba(0,0,0,.15);
                            "
                        >

                        <span
                            style="
                                color:#2563eb;
                                font-size:10px;
                                font-weight:800;
                            "
                        >
                            ✓ New Photo Selected
                        </span>

                    </div>

                `;


                const title =
                    box.querySelector(
                        "strong"
                    );


                if (title) {

                    title.textContent =
                        file.name;

                }


                box.style.borderColor =
                    "#2563eb";

            };


        reader.readAsDataURL(
            file
        );

    }


    /* =====================================================
       DOCUMENT MANAGEMENT
       ===================================================== */

    function setupDocumentInput(
        input,
        label
    ) {

        if (!input) {
            return;
        }


        input.addEventListener(
            "change",
            () => {

                const file =
                    input.files &&
                    input.files[0];


                if (!file) {
                    return;
                }


                if (
                    file.size >
                    DOCUMENT_MAX_SIZE
                ) {

                    showToast(
                        `${label} must be smaller than 700 KB.`,
                        "error"
                    );

                    input.value =
                        "";

                    return;

                }


                const box =
                    getUploadBox(
                        input
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
                        file.name;

                }


                box.style.borderColor =
                    "#2563eb";


                let selected =
                    box.querySelector(
                        ".document-selected"
                    );


                if (!selected) {

                    selected =
                        document.createElement(
                            "small"
                        );

                    selected.className =
                        "document-selected";


                    box.appendChild(
                        selected
                    );

                }


                selected.textContent =
                    "✓ New document selected";


                selected.style.color =
                    "#2563eb";

                selected.style.fontWeight =
                    "800";

            }
        );

    }


    setupDocumentInput(
        birthCertificateInput,
        "Birth Certificate"
    );


    setupDocumentInput(
        previousCertificateInput,
        "Previous Certificate"
    );


    /* =====================================================
       EXISTING DOCUMENTS
       ===================================================== */

    function renderExistingDocuments(
        documents
    ) {

        if (!documents) {
            return;
        }


        renderExistingDocument(
            birthCertificateInput,
            documents.birthCertificate,
            "Birth Certificate"
        );


        renderExistingDocument(
            previousCertificateInput,
            documents.previousCertificate,
            "Previous Certificate"
        );

    }


    function renderExistingDocument(
        input,
        documentData,
        label
    ) {

        if (
            !input ||
            !documentData
        ) {
            return;
        }


        const box =
            getUploadBox(
                input
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
                "✓ Existing " + label;

        }


        box.style.borderColor =
            "#22c55e";


        let info =
            box.querySelector(
                ".existing-document"
            );


        if (!info) {

            info =
                document.createElement(
                    "small"
                );

            info.className =
                "existing-document";


            box.appendChild(
                info
            );

        }


        info.textContent =
            documentData.name ||
            "Document saved";


        info.style.color =
            "#16a34a";

        info.style.fontWeight =
            "800";


        let removeButton =
            box.querySelector(
                ".remove-document-btn"
            );


        if (!removeButton) {

            removeButton =
                document.createElement(
                    "button"
                );

            removeButton.type =
                "button";

            removeButton.className =
                "remove-document-btn";

            removeButton.textContent =
                "Remove";


            removeButton.style.marginTop =
                "7px";

            removeButton.style.border =
                "0";

            removeButton.style.borderRadius =
                "7px";

            removeButton.style.padding =
                "6px 9px";

            removeButton.style.background =
                "#fee2e2";

            removeButton.style.color =
                "#dc2626";

            removeButton.style.fontSize =
                "10px";

            removeButton.style.fontWeight =
                "800";


            box.appendChild(
                removeButton
            );

        }


        removeButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();


                if (
                    editStudent &&
                    editStudent.documents
                ) {

                    if (
                        label ===
                        "Birth Certificate"
                    ) {

                        editStudent.documents.birthCertificate =
                            null;

                    }


                    if (
                        label ===
                        "Previous Certificate"
                    ) {

                        editStudent.documents.previousCertificate =
                            null;

                    }

                }


                removeButton.remove();

                info.remove();


                if (title) {

                    title.textContent =
                        label;

                }


                box.style.borderColor =
                    "";

            }
        );

    }


    /* =====================================================
       READ FILE
       ===================================================== */

    function readFileAsDataURL(
        file
    ) {

        return new Promise(
            (
                resolve,
                reject
            ) => {

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
       PHONE INPUT
       ===================================================== */

    [
        "studentPhone",
        "parentPhone",
        "emergencyContact"
    ].forEach(
        id => {

            const field =
                document.getElementById(
                    id
                );


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
       FORM SUBMIT
       ===================================================== */

    if (form) {

        form.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                if (
                    !form.checkValidity()
                ) {

                    form.reportValidity();

                    return;

                }


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
                    parentPhone.length !==
                    10
                ) {

                    showToast(
                        "Please enter a valid 10-digit parent mobile number.",
                        "error"
                    );

                    return;

                }


                if (
                    studentPhone &&
                    studentPhone.length !==
                    10
                ) {

                    showToast(
                        "Student mobile number must contain 10 digits.",
                        "error"
                    );

                    return;

                }


                if (
                    emergencyContact &&
                    emergencyContact.length !==
                    10
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

                let photo =
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
                    studentPhotoInput.files.length
                ) {

                    const file =
                        studentPhotoInput.files[0];


                    if (
                        file.size >
                        PHOTO_MAX_SIZE
                    ) {

                        showToast(
                            "Student photo must be smaller than 1 MB.",
                            "error"
                        );

                        return;

                    }


                    try {

                        photo =
                            await readFileAsDataURL(
                                file
                            );

                    } catch (error) {

                        showToast(
                            "Unable to process student photo.",
                            "error"
                        );

                        return;

                    }

                }


                /* =========================================
                   DOCUMENTS
                   ========================================= */

                let documents =
                    editStudent &&
                    editStudent.documents
                        ? {
                            ...editStudent.documents
                        }
                        : {
                            birthCertificate: null,
                            previousCertificate: null
                        };


                if (
                    birthCertificateInput &&
                    birthCertificateInput.files &&
                    birthCertificateInput.files.length
                ) {

                    const file =
                        birthCertificateInput.files[0];


                    if (
                        file.size >
                        DOCUMENT_MAX_SIZE
                    ) {

                        showToast(
                            "Birth Certificate must be smaller than 700 KB.",
                            "error"
                        );

                        return;

                    }


                    try {

                        documents.birthCertificate =
                            {
                                name:
                                    file.name,

                                type:
                                    file.type,

                                size:
                                    file.size,

                                data:
                                    await readFileAsDataURL(
                                        file
                                    ),

                                updatedAt:
                                    new Date()
                                        .toISOString()
                            };

                    } catch (error) {

                        showToast(
                            "Unable to process Birth Certificate.",
                            "error"
                        );

                        return;

                    }

                }


                if (
                    previousCertificateInput &&
                    previousCertificateInput.files &&
                    previousCertificateInput.files.length
                ) {

                    const file =
                        previousCertificateInput.files[0];


                    if (
                        file.size >
                        DOCUMENT_MAX_SIZE
                    ) {

                        showToast(
                            "Previous Certificate must be smaller than 700 KB.",
                            "error"
                        );

                        return;

                    }


                    try {

                        documents.previousCertificate =
                            {
                                name:
                                    file.name,

                                type:
                                    file.type,

                                size:
                                    file.size,

                                data:
                                    await readFileAsDataURL(
                                        file
                                    ),

                                updatedAt:
                                    new Date()
                                        .toISOString()
                            };

                    } catch (error) {

                        showToast(
                            "Unable to process Previous Certificate.",
                            "error"
                        );

                        return;

                    }

                }


                /* =========================================
                   STUDENT OBJECT
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
                        ) ||
                        "Active",

                    photo:
                        photo,

                    documents:
                        documents,

                    createdAt:
                        isEditMode
                            ? (
                                editStudent.createdAt ||
                                new Date()
                                    .toISOString()
                            )
                            : new Date()
                                .toISOString(),

                    updatedAt:
                        new Date()
                            .toISOString()

                };


                /* =========================================
                   UPDATE / CREATE
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
                            "Student record not found.",
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
                   SAVE
                   ========================================= */

                if (
                    !saveStudents(
                        students
                    )
                ) {

                    showToast(
                        "Storage is full. Please use smaller files.",
                        "error"
                    );

                    return;

                }


                if (saveBtn) {

                    saveBtn.disabled =
                        true;

                    saveBtn.innerHTML =
                        isEditMode
                            ? "✓ Student Updated"
                            : "✓ Student Registered";

                }


                showToast(
                    isEditMode
                        ? "Student updated successfully."
                        : `Student registered successfully. ID: ${studentData.id}`
                );


                setTimeout(
                    () => {

                        if (isEditMode) {

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
       RESET
       ===================================================== */

    if (resetBtn) {

        resetBtn.addEventListener(
            "click",
            () => {

                const confirmed =
                    window.confirm(
                        isEditMode
                            ? "Reset all changes and restore the saved student data?"
                            : "Reset the complete admission form?"
                    );


                if (!confirmed) {
                    return;
                }


                if (isEditMode) {

                    populateForm(
                        editStudent
                    );


                    if (
                        studentPhotoInput
                    ) {

                        studentPhotoInput.value =
                            "";

                    }


                    if (
                        birthCertificateInput
                    ) {

                        birthCertificateInput.value =
                            "";

                    }


                    if (
                        previousCertificateInput
                    ) {

                        previousCertificateInput.value =
                            "";

                    }


                    showToast(
                        "Original student information restored."
                    );

                    return;

                }


                form.reset();


                if (admissionDate) {

                    admissionDate.value =
                        getToday();

                }


                showToast(
                    "Admission form reset."
                );

            }
        );

    }


    /* =====================================================
       MOBILE MENU
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
       ID GENERATOR
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
       GET VALUE
       ===================================================== */

    function getValue(id) {

        const element =
            document.getElementById(
                id
            );


        if (!element) {
            return "";
        }


        return element.value.trim();

    }


    /* =====================================================
       ESCAPE HTML
       ===================================================== */

    function escapeHTML(
        value
    ) {

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

        const old =
            document.querySelector(
                ".admission-toast"
            );


        if (old) {
            old.remove();
        }


        const toast =
            document.createElement(
                "div"
            );


        toast.className =
            "admission-toast";


        toast.textContent =
            message;


        Object.assign(
            toast.style,
            {

                position: "fixed",

                left: "50%",

                bottom: "24px",

                transform:
                    "translateX(-50%)",

                zIndex: "99999",

                padding:
                    "13px 19px",

                borderRadius:
                    "10px",

                fontSize: "12px",

                fontWeight: "800",

                textAlign: "center",

                maxWidth:
                    "calc(100% - 30px)",

                color: "#ffffff",

                background:
                    type === "error"
                        ? "#dc2626"
                        : "#16a34a",

                boxShadow:
                    "0 10px 30px rgba(0,0,0,.18)"

            }
        );


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
            2800
        );

    }


    /* =====================================================
       INITIALIZE
       ===================================================== */

    setupPageMode();


    console.log(
        isEditMode
            ? "SmartSchool360 Edit Mode + File Management ready."
            : "SmartSchool360 Admission Mode ready."
    );

});
