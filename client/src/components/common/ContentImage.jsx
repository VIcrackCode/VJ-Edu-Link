import { useEffect, useState } from "react";
import { apiBlob } from "../../services/apiClient";
import { getDriveFileId, getImageUrl } from "./imageUrl";

function ContentImage({
    image,
    contentType,
    contentId,
    sourcePath = "",
    fallback = "",
    ...imageProps
}) {
    const driveFileId = getDriveFileId(image);
    const directSource = getImageUrl(image);
    const [src, setSrc] = useState(fallback);

    useEffect(() => {
        let cancelled = false;
        let objectUrl = "";

        if (!sourcePath && (!driveFileId || !contentType || !contentId)) {
            setSrc(directSource || fallback);
            return () => {
                cancelled = true;
            };
        }

        setSrc(fallback);
        const path = sourcePath || `/content/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/image`;

        apiBlob(path)
            .then((blob) => {
                if (cancelled) return;
                objectUrl = URL.createObjectURL(blob);
                setSrc(objectUrl);
            })
            .catch(() => {
                if (!cancelled) setSrc(driveFileId ? fallback : directSource || fallback);
            });

        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [contentId, contentType, directSource, driveFileId, fallback, sourcePath]);

    if (!src) return null;
    return <img {...imageProps} src={src} />;
}

export default ContentImage;
