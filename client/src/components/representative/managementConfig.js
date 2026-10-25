const optionalAttachment = {
    type: "file",
    label: "Optional image or document",
    accept: "image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt",
    required: false,
};

export const managementPages = {
    resources: {
        title: "Resources",
        description: "Add a Drive link or upload a file for each theory or lab resource.",
        contentType: "resources",
        fields: [
            { name: "category", label: "Resource type", options: ["Theory", "Lab"] },
            { name: "subject", label: "Subject", placeholder: "e.g. DBMS" },
            { name: "documentType", label: "Document type", options: ["Materials", "Question Papers", "Syllabus", "Lab Documents"] },
            { name: "documentLink", label: "Google Drive document link (or use attachment)", type: "url", placeholder: "https://drive.google.com/...", required: false },
            { name: "attachment", ...optionalAttachment },
        ],
    },
    announcements: {
        title: "Announcements",
        description: "Publish clear announcements for your class.",
        contentType: "announcements",
        fields: [
            { name: "category", label: "Category", options: ["Assignments", "Exams", "CBPs", "WILs", "Other"] },
            { name: "title", label: "Title" },
            { name: "description", label: "Description", type: "textarea" },
            { name: "documentLink", label: "Related document/link", type: "url", required: false },
            { name: "attachment", ...optionalAttachment },
        ],
    },
    tandp: {
        title: "T & P Updates",
        description: "Share placement and training updates with students.",
        contentType: "tandp",
        fields: [
            {
                name: "image",
                label: "Image",
                type: "file",
                accept: "image/*",
                uploadFolder: "tandpupdates",
                required: false,
            },
            { name: "title", label: "Title" },
            { name: "description", label: "Description", type: "textarea" },
        ],
    },
    courses: {
        title: "Courses",
        description: "Add suggested courses and learning opportunities.",
        contentType: "courses",
        fields: [
            { name: "courseName", label: "Course name" },
            { name: "suggestedBy", label: "Suggested by" },
            { name: "description", label: "Description", type: "textarea" },
            { name: "courseLink", label: "Course link", type: "url" },
            {
                name: "image",
                label: "Course image",
                type: "file",
                accept: "image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt",
                uploadFolder: "courses",
                required: false
            },
        ],
    },
    events: {
        title: "Events",
        description: "Create and maintain class event information.",
        contentType: "events",
        fields: [
            { name: "organizer", label: "By / organizer" },
            { name: "venue", label: "Venue" },
            { name: "time", label: "Time" },
            { name: "eventType", label: "Type of event", options: ["Technical", "Hackathon", "Hardware", "Fun"] },
            { name: "registrationLink", label: "Registration link", type: "url" },
            {
                name: "poster",
                label: "Event poster",
                type: "file",
                accept: "image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt",
                uploadFolder: "events",
                required: false,
            },
        ],
    },
    timetable: {
        title: "Timetable Updates",
        description: "Keep timetable changes accurate and timely.",
        contentType: "timetable",
        fields: [
            { name: "update", label: "Update" },
            { name: "period", label: "Period" },
            { name: "reason", label: "Reason", type: "textarea" },
            { name: "attachment", ...optionalAttachment },
        ],
    },
    scholarship: {
        title: "E-PASS Updates",
        description: "Publish scholarship and E-PASS deadlines.",
        contentType: "scholarship",
        fields: [
            { name: "title", label: "Title" },
            { name: "description", label: "Description", type: "textarea" },
            { name: "deadline", label: "Deadline", type: "date" },
            { name: "attachment", ...optionalAttachment },
        ],
    },
};
