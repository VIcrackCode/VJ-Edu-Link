import "../../../styles/scholarshipDetailing.css";

function UpdateCard({ scholarship }) {
    return (
        <div className="scholarship-card">
            <div className="scholarship-card-header">
                <h3>{scholarship.title}</h3>
            </div>
            <div className="scholarship-card-body">
                <p>{scholarship.description}</p>
                <p><strong>Deadline:</strong> {scholarship.deadline}</p>
            </div>
        </div>
    );
}

export default UpdateCard;
