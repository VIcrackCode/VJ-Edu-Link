import "../../styles/accountProfile.css";
import { useAuth } from "../../hooks/useAuth";

function AccountProfile() {
    const { user } = useAuth();
    const details = [
        ["Full name", user?.name],
        ["College ID", user?.collegeId || user?.id],
        ["Account type", user?.role],
        ["Phone", user?.phone],
        ["Year", user?.year],
        ["Branch", user?.branch],
        ["Section", user?.section],
    ];

    return (
        <section className="account-profile-page" aria-labelledby="account-profile-heading">
            <header className="account-profile-heading">
                <p className="account-profile-eyebrow">Your account</p>
                <h1 id="account-profile-heading">Profile details</h1>
                <p>Review the details linked to your VJ Edu Link account.</p>
            </header>

            <article className="account-profile-card">
                <div className="account-profile-identity">
                    <img
                        className="account-profile-avatar"
                        src={user?.profileImage?.url || "/profile.png"}
                        alt={`${user?.name || "User"} profile`}
                    />
                    <div>
                        <h2>{user?.name || "Account holder"}</h2>
                        <p>{user?.role || "Student"}</p>
                    </div>
                </div>

                <dl className="account-profile-details">
                    {details.map(([label, value]) => (
                        <div className="account-profile-detail" key={label}>
                            <dt>{label}</dt>
                            <dd>{value || "—"}</dd>
                        </div>
                    ))}
                </dl>
            </article>
        </section>
    );
}

export default AccountProfile;
