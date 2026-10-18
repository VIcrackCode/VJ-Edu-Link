import "../../../styles/profileDetailing.css";

function AddProfile({ onClick }) {
    return (
        <div className="profile-card">
            <button type="button" className="plus" name="plus" onClick={onClick}>+</button>
            <p>Add Profile</p>
        </div>
    );
}

export default AddProfile;
