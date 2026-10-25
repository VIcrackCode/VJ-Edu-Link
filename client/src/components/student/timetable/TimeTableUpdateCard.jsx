function TimeTableUpdateCard({ updates }) {
    return (
        <div className="timetable-update-card">
            <p><strong>Update: </strong>{updates.update}</p>
            <p><strong>Period: </strong>{updates.period}</p>
            <p><strong>Reason: </strong>{updates.reason}</p>
            {updates.attachment?.url && (
                <p><strong>Attachment: </strong><a href={updates.attachment.url} target="_blank" rel="noreferrer">{updates.attachment.fileName || "Open file"}</a></p>
            )}
        </div>
    );
}

export default TimeTableUpdateCard;
