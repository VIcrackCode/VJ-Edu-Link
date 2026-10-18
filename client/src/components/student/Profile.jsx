import { useEffect, useState } from "react";
import "../../styles/profileDetailing.css";
import AddProfile from "./profiles/AddProfile.jsx";
import AllProfiles from "./profiles/AllProfiles.jsx";
import ProfileAdderForm from "./profiles/ProfileAdderForm.jsx";
import { api } from "../../services/apiClient";
import { useAuth } from "../../hooks/useAuth";

function Profile() {
    const { user } = useAuth();
    const [query, setQuery] = useState("");
    const [profileResult, setProfileResult] = useState({ collegeId: null, owner: null, items: [] });
    const [loadingCollegeId, setLoadingCollegeId] = useState(null);
    const [showProfileAdderForm, setShowProfileAdderForm] = useState(false);
    const [feedback, setFeedback] = useState("");

    const normalizedQuery = query.trim().toUpperCase();
    const ownCollegeId = String(user?.collegeId || user?.id || "").trim().toUpperCase();
    const activeCollegeId = normalizedQuery || ownCollegeId;
    const viewingOwn = !normalizedQuery || normalizedQuery === ownCollegeId;
    const resultMatchesView = profileResult.collegeId === activeCollegeId;
    const owner = resultMatchesView ? profileResult.owner : null;
    const profiles = resultMatchesView ? profileResult.items : [];
    const isLoading = loadingCollegeId === activeCollegeId || (!resultMatchesView && !feedback);

    useEffect(() => {
        let isCurrentRequest = true;
        setLoadingCollegeId(activeCollegeId);
        setFeedback("");

        api(`/profiles${normalizedQuery ? `?collegeId=${encodeURIComponent(normalizedQuery)}` : ""}`)
            .then((result) => {
                if (isCurrentRequest) {
                    setProfileResult({ collegeId: activeCollegeId, owner: result.owner, items: result.items });
                }
            })
            .catch((error) => {
                if (isCurrentRequest) setFeedback(error.message);
            })
            .finally(() => {
                if (isCurrentRequest) setLoadingCollegeId(null);
            });

        return () => {
            isCurrentRequest = false;
        };
    }, [activeCollegeId, normalizedQuery]);

    const handleSearch = async (event) => {
        event.preventDefault();
        // The view refreshes as the ID changes; submitting the form only handles Enter.
    };

    const handleAddProfile = async (profile) => {
        try {
            const { item } = await api("/profiles", { method: "POST", body: JSON.stringify(profile) });
            setProfileResult((current) => current.collegeId === activeCollegeId
                ? { ...current, items: [item, ...current.items] }
                : current);
            setShowProfileAdderForm(false);
            setFeedback("");
        } catch (error) {
            setFeedback(error.message);
        }
    };

    const handleDelete = async (profile) => {
        try {
            await api(`/profiles/${profile.id}`, { method: "DELETE" });
            setProfileResult((current) => current.collegeId === activeCollegeId
                ? { ...current, items: current.items.filter((item) => item.id !== profile.id) }
                : current);
        } catch (error) {
            setFeedback(error.message);
        }
    };

    return (
        <>
            <form className="search-section" onSubmit={handleSearch}>
                <label htmlFor="profile-search"><strong>Find Other's Profiles — </strong></label>
                <div className="search-input-box">
                    <input
                        id="profile-search"
                        className="search"
                        placeholder="Search by college ID"
                        value={query}
                        autoComplete="off"
                        onChange={(event) => {
                            setQuery(event.target.value);
                            setFeedback("");
                            if (event.target.value.trim().toUpperCase() !== ownCollegeId) {
                                setShowProfileAdderForm(false);
                            }
                        }}
                    />
                </div>
                <button className="search-span-box" type="submit" aria-label="Search">
                    <img src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/search.svg" alt="" />
                </button>
            </form>
            <div className="profiles-section">
                <div className="tag-line">
                    <h3>{viewingOwn ? "Your Profiles" : `${owner?.name || query}'s Profiles`}</h3>
                    <p>{viewingOwn ? "Show up all your Profiles. Build your Network" : "Public profiles linked to this college ID."}</p>
                    {feedback && <p>{feedback}</p>}
                    {!viewingOwn && isLoading && <p role="status">Loading profiles for {normalizedQuery}...</p>}
                    {!viewingOwn && !isLoading && !feedback && profiles.length === 0 && (
                        <p>No public profiles found for {normalizedQuery}.</p>
                    )}
                </div>
                <div className="all-profiles">
                    {viewingOwn && showProfileAdderForm && (
                        <ProfileAdderForm onAddProfile={handleAddProfile} onClose={() => setShowProfileAdderForm(false)} />
                    )}
                    {viewingOwn && !showProfileAdderForm && <AddProfile onClick={() => setShowProfileAdderForm(true)} />}
                    <AllProfiles profiles={profiles} canDelete={viewingOwn} onDelete={handleDelete} />
                </div>
            </div>
        </>
    );
}

export default Profile;
