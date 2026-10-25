export const requiredFields = {
    resources: ["category", "subject", "documentType"],
    announcements: ["category", "title", "description"],
    tandp: ["title", "description"],
    courses: ["courseName", "suggestedBy", "description", "courseLink"],
    events: ["organizer", "venue", "time", "eventType", "registrationLink"],
    timetable: ["update", "period", "reason"],
    scholarship: ["title", "description", "deadline"],
};

const imageFields = new Set(["image", "poster", "timetableImage"]);

function hasRequiredValue(key, value) {
    if (typeof value === "string") {
        return value.trim().length > 0;
    }

    if (!imageFields.has(key) || !value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }

    return [value.fileId, value.id, value.url].some(
        (part) => typeof part === "string" && part.trim().length > 0
    );
}

export function isValidContent(type, data) {
    const fields = requiredFields[type];
    if (!fields || !data) return false;
    if (!fields.every((key) => hasRequiredValue(key, data[key]))) return false;

    if (type === "resources") {
        const hasDocumentLink = hasRequiredValue("documentLink", data.documentLink);
        const hasUploadedAttachment = Boolean(
            data.attachment && typeof data.attachment === "object" &&
            [data.attachment.fileId, data.attachment.id, data.attachment.url].some(
                (part) => typeof part === "string" && part.trim().length > 0
            )
        );
        return hasDocumentLink || hasUploadedAttachment;
    }

    return true;
}
