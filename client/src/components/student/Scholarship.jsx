import ScholarshipCards from "./scholarships/ScholarshipCards";
import "../../styles/scholarshipDetailing.css";
import EmptyState from "../common/EmptyState";
import { useContent } from "../../hooks/useContent";

function Scholarship() {
    const { items, error, loading } = useContent("scholarship");
    if (loading) return <EmptyState message="Loading E-PASS updates..." />;
    if (error) return <EmptyState message={error} />;
    return (
        <div style={{ overflow: "hidden" }}>
            <div className="scholarship-box">
                <ScholarshipCards data={items} />
            </div>
        </div>
    );
}

export default Scholarship;
