import { useEffect, useRef, useState } from "react";
import { api } from "../../services/apiClient";
import ContentImage from "../common/ContentImage";

function TimetableImageManager() {
    const [image, setImage] = useState(null);
    const [file, setFile] = useState(null);
    const [feedback, setFeedback] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const fileInput = useRef(null);

    useEffect(() => {
        api("/timetable-image")
            .then(({ image: savedImage }) => setImage(savedImage))
            .catch((error) => setFeedback(error.message))
            .finally(() => setLoading(false));
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();
        if (!file) {
            setFeedback("Choose an image before saving.");
            return;
        }

        setSaving(true);
        setFeedback("");
        try {
            const formData = new FormData();
            formData.append("file", file);
            const result = await api("/timetable-image", {
                method: "PUT",
                body: formData,
            });
            setImage(result.image);
            setFile(null);
            if (fileInput.current) fileInput.current.value = "";
            setFeedback("Class timetable image saved.");
        } catch (error) {
            setFeedback(error.message || "Failed to save timetable image.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="cr-timetable-image" aria-labelledby="timetable-image-heading">
            <header className="cr-page-header">
                <div>
                    <p className="cr-eyebrow">Shared class image</p>
                    <h1 id="timetable-image-heading">Class timetable image</h1>
                    <p>Set this image once. Replace it here when the class timetable changes.</p>
                </div>
            </header>

            {feedback && <div className="cr-feedback" role="status">{feedback}</div>}

            <div className="cr-timetable-image-layout">
                <div className="cr-timetable-image-preview">
                    <h2>Current timetable</h2>
                    {loading ? (
                        <p>Loading image…</p>
                    ) : (
                        <ContentImage
                            image={image}
                            sourcePath="/timetable-image/file"
                            alt="Current class timetable"
                        />
                    )}
                </div>

                <form className="cr-form" onSubmit={handleSubmit}>
                    <div className="cr-form-heading">
                        <h2>{image ? "Replace image" : "Set timetable image"}</h2>
                        <p>This image is shared by all timetable updates.</p>
                    </div>
                    <label className="cr-field">
                        <span>{image ? "Choose replacement image *" : "Choose timetable image *"}</span>
                        <input
                            ref={fileInput}
                            type="file"
                            accept="image/*"
                            required
                            onChange={(event) => setFile(event.target.files?.[0] || null)}
                        />
                    </label>
                    <button className="cr-primary-button" type="submit" disabled={saving}>
                        {saving ? "Saving…" : image ? "Replace timetable image" : "Save timetable image"}
                    </button>
                </form>
            </div>
        </section>
    );
}

export default TimetableImageManager;
