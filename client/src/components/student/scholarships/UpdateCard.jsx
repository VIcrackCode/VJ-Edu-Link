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
                {scholarship.attachment?.url && (
                    <p><strong>Attachment: </strong><a href={scholarship.attachment.url} target="_blank" rel="noreferrer">{scholarship.attachment.fileName || "Open file"}</a></p>
                )}
            </div>
        </div>
    );
}

export default UpdateCard;
