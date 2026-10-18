import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/apiClient";
import ContentImage from "../common/ContentImage";

function createBlankItem(fields) {
    return fields.reduce(
        (item, field) => ({
            ...item,
            [field.name]: "",
        }),
        {}
    );
}

function ContentManager({
    title,
    description,
    contentType,
    fields,
}) {
    const initialForm = useMemo(
        () => createBlankItem(fields),
        [fields]
    );

    const [records, setRecords] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [feedback, setFeedback] = useState("");

    /* =====================================================
       LOAD CONTENT
       ===================================================== */

    useEffect(() => {
        api(`/content/${contentType}`)
            .then(({ items }) => {
                setRecords(items);
            })
            .catch((error) => {
                setFeedback(error.message);
            });

        setForm(createBlankItem(fields));
        setEditingId(null);
    }, [contentType, fields]);

    /* =====================================================
       DISPLAY VALUE
       ===================================================== */

    function displayValue(field, value) {
        if (!value) {
            return "";
        }

        if (
            field.type === "file" &&
            typeof value === "object"
        ) {
            return value.fileName || value.url || "";
        }

        if (typeof value === "object") {
            return (
                value.url ||
                value.fileName ||
                JSON.stringify(value)
            );
        }

        return value;
    }

    /* =====================================================
       HANDLE FORM CHANGE
       ===================================================== */

    const handleChange = (event) => {
        const {
            name,
            value,
            files,
            type,
        } = event.target;

        setForm((current) => ({
            ...current,
            [name]:
                type === "file"
                    ? files?.[0] || null
                    : value,
        }));
    };

    /* =====================================================
       RESET FORM
       ===================================================== */

    const resetForm = () => {
        setForm(createBlankItem(fields));
        setEditingId(null);
    };

    /* =====================================================
       SUBMIT FORM
       ===================================================== */

    const handleSubmit = async (event) => {
        event.preventDefault();

        setFeedback("");

        try {
            const formData = new FormData();

            Object.entries(form).forEach(
                ([key, value]) => {
                    if (
                        value === null ||
                        value === undefined ||
                        value === ""
                    ) {
                        return;
                    }

                    if (value instanceof File) {
                        formData.append(
                            "file",
                            value
                        );
                    } else {
                        formData.append(
                            key,
                            value
                        );
                    }
                }
            );

            const result = await api(
                `/content/${contentType}${editingId
                    ? `/${editingId}`
                    : ""
                }`,
                {
                    method: editingId
                        ? "PUT"
                        : "POST",
                    body: formData,
                }
            );

            setFeedback(
                editingId
                    ? `${title} updated successfully.`
                    : `${title} added successfully.`
            );

            if (editingId) {
                setRecords((current) =>
                    current.map((record) =>
                        record.id === editingId
                            ? result.item
                            : record
                    )
                );
            } else {
                setRecords((current) => [
                    result.item,
                    ...current,
                ]);
            }

            resetForm();
        } catch (error) {
            console.error(
                "Content submission error:",
                error
            );

            setFeedback(
                error.message ||
                "Failed to save content."
            );
        }
    };

    /* =====================================================
       EDIT RECORD
       ===================================================== */

    const handleEdit = (record) => {
        setForm(
            fields.reduce(
                (item, field) => ({
                    ...item,
                    [field.name]:
                        field.type === "file"
                            ? null
                            : record[field.name] ||
                            "",
                }),
                {}
            )
        );

        setEditingId(record.id);
        setFeedback("");

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    /* =====================================================
       DELETE RECORD
       ===================================================== */

    const handleDelete = async (record) => {
        if (
            !window.confirm(
                `Delete this ${title.toLowerCase()} record? This cannot be undone.`
            )
        ) {
            return;
        }

        try {
            await api(
                `/content/${contentType}/${record.id}`,
                {
                    method: "DELETE",
                }
            );
        } catch (error) {
            setFeedback(error.message);
            return;
        }

        setRecords((current) =>
            current.filter(
                (item) => item.id !== record.id
            )
        );

        setFeedback(
            `${title} deleted successfully.`
        );

        if (editingId === record.id) {
            resetForm();
        }
    };

    /* =====================================================
       RENDER
       ===================================================== */

    return (
        <section
            className="cr-manager"
            aria-labelledby={`${contentType}-heading`}
        >
            {/* =================================================
               PAGE HEADER
               ================================================= */}

            <header className="cr-page-header">
                <div>
                    <p className="cr-eyebrow">
                        Class Representative · Management
                    </p>

                    <h1
                        id={`${contentType}-heading`}
                    >
                        {title}
                    </h1>

                    <p>
                        {description}
                    </p>
                </div>

                <span className="cr-record-count">
                    {records.length} records
                </span>
            </header>

            {/* =================================================
               FEEDBACK
               ================================================= */}

            {feedback && (
                <div
                    className="cr-feedback"
                    role="status"
                >
                    {feedback}
                </div>
            )}

            <div className="cr-manager-layout">

                {/* =================================================
                   FORM
                   ================================================= */}

                <form
                    className="cr-form"
                    onSubmit={handleSubmit}
                >
                    <div className="cr-form-heading">
                        <h2>
                            {editingId
                                ? `Edit ${title}`
                                : `Add ${title}`}
                        </h2>

                        <p>
                            Fields marked with *
                            are required.
                        </p>
                    </div>

                    {fields.map((field) => (
                        <label
                            className="cr-field"
                            key={field.name}
                        >
                            <span>
                                {field.label}

                                {field.required !==
                                    false && " *"}
                            </span>

                            {/* TEXTAREA */}

                            {field.type ===
                                "textarea" ? (
                                <textarea
                                    name={
                                        field.name
                                    }
                                    value={
                                        form[
                                        field.name
                                        ] || ""
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required={
                                        field.required !==
                                        false
                                    }
                                    rows="4"
                                />
                            ) : field.options ? (
                                /* SELECT */
                                <select
                                    name={
                                        field.name
                                    }
                                    value={
                                        form[
                                        field.name
                                        ] || ""
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required={
                                        field.required !==
                                        false
                                    }
                                >
                                    <option value="">
                                        Select{" "}
                                        {
                                            field.label
                                        }
                                    </option>

                                    {field.options.map(
                                        (
                                            option
                                        ) => (
                                            <option
                                                key={
                                                    option
                                                }
                                                value={
                                                    option
                                                }
                                            >
                                                {
                                                    option
                                                }
                                            </option>
                                        )
                                    )}
                                </select>
                            ) : field.type ===
                                "file" ? (
                                /* FILE */

                                <input
                                    type="file"
                                    name={
                                        field.name
                                    }
                                    accept={
                                        field.accept ||
                                        "image/*"
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required={
                                        editingId
                                            ? false
                                            : field.required !==
                                            false
                                    }
                                />
                            ) : (
                                /* NORMAL INPUT */

                                <input
                                    type={
                                        field.type ||
                                        "text"
                                    }
                                    name={
                                        field.name
                                    }
                                    value={
                                        form[
                                        field.name
                                        ] || ""
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required={
                                        field.required !==
                                        false
                                    }
                                    placeholder={
                                        field.placeholder ||
                                        ""
                                    }
                                />
                            )}
                        </label>
                    ))}

                    <div className="cr-form-actions">
                        <button
                            className="cr-primary-button"
                            type="submit"
                        >
                            {editingId
                                ? "Save changes"
                                : `Add ${title}`}
                        </button>

                        {editingId && (
                            <button
                                className="cr-secondary-button"
                                type="button"
                                onClick={
                                    resetForm
                                }
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>

                {/* =================================================
                   EXISTING RECORDS
                   ================================================= */}

                <div
                    className="cr-records"
                    aria-live="polite"
                >
                    <h2>
                        Existing {title}
                    </h2>

                    {records.length === 0 ? (
                        <div className="cr-empty-records">
                            No records have been
                            added yet.
                        </div>
                    ) : (
                        records.map((record) => (
                            <article
                                className="cr-record"
                                key={record.id}
                            >
                                <div className="cr-record-details">

                                    {fields.map(
                                        (field) => {
                                            const value =
                                                record[
                                                field
                                                    .name
                                                ];

                                            if (
                                                !value
                                            ) {
                                                return null;
                                            }

                                            /* =================================================
                                               IMAGE FIELD
                                               ================================================= */

                                            if (field.type === "file" && value) {
                                                return (
                                                    <div key={field.name}>
                                                        <p>
                                                            <strong>{field.label}:</strong>{" "}
                                                            {value.fileName || "Uploaded image"}
                                                        </p>
                                                        <ContentImage
                                                            image={value}
                                                            contentType={contentType}
                                                            contentId={record.id}
                                                            alt={value.fileName || "Uploaded image"}
                                                            referrerPolicy="no-referrer"
                                                            style={{
                                                                maxWidth: "100%",
                                                                maxHeight: "300px",
                                                                objectFit: "contain",
                                                                display: "block",
                                                                marginTop: "8px",
                                                            }}
                                                        />
                                                    </div>
                                                );
                                            }

                                            /* =================================================
                                               NORMAL FIELD
                                               ================================================= */

                                            return (
                                                <p
                                                    key={
                                                        field.name
                                                    }
                                                >
                                                    <strong>
                                                        {
                                                            field.label
                                                        }
                                                        :
                                                    </strong>{" "}
                                                    {displayValue(
                                                        field,
                                                        value
                                                    )}
                                                </p>
                                            );
                                        }
                                    )}

                                </div>

                                {/* =================================================
                                   RECORD ACTIONS
                                   ================================================= */}

                                <div className="cr-record-actions">
                                    <button
                                        className="cr-secondary-button"
                                        type="button"
                                        onClick={() =>
                                            handleEdit(
                                                record
                                            )
                                        }
                                    >
                                        Edit
                                    </button>

                                    <button
                                        className="cr-danger-button"
                                        type="button"
                                        onClick={() =>
                                            handleDelete(
                                                record
                                            )
                                        }
                                    >
                                        Delete
                                    </button>
                                </div>
                            </article>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}

export default ContentManager;
