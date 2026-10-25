import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/apiClient";
import { useAuth } from "../../hooks/useAuth";
import "../../styles/admin.css";

const blankAccount = {
    collegeId: "",
    name: "",
    phone: "",
    year: "I",
    branch: "CSE",
    section: "A",
    role: "Student",
    password: "",
};

function AdminDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const formElement = useRef(null);
    const [accounts, setAccounts] = useState([]);
    const [form, setForm] = useState(blankAccount);
    const [editingId, setEditingId] = useState(null);
    const [filters, setFilters] = useState({ branch: "all", year: "all", section: "all", search: "" });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        let current = true;
        api("/admin/accounts")
            .then(({ items }) => {
                if (current) setAccounts(items);
            })
            .catch((error) => {
                if (current) setFeedback(error.message);
            })
            .finally(() => {
                if (current) setLoading(false);
            });
        return () => { current = false; };
    }, []);

    const branches = useMemo(() => [...new Set(accounts.map((item) => item.branch).filter(Boolean))].sort(), [accounts]);
    const years = useMemo(() => [...new Set(accounts.map((item) => item.year).filter(Boolean))].sort(), [accounts]);
    const sections = useMemo(() => [...new Set(accounts.map((item) => item.section).filter(Boolean))].sort(), [accounts]);

    const filteredAccounts = useMemo(() => {
        const query = filters.search.trim().toLowerCase();
        return accounts.filter((account) => (
            (filters.branch === "all" || account.branch === filters.branch)
            && (filters.year === "all" || account.year === filters.year)
            && (filters.section === "all" || account.section === filters.section)
            && (!query || [account.name, account.collegeId, account.phone, account.role].some((value) => String(value || "").toLowerCase().includes(query)))
        ));
    }, [accounts, filters]);

    const groups = useMemo(() => {
        const grouped = new Map();
        filteredAccounts.forEach((account) => {
            const key = `${account.branch} · ${account.year} year · Section ${account.section}`;
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key).push(account);
        });
        return [...grouped.entries()];
    }, [filteredAccounts]);

    function handleFieldChange(event) {
        const { name, value } = event.target;
        const nextValue = name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;
        setForm((current) => ({ ...current, [name]: nextValue }));
    }

    function resetForm() {
        setForm(blankAccount);
        setEditingId(null);
        formElement.current?.reset();
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (saving) return;
        setSaving(true);
        setFeedback("");
        const payload = {
            ...form,
            collegeId: form.collegeId.trim().toUpperCase(),
            phone: form.phone.replace(/\D/g, ""),
        };
        const editedAccount = editingId ? accounts.find((account) => account.id === editingId) : null;
        const isCurrentAccount = editedAccount?.collegeId === user?.collegeId;
        try {
            const { item } = await api(`/admin/accounts${editingId ? `/${editingId}` : ""}`, {
                method: editingId ? "PUT" : "POST",
                body: JSON.stringify(payload),
            });
            setAccounts((current) => editingId
                ? current.map((account) => account.id === editingId ? item : account)
                : [...current, item].sort((a, b) => a.branch.localeCompare(b.branch) || a.year.localeCompare(b.year) || a.section.localeCompare(b.section) || a.collegeId.localeCompare(b.collegeId))
            );
            setFeedback(editingId ? `${item.name}'s account was updated.` : `${item.name}'s account was created.`);
            resetForm();
            if (isCurrentAccount) {
                logout();
                navigate("/login", { replace: true, state: { message: "Your account was updated. Sign in again with the updated credentials." } });
            }
        } catch (error) {
            setFeedback(error.message);
        } finally {
            setSaving(false);
        }
    }

    function startEdit(account) {
        setEditingId(account.id);
        setForm({
            collegeId: account.collegeId,
            name: account.name,
            phone: account.phone,
            year: account.year,
            branch: account.branch,
            section: account.section,
            role: account.role,
            password: "",
        });
        setFeedback("");
        formElement.current?.reset();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function deleteAccount(account) {
        if (!window.confirm(`Delete ${account.name} (${account.collegeId})? This cannot be undone.`)) return;
        setFeedback("");
        const isCurrentAccount = account.collegeId === user?.collegeId;
        try {
            await api(`/admin/accounts/${account.id}`, { method: "DELETE" });
            setAccounts((current) => current.filter((item) => item.id !== account.id));
            if (editingId === account.id) resetForm();
            setFeedback(`${account.name}'s account was deleted.`);
            if (isCurrentAccount) {
                logout();
                navigate("/login", { replace: true, state: { message: "Your Admin account was deleted." } });
            }
        } catch (error) {
            setFeedback(error.message);
        }
    }

    return (
        <main className="admin-page">
            <header className="admin-header">
                <div>
                    <p className="admin-eyebrow">VJ Edu Link · Administration</p>
                    <h1>Account management</h1>
                    <p>Manage student, CR, and Admin accounts by branch, year, and section.</p>
                </div>
                <div className="admin-session">
                    <span>{user?.name} · Admin</span>
                    <button type="button" onClick={() => { logout(); navigate("/login"); }}>Log out</button>
                </div>
            </header>

            {feedback && <div className="admin-feedback" role="status">{feedback}</div>}

            <div className="admin-layout">
                <form ref={formElement} className="admin-form" onSubmit={handleSubmit}>
                    <div className="admin-section-heading">
                        <h2>{editingId ? "Edit account" : "Create account"}</h2>
                        <p>College ID must look like 25071A0001.</p>
                    </div>
                    <label className="admin-field"><span>College ID *</span><input name="collegeId" value={form.collegeId} onChange={handleFieldChange} minLength={10} maxLength={10} placeholder="25071A0001" required /></label>
                    <label className="admin-field"><span>Full name *</span><input name="name" value={form.name} onChange={handleFieldChange} required /></label>
                    <label className="admin-field"><span>Phone *</span><input name="phone" type="tel" inputMode="numeric" value={form.phone} onChange={handleFieldChange} minLength={10} maxLength={10} placeholder="10-digit phone" required /></label>
                    <div className="admin-field-row">
                        <label className="admin-field"><span>Year *</span><select name="year" value={form.year} onChange={handleFieldChange} required>{["I", "II", "III", "IV", "N/A"].map((year) => <option key={year}>{year}</option>)}</select></label>
                        <label className="admin-field"><span>Branch *</span><input name="branch" value={form.branch} onChange={handleFieldChange} required /></label>
                        <label className="admin-field"><span>Section *</span><input name="section" value={form.section} onChange={handleFieldChange} required /></label>
                    </div>
                    <label className="admin-field"><span>Role *</span><select name="role" value={form.role} onChange={handleFieldChange} required><option>Student</option><option>Class Representative</option><option>Admin</option></select></label>
                    <label className="admin-field"><span>{editingId ? "New password (leave blank to keep current)" : "Password *"}</span><input name="password" type="password" autoComplete="new-password" minLength="8" value={form.password} onChange={handleFieldChange} required={!editingId} /></label>
                    <div className="admin-form-actions">
                        <button className="admin-primary-button" type="submit" disabled={saving}>{saving ? "Saving…" : editingId ? "Save changes" : "Create account"}</button>
                        {editingId && <button className="admin-secondary-button" type="button" onClick={resetForm} disabled={saving}>Cancel</button>}
                    </div>
                </form>

                <section className="admin-accounts" aria-labelledby="admin-accounts-heading">
                    <div className="admin-section-heading">
                        <div>
                            <h2 id="admin-accounts-heading">All accounts</h2>
                            <p>{filteredAccounts.length} of {accounts.length} accounts</p>
                        </div>
                    </div>
                    <div className="admin-filters">
                        <label><span>Branch</span><select value={filters.branch} onChange={(event) => setFilters((current) => ({ ...current, branch: event.target.value }))}><option value="all">All branches</option>{branches.map((branch) => <option key={branch}>{branch}</option>)}</select></label>
                        <label><span>Year</span><select value={filters.year} onChange={(event) => setFilters((current) => ({ ...current, year: event.target.value }))}><option value="all">All years</option>{years.map((year) => <option key={year}>{year}</option>)}</select></label>
                        <label><span>Section</span><select value={filters.section} onChange={(event) => setFilters((current) => ({ ...current, section: event.target.value }))}><option value="all">All sections</option>{sections.map((section) => <option key={section}>{section}</option>)}</select></label>
                        <label className="admin-search"><span>Search</span><input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Name, ID, phone, or role" /></label>
                    </div>

                    {loading ? <div className="admin-empty">Loading accounts…</div> : groups.length === 0 ? <div className="admin-empty">No accounts match these filters.</div> : groups.map(([group, groupAccounts]) => (
                        <div className="admin-account-group" key={group}>
                            <h3>{group}<span>{groupAccounts.length}</span></h3>
                            {groupAccounts.map((account) => (
                                <article className="admin-account-card" key={account.id}>
                                    <div>
                                        <div className="admin-account-title"><h4>{account.name}</h4><span className={`admin-role admin-role-${account.role.toLowerCase().replaceAll(" ", "-")}`}>{account.role}</span></div>
                                        <p>{account.collegeId} · {account.phone}</p>
                                        <small>{account.year} year · {account.branch}-{account.section}</small>
                                    </div>
                                    <div className="admin-account-actions">
                                        <button type="button" className="admin-secondary-button" onClick={() => startEdit(account)}>Edit</button>
                                        <button type="button" className="admin-danger-button" onClick={() => deleteAccount(account)}>Delete</button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ))}
                </section>
            </div>
        </main>
    );
}

export default AdminDashboard;
