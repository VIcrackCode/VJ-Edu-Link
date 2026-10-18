export const requiredFields = {
    resources: ["category", "subject", "documentType", "documentLink"],
    announcements: ["category", "title", "description"],
    tandp: ["image", "title", "description"],
    courses: ["courseName", "suggestedBy", "description", "courseLink"],
    events: ["organizer", "venue", "time", "eventType", "registrationLink", "poster"],
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
    return fields.every((key) => hasRequiredValue(key, data[key]));
}
