import { useEffect, useRef, useState } from "react";
import { api } from "../../services/apiClient";
import { useAuth } from "../../hooks/useAuth";

const blankForm = {
    collegeId: "",
    name: "",
    phone: "",
    password: "",
};

function StudentsManager() {
    const { user } = useAuth();
    const [records, setRecords] = useState([]);
    const [form, setForm] = useState(blankForm);
    const [feedback, setFeedback] = useState("");
    const [profileImage, setProfileImage] = useState(null);
    const [saving, setSaving] = useState(false);
    const formElement = useRef(null);

    useEffect(() => {
        api("/students")
            .then(({ items }) => setRecords(items))
            .catch((error) => setFeedback(error.message));
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (saving) return;
        setSaving(true);
        try {
            const payload = new FormData();
            Object.entries(form).forEach(([key, value]) => payload.append(key, value));
            if (profileImage) payload.append("file", profileImage);
            const { item } = await api("/students", { method: "POST", body: payload });
            setRecords((current) => [...current, item].sort((a, b) => a.collegeId.localeCompare(b.collegeId)));
            setForm(blankForm);
            setProfileImage(null);
            formElement.current?.reset();
            setFeedback(`${item.name} can now sign in with college ID ${item.collegeId}.`);
        } catch (error) {
            setFeedback(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (record) => {
        if (!window.confirm(`Remove ${record.name} (${record.collegeId})? They will no longer be able to sign in.`)) return;
        try {
            await api(`/students/${record.id}`, { method: "DELETE" });
            setRecords((current) => current.filter((item) => item.id !== record.id));
            setFeedback(`${record.name} was removed.`);
        } catch (error) {
            setFeedback(error.message);
        }
    };

    return (
        <section className="cr-manager">
            <header className="cr-page-header">
                <div>
                    <p className="cr-eyebrow">Class Representative · Accounts</p>
                    <h1>Class accounts</h1>
                    <p>Create student accounts for your class. Year, branch, and section come from your CR account.</p>
                </div>
                <span className="cr-record-count">{records.length} accounts</span>
            </header>
            {feedback && <div className="cr-feedback" role="status">{feedback}</div>}
            <div className="cr-manager-layout">
                <form ref={formElement} className="cr-form" onSubmit={handleSubmit}>
                    <div className="cr-form-heading">
                        <h2>Add a student account</h2>
                        <p>College ID must look like 25071A0001.</p>
                    </div>
                    <p className="cr-account-class-note">
                        New accounts will be Students in {user?.year} year, {user?.branch}-{user?.section}.
                    </p>
                    <label className="cr-field"><span>College ID *</span><input name="collegeId" value={form.collegeId} onChange={handleChange} required placeholder="25071A0003" /></label>
                    <label className="cr-field"><span>Full name *</span><input name="name" value={form.name} onChange={handleChange} required /></label>
                    <label className="cr-field"><span>Phone *</span><input name="phone" inputMode="numeric" value={form.phone} onChange={handleChange} required placeholder="10-digit number" /></label>
                    <label className="cr-field"><span>Password *</span><input name="password" type="password" minLength="8" value={form.password} onChange={handleChange} required /></label>
                    <label className="cr-field"><span>Profile photo (optional)</span><input type="file" accept="image/*" onChange={(event) => setProfileImage(event.target.files?.[0] || null)} /></label>
                    <div className="cr-form-actions">
                        <button className="cr-primary-button" type="submit" disabled={saving}>{saving ? "Creating…" : "Create account"}</button>
                    </div>
                </form>
                <div className="cr-records">
                    <h2>Registered accounts</h2>
                    {records.length === 0 ? (
                        <div className="cr-empty-records">No accounts yet. Seed the database or add one here.</div>
                    ) : records.map((record) => (
                        <article className="cr-record" key={record.id}>
                            <div className="cr-record-details">
                                {record.profileImage?.url && <img className="cr-account-avatar" src={record.profileImage.url} alt={`${record.name}'s profile`} />}
                                <p><strong>Name:</strong> {record.name}</p>
                                <p><strong>College ID:</strong> {record.collegeId}</p>
                                <p><strong>Role:</strong> {record.role}</p>
                                <p><strong>Class:</strong> {record.year} {record.branch}-{record.section}</p>
                                <p><strong>Phone:</strong> {record.phone}</p>
                            </div>
                            <div className="cr-record-actions">
                                <button className="cr-danger-button" type="button" onClick={() => handleDelete(record)}>Delete</button>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default StudentsManager;
