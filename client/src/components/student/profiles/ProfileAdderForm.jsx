import "../../../styles/profileDetailing.css";

function ProfileAdderForm({ onAddProfile, onClose }) {
    const handleSave = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onAddProfile({
            profileName: formData.get("profileName"),
            url: formData.get("url"),
        });
    };

    return (
        <form className="profile-card" onSubmit={handleSave}>
            <div className="input-boxes">
                <div className="profile-input-boxes">
                    <label>Enter Profile Name</label>
                    <input name="profileName" className="profile-inputs" required />
                </div>
                <div className="profile-input-boxes">
                    <label>Enter URL -</label>
                    <input name="url" type="url" className="profile-inputs" required />
                </div>
            </div>
            <div className="submit-box">
                <button type="button" className="close-button" onClick={onClose}>close</button>
                <button type="submit" className="save-button">save</button>
            </div>
        </form>
    );
}

export default ProfileAdderForm;
