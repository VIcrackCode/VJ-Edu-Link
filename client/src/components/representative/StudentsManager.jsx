import { useEffect, useState } from "react";
import { api } from "../../services/apiClient";

const blankForm = {
    collegeId: "",
    name: "",
    phone: "",
    year: "II",
    branch: "CSE",
    section: "A",
    role: "Student",
    password: "",
};

function StudentsManager() {
    const [records, setRecords] = useState([]);
    const [form, setForm] = useState(blankForm);
    const [feedback, setFeedback] = useState("");

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
        try {
            const { item } = await api("/students", { method: "POST", body: JSON.stringify(form) });
            setRecords((current) => [...current, item].sort((a, b) => a.collegeId.localeCompare(b.collegeId)));
            setForm(blankForm);
            setFeedback(`${item.name} can now sign in with college ID ${item.collegeId}.`);
        } catch (error) {
            setFeedback(error.message);
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
                    <p>Create student and representative accounts. Passwords are stored hashed in MongoDB.</p>
                </div>
                <span className="cr-record-count">{records.length} accounts</span>
            </header>
            {feedback && <div className="cr-feedback" role="status">{feedback}</div>}
            <div className="cr-manager-layout">
                <form className="cr-form" onSubmit={handleSubmit}>
                    <div className="cr-form-heading">
                        <h2>Add an account</h2>
                        <p>College ID must look like 25071A0001.</p>
                    </div>
                    <label className="cr-field"><span>College ID *</span><input name="collegeId" value={form.collegeId} onChange={handleChange} required placeholder="25071A0003" /></label>
                    <label className="cr-field"><span>Full name *</span><input name="name" value={form.name} onChange={handleChange} required /></label>
                    <label className="cr-field"><span>Phone *</span><input name="phone" inputMode="numeric" value={form.phone} onChange={handleChange} required placeholder="10-digit number" /></label>
                    <label className="cr-field">
                        <span>Year *</span>
                        <select name="year" value={form.year} onChange={handleChange}>
                            {["I", "II", "III", "IV"].map((year) => <option key={year}>{year}</option>)}
                        </select>
                    </label>
                    <label className="cr-field"><span>Branch *</span><input name="branch" value={form.branch} onChange={handleChange} required /></label>
                    <label className="cr-field"><span>Section *</span><input name="section" value={form.section} onChange={handleChange} required /></label>
                    <label className="cr-field">
                        <span>Role *</span>
                        <select name="role" value={form.role} onChange={handleChange}>
                            <option>Student</option>
                            <option>Class Representative</option>
                        </select>
                    </label>
                    <label className="cr-field"><span>Password *</span><input name="password" type="password" minLength="8" value={form.password} onChange={handleChange} required /></label>
                    <div className="cr-form-actions">
                        <button className="cr-primary-button" type="submit">Create account</button>
                    </div>
                </form>
                <div className="cr-records">
                    <h2>Registered accounts</h2>
                    {records.length === 0 ? (
                        <div className="cr-empty-records">No accounts yet. Seed the database or add one here.</div>
                    ) : records.map((record) => (
                        <article className="cr-record" key={record.id}>
                            <div className="cr-record-details">
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
