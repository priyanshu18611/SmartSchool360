/* =========================================================
   SMARTSCHOOL360
   STUDENT DOCUMENT MANAGEMENT
   VIEW / DOWNLOAD / REMOVE
   ========================================================= */

"use strict";


document.addEventListener(
    "DOMContentLoaded",
    function () {


        /* =====================================================
           CONFIG
           ===================================================== */

        const STORAGE_KEY =
            "smartschool_students";


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
           DOM
           ===================================================== */

        const studentAvatar =
            document.getElementById(
                "studentAvatar"
            );


        const studentName =
            document.getElementById(
                "studentName"
            );


        const studentStatus =
            document.getElementById(
                "studentStatus"
            );


        const studentIdElement =
            document.getElementById(
                "studentId"
            );


        const studentClass =
            document.getElementById(
                "studentClass"
            );


        const studentSection =
            document.getElementById(
                "studentSection"
            );


        const totalDocuments =
            document.getElementById(
                "totalDocuments"
            );


        const availableDocuments =
            document.getElementById(
                "availableDocuments"
            );


        const refreshDocumentsBtn =
            document.getElementById(
                "refreshDocumentsBtn"
            );


        const backProfileBtn =
            document.getElementById(
                "backProfileBtn"
            );


        const backStudentsBtn =
            document.getElementById(
                "backStudentsBtn"
            );


        const mobileMenu =
            document.getElementById(
                "mobileMenu"
            );


        const sidebar =
            document.getElementById(
                "sidebar"
            );


        /* =====================================================
           DOCUMENT DEFINITIONS
           ===================================================== */

        const DOCUMENTS = {

            birthCertificate: {

                title:
                    "Birth Certificate",

                statusId:
                    "birthCertificateStatus",

                metaId:
                    "birthCertificateMeta"

            },


            previousCertificate: {

                title:
                    "Previous Certificate",

                statusId:
                    "previousCertificateStatus",

                metaId:
                    "previousCertificateMeta"

            }

        };


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


                const parsed =
                    JSON.parse(
                        raw
                    );


                return Array.isArray(
                    parsed
                )
                    ? parsed
                    : [];

            } catch (error) {

                console.error(
                    "Unable to read student records:",
                    error
                );


                return [];

            }

        }


        let students =
            getStudents();


        /* =====================================================
           FIND STUDENT
           ===================================================== */

        let student =
            null;


        if (studentId) {

            student =
                students.find(
                    item =>
                        String(
                            item.id
                        ) ===
                        String(
                            studentId
                        )
                );

        }


        /* =====================================================
           NOT FOUND
           ===================================================== */

        if (!student) {

            showNotFound();

            return;

        }


        /* =====================================================
           HELPERS
           ===================================================== */

        function safeValue(
            value,
            fallback = "—"
        ) {

            if (
                value === undefined ||
                value === null ||
                String(value).trim() === ""
            ) {

                return fallback;

            }


            return String(
                value
            ).trim();

        }


        function getInitials(
            name
        ) {

            const clean =
                safeValue(
                    name,
                    "Student"
                );


            const parts =
                clean
                    .split(/\s+/)
                    .filter(Boolean);


            if (
                parts.length === 1
            ) {

                return parts[0]
                    .substring(
                        0,
                        2
                    )
                    .toUpperCase();

            }


            return (
                parts[0][0] +
                parts[
                    parts.length - 1
                ][0]
            ).toUpperCase();

        }


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
           NORMALIZE DOCUMENT
           ===================================================== */

        function getDocument(
            type
        ) {

            if (
                !student.documents
            ) {

                return null;

            }


            const documentData =
                student.documents[type];


            if (
                !documentData
            ) {

                return null;

            }


            /*
             Supported structure:

             {
                 name,
                 type,
                 size,
                 data,
                 updatedAt
             }
            */


            if (
                typeof documentData ===
                "string"
            ) {

                return {

                    name:
                        type ===
                        "birthCertificate"
                            ? "Birth Certificate"
                            : "Previous Certificate",

                    type:
                        "",

                    size:
                        0,

                    data:
                        documentData,

                    updatedAt:
                        ""

                };

            }


            if (
                typeof documentData ===
                "object" &&
                documentData.data
            ) {

                return documentData;

            }


            return null;

        }


        /* =====================================================
           FILE SIZE
           ===================================================== */

        function formatFileSize(
            bytes
        ) {

            const size =
                Number(
                    bytes
                );


            if (
                !size ||
                Number.isNaN(size)
            ) {

                return "";

            }


            if (
                size < 1024
            ) {

                return `${size} B`;

            }


            if (
                size < 1024 * 1024
            ) {

                return (
                    `${(
                        size / 1024
                    ).toFixed(1)} KB`
                );

            }


            return (
                `${(
                    size /
                    (1024 * 1024)
                ).toFixed(1)} MB`
            );

        }


        /* =====================================================
           FILE TYPE
           ===================================================== */

        function getFileType(
            documentData
        ) {

            const type =
                safeValue(
                    documentData.type,
                    ""
                );


            if (
                type
            ) {

                return type;

            }


            const name =
                safeValue(
                    documentData.name,
                    ""
                ).toLowerCase();


            if (
                name.endsWith(
                    ".pdf"
                )
            ) {

                return "application/pdf";

            }


            if (
                name.endsWith(
                    ".png"
                )
            ) {

                return "image/png";

            }


            if (
                name.endsWith(
                    ".jpg"
                ) ||
                name.endsWith(
                    ".jpeg"
                )
            ) {

                return "image/jpeg";

            }


            return "";

        }


        /* =====================================================
           INITIALIZE STUDENT HEADER
           ===================================================== */

        function renderStudentHeader() {

            const name =
                safeValue(
                    student.name,
                    "Student Name"
                );


            const status =
                safeValue(
                    student.status,
                    "Active"
                );


            const cls =
                safeValue(
                    student.className
                );


            const section =
                safeValue(
                    student.section
                );


            if (studentName) {

                studentName.textContent =
                    name;

            }


            if (studentStatus) {

                studentStatus.textContent =
                    status;


                const normalized =
                    status.toLowerCase();


                if (
                    normalized !==
                    "active"
                ) {

                    studentStatus.style.background =
                        "#fef2f2";

                    studentStatus.style.color =
                        "#dc2626";

                }

            }


            if (studentIdElement) {

                studentIdElement.textContent =
                    safeValue(
                        student.id
                    );

            }


            if (studentClass) {

                studentClass.textContent =
                    cls;

            }


            if (studentSection) {

                studentSection.textContent =
                    section;

            }


            if (studentAvatar) {

                const photo =
                    student.photo ||
                    student.studentPhoto ||
                    "";


                if (photo) {

                    studentAvatar.innerHTML =
                        "";


                    const image =
                        document.createElement(
                            "img"
                        );


                    image.src =
                        photo;


                    image.alt =
                        name;


                    studentAvatar.appendChild(
                        image
                    );

                } else {

                    studentAvatar.textContent =
                        getInitials(
                            name
                        );

                }

            }

        }


        /* =====================================================
           RENDER DOCUMENTS
           ===================================================== */

        function renderDocuments() {

            let available =
                0;


            const total =
                Object.keys(
                    DOCUMENTS
                ).length;


            Object.keys(
                DOCUMENTS
            ).forEach(
                function (type) {

                    const config =
                        DOCUMENTS[type];


                    const documentData =
                        getDocument(
                            type
                        );


                    const statusElement =
                        document.getElementById(
                            config.statusId
                        );


                    const metaElement =
                        document.getElementById(
                            config.metaId
                        );


                    const card =
                        document.querySelector(
                            `.document-card[data-document="${type}"]`
                        );


                    if (
                        !documentData
                    ) {

                        if (
                            statusElement
                        ) {

                            statusElement.textContent =
                                "Not uploaded";

                            statusElement.classList.remove(
                                "available"
                            );

                        }


                        if (
                            metaElement
                        ) {

                            metaElement.textContent =
                                "PDF / Image";

                        }


                        if (card) {

                            card.classList.add(
                                "empty"
                            );

                        }


                        return;

                    }


                    available++;


                    if (
                        statusElement
                    ) {

                        statusElement.textContent =
                            "✓ Available";

                        statusElement.classList.add(
                            "available"
                        );

                    }


                    if (
                        metaElement
                    ) {

                        const fileName =
                            safeValue(
                                documentData.name,
                                config.title
                            );


                        const size =
                            formatFileSize(
                                documentData.size
                            );


                        metaElement.textContent =
                            size
                                ? `${fileName} • ${size}`
                                : fileName;

                    }


                    if (card) {

                        card.classList.remove(
                            "empty"
                        );

                    }

                }
            );


            if (totalDocuments) {

                totalDocuments.textContent =
                    total;

            }


            if (availableDocuments) {

                availableDocuments.textContent =
                    available;

            }


            updateActionButtons();

        }


        /* =====================================================
           ACTION BUTTONS
           ===================================================== */

        function updateActionButtons() {

            const buttons =
                document.querySelectorAll(
                    ".document-card"
                );


            buttons.forEach(
                function (card) {

                    const type =
                        card.dataset.document;


                    const documentData =
                        getDocument(
                            type
                        );


                    const viewButton =
                        card.querySelector(
                            ".view-document-btn"
                        );


                    const downloadButton =
                        card.querySelector(
                            ".download-document-btn"
                        );


                    const deleteButton =
                        card.querySelector(
                            ".delete-document-btn"
                        );


                    const disabled =
                        !documentData;


                    if (
                        viewButton
                    ) {

                        viewButton.disabled =
                            disabled;

                        viewButton.style.opacity =
                            disabled
                                ? "0.45"
                                : "1";

                        viewButton.style.cursor =
                            disabled
                                ? "not-allowed"
                                : "pointer";

                    }


                    if (
                        downloadButton
                    ) {

                        downloadButton.disabled =
                            disabled;

                        downloadButton.style.opacity =
                            disabled
                                ? "0.45"
                                : "1";

                        downloadButton.style.cursor =
                            disabled
                                ? "not-allowed"
                                : "pointer";

                    }


                    if (
                        deleteButton
                    ) {

                        deleteButton.disabled =
                            disabled;

                        deleteButton.style.opacity =
                            disabled
                                ? "0.45"
                                : "1";

                        deleteButton.style.cursor =
                            disabled
                                ? "not-allowed"
                                : "pointer";

                    }

                }
            );

        }


        /* =====================================================
           VIEW DOCUMENT
           ===================================================== */

        function viewDocument(
            type
        ) {

            const documentData =
                getDocument(
                    type
                );


            if (
                !documentData ||
                !documentData.data
            ) {

                showToast(
                    "This document has not been uploaded.",
                    "error"
                );

                return;

            }


            const title =
                DOCUMENTS[type].title;


            const fileType =
                getFileType(
                    documentData
                );


            const modal =
                createDocumentModal(
                    title
                );


            const body =
                modal.querySelector(
                    ".document-modal-body"
                );


            if (
                fileType.startsWith(
                    "image/"
                )
            ) {

                const image =
                    document.createElement(
                        "img"
                    );


                image.src =
                    documentData.data;


                image.alt =
                    title;


                body.appendChild(
                    image
                );


            } else if (
                fileType ===
                "application/pdf"
            ) {

                const iframe =
                    document.createElement(
                        "iframe"
                    );


                iframe.src =
                    documentData.data;


                iframe.title =
                    title;


                body.appendChild(
                    iframe
                );


            } else {

                const message =
                    document.createElement(
                        "div"
                    );


                message.style.padding =
                    "30px";

                message.style.textAlign =
                    "center";

                message.style.color =
                    "#64748b";


                message.innerHTML = `

                    <div
                        style="
                            font-size:40px;
                            margin-bottom:12px;
                        "
                    >
                        📄
                    </div>

                    <strong>
                        ${escapeHTML(title)}
                    </strong>

                    <p>
                        Preview is not available
                        for this file type.
                    </p>

                    <button
                        type="button"
                        id="modalDownloadBtn"
                        style="
                            border:0;
                            border-radius:9px;
                            padding:10px 15px;
                            background:#4f46e5;
                            color:#fff;
                            font-weight:800;
                            cursor:pointer;
                        "
                    >
                        ⬇️ Download File
                    </button>

                `;


                body.appendChild(
                    message
                );


                const modalDownload =
                    message.querySelector(
                        "#modalDownloadBtn"
                    );


                if (
                    modalDownload
                ) {

                    modalDownload.addEventListener(
                        "click",
                        function () {

                            downloadDocument(
                                type
                            );

                        }
                    );

                }

            }

        }


        /* =====================================================
           CREATE MODAL
           ===================================================== */

        function createDocumentModal(
            title
        ) {

            closeExistingModal();


            const modal =
                document.createElement(
                    "div"
                );


            modal.className =
                "document-modal show";


            modal.innerHTML = `

                <div
                    class="document-modal-card"
                >

                    <div
                        class="document-modal-header"
                    >

                        <h3>
                            ${escapeHTML(title)}
                        </h3>

                        <button
                            type="button"
                            class="document-modal-close"
                            aria-label="Close"
                        >
                            ✕
                        </button>

                    </div>


                    <div
                        class="document-modal-body"
                    ></div>

                </div>

            `;


            document.body.appendChild(
                modal
            );


            const closeButton =
                modal.querySelector(
                    ".document-modal-close"
                );


            if (closeButton) {

                closeButton.addEventListener(
                    "click",
                    closeExistingModal
                );

            }


            modal.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target ===
                        modal
                    ) {

                        closeExistingModal();

                    }

                }
            );


            document.addEventListener(
                "keydown",
                handleEscape
            );


            return modal;

        }


        function closeExistingModal() {

            const modal =
                document.querySelector(
                    ".document-modal"
                );


            if (modal) {

                modal.remove();

            }


            document.removeEventListener(
                "keydown",
                handleEscape
            );

        }


        function handleEscape(
            event
        ) {

            if (
                event.key ===
                "Escape"
            ) {

                closeExistingModal();

            }

        }


        /* =====================================================
           DOWNLOAD DOCUMENT
           ===================================================== */

        function downloadDocument(
            type
        ) {

            const documentData =
                getDocument(
                    type
                );


            if (
                !documentData ||
                !documentData.data
            ) {

                showToast(
                    "This document has not been uploaded.",
                    "error"
                );

                return;

            }


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                documentData.data;


            link.download =
                safeValue(
                    documentData.name,
                    `${type}.file`
                );


            document.body.appendChild(
                link
            );


            link.click();


            document.body.removeChild(
                link
            );


            showToast(
                "Document download started."
            );

        }


        /* =====================================================
           REMOVE DOCUMENT
           ===================================================== */

        function removeDocument(
            type
        ) {

            const documentData =
                getDocument(
                    type
                );


            if (
                !documentData
            ) {

                showToast(
                    "No document is available.",
                    "error"
                );

                return;

            }


            const title =
                DOCUMENTS[type].title;


            const confirmed =
                window.confirm(
                    `Remove ${title} from this student's record?`
                );


            if (!confirmed) {

                return;

            }


            const latestStudents =
                getStudents();


            const index =
                latestStudents.findIndex(
                    item =>
                        String(
                            item.id
                        ) ===
                        String(
                            student.id
                        )
                );


            if (
                index === -1
            ) {

                showToast(
                    "Student record not found.",
                    "error"
                );

                return;

            }


            if (
                !latestStudents[index].documents
            ) {

                latestStudents[index].documents =
                    {};

            }


            latestStudents[index]
                .documents[type] =
                null;


            latestStudents[index]
                .updatedAt =
                new Date()
                    .toISOString();


            try {

                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(
                        latestStudents
                    )
                );

            } catch (error) {

                console.error(
                    error
                );

                showToast(
                    "Unable to update student record.",
                    "error"
                );

                return;

            }


            students =
                latestStudents;


            student =
                latestStudents[index];


            renderDocuments();


            showToast(
                `${title} removed successfully.`
            );

        }


        /* =====================================================
           BUTTON EVENTS
           ===================================================== */

        document.querySelectorAll(
            ".view-document-btn"
        ).forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        if (
                            button.disabled
                        ) {

                            return;

                        }


                        viewDocument(
                            button.dataset.document
                        );

                    }
                );

            }
        );


        document.querySelectorAll(
            ".download-document-btn"
        ).forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        if (
                            button.disabled
                        ) {

                            return;

                        }


                        downloadDocument(
                            button.dataset.document
                        );

                    }
                );

            }
        );


        document.querySelectorAll(
            ".delete-document-btn"
        ).forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        if (
                            button.disabled
                        ) {

                            return;

                        }


                        removeDocument(
                            button.dataset.document
                        );

                    }
                );

            }
        );


        /* =====================================================
           REFRESH
           ===================================================== */

        if (
            refreshDocumentsBtn
        ) {

            refreshDocumentsBtn.addEventListener(
                "click",
                function () {

                    students =
                        getStudents();


                    const latest =
                        students.find(
                            item =>
                                String(
                                    item.id
                                ) ===
                                String(
                                    studentId
                                )
                        );


                    if (latest) {

                        student =
                            latest;

                    }


                    renderStudentHeader();

                    renderDocuments();


                    showToast(
                        "Documents refreshed."
                    );

                }
            );

        }


        /* =====================================================
           PROFILE LINK
           ===================================================== */

        if (
            backProfileBtn
        ) {

            backProfileBtn.href =
                "student-profile.html?id=" +
                encodeURIComponent(
                    student.id
                );

        }


        /* =====================================================
           STUDENTS LINK
           ===================================================== */

        if (
            backStudentsBtn
        ) {

            backStudentsBtn.href =
                "students.html";

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
                function () {

                    sidebar.classList.toggle(
                        "show"
                    );

                }
            );

        }


        /* =====================================================
           FULLSCREEN
           ===================================================== */

        const fullscreenBtn =
            document.getElementById(
                "fullscreenBtn"
            );


        if (
            fullscreenBtn
        ) {

            fullscreenBtn.addEventListener(
                "click",
                async function () {

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
                            "Fullscreen unavailable."
                        );

                    }

                }
            );

        }


        /* =====================================================
           NOTIFICATION
           ===================================================== */

        const notificationBtn =
            document.getElementById(
                "notificationBtn"
            );


        if (
            notificationBtn
        ) {

            notificationBtn.addEventListener(
                "click",
                function () {

                    showToast(
                        "No new notifications."
                    );

                }
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
                    ".documents-toast"
                );


            if (oldToast) {

                oldToast.remove();

            }


            const toast =
                document.createElement(
                    "div"
                );


            toast.className =
                "documents-toast";


            toast.textContent =
                message;


            if (
                type === "error"
            ) {

                toast.style.background =
                    "#dc2626";

            }


            document.body.appendChild(
                toast
            );


            setTimeout(
                function () {

                    toast.style.opacity =
                        "0";

                    toast.style.transition =
                        "opacity .3s ease";


                    setTimeout(
                        function () {

                            toast.remove();

                        },
                        300
                    );

                },
                2600
            );

        }


        /* =====================================================
           NOT FOUND SCREEN
           ===================================================== */

        function showNotFound() {

            document.body.innerHTML = `

                <main
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

                    <section
                        style="
                            width:min(460px,100%);
                            padding:35px 25px;
                            background:#fff;
                            border:1px solid #e2e8f0;
                            border-radius:20px;
                            text-align:center;
                            box-shadow:
                                0 20px 50px rgba(15,23,42,.08);
                        "
                    >

                        <div
                            style="
                                font-size:55px;
                                margin-bottom:15px;
                            "
                        >
                            🔍
                        </div>

                        <h2
                            style="
                                margin:0 0 10px;
                                color:#172033;
                            "
                        >
                            Student Not Found
                        </h2>

                        <p
                            style="
                                margin:0 0 22px;
                                color:#64748b;
                                font-size:13px;
                            "
                        >
                            The requested student record
                            could not be found.
                        </p>

                        <a
                            href="students.html"
                            style="
                                display:inline-flex;
                                align-items:center;
                                justify-content:center;
                                min-height:44px;
                                padding:0 20px;
                                border-radius:10px;
                                background:#4f46e5;
                                color:#fff;
                                text-decoration:none;
                                font-weight:800;
                                font-size:13px;
                            "
                        >
                            ← Back to Students
                        </a>

                    </section>

                </main>

            `;

        }


        /* =====================================================
           INITIALIZE
           ===================================================== */

        renderStudentHeader();

        renderDocuments();


        console.log(
            "SmartSchool360 Student Documents loaded:",
            student.id
        );

    }
);
