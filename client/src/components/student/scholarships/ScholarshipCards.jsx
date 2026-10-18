import UpdateCard from "./UpdateCard";
import "../../../styles/scholarshipDetailing.css";
import EmptyState from "../../common/EmptyState";

function ScholarshipCards({ data = [] }) {
    if (!Array.isArray(data) || data.length === 0) {
        return <EmptyState message="No scholarship updates have been added yet." />;
    }
    return (
        <>
            <div className="scholarship-intro">
                <h3>Updates for E-PASS</h3>
                <p>The E-PASS Updates Page provides students with the latest information about scholarship applications, renewal dates, deadlines, and important announcements.</p>
            </div>
            <div className="scholarship-list">
                {data.map((scholarship) => (
                    <UpdateCard key={scholarship.id} scholarship={scholarship} />
                ))}
            </div>
        </>
    );
}

export default ScholarshipCards;
