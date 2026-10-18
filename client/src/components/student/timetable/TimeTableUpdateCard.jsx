function TimeTableUpdateCard({ updates }) {
    return (
        <div className="timetable-update-card">
            <p><strong>Update: </strong>{updates.update}</p>
            <p><strong>Period: </strong>{updates.period}</p>
            <p><strong>Reason: </strong>{updates.reason}</p>
        </div>
    );
}

export default TimeTableUpdateCard;
