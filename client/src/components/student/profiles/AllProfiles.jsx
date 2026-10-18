import "../../../styles/profileDetailing.css";

function getDomain(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}

function AllProfiles({ profiles, onDelete, canDelete }) {
    return profiles.map((profile) => {
        const domain = getDomain(profile.url);
        return (
            <div className="profile-card" key={profile.id || profile.url}>
                <a href={profile.url} target="_blank" rel="noreferrer">
                    <img src={`https://www.google.com/s2/favicons?domain=https://${domain}&sz=128`} alt={profile.profileName} className="profile-image" />
                </a>
                <p>{profile.profileName}</p>
                {canDelete && (
                    <button className="close-button" type="button" onClick={() => onDelete(profile)}>Remove</button>
                )}
            </div>
        );
    });
}

export default AllProfiles;
