function driveImageUrl(fileId) {
    return `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=w1000&authuser=0`;
}

export function getDriveFileId(image) {
    if (image && typeof image === "object") {
        const fileId = image.fileId || image.id;
        if (typeof fileId === "string" && fileId.trim()) return fileId.trim();
    }

    const value = typeof image === "string" ? image : image?.url;
    if (typeof value !== "string") return "";

    try {
        const url = new URL(value);
        if (!url.hostname.endsWith("drive.google.com")) return "";

        const queryId = url.searchParams.get("id");
        if (queryId) return queryId;

        return url.pathname.match(/\/d\/([^/]+)/)?.[1] || "";
    } catch {
        return "";
    }
}

export function getImageUrl(image) {
    if (typeof image === "string") {
        const value = image.trim();
        if (!value) return "";

        if (/^https?:\/\//i.test(value)) {
            const fileId = getDriveFileId(image);
            return fileId ? driveImageUrl(fileId) : value;
        }

        if (/^(\/|data:|blob:)/i.test(value)) return value;
        return driveImageUrl(value);
    }

    if (!image || typeof image !== "object" || Array.isArray(image)) {
        return "";
    }

    const fileId = getDriveFileId(image);
    if (fileId) {
        return driveImageUrl(fileId);
    }

    if (typeof image.url === "string" && image.url.trim()) {
        const value = image.url.trim();
        const urlFileId = getDriveFileId(value);
        return urlFileId ? driveImageUrl(urlFileId) : value;
    }

    return "";
}
