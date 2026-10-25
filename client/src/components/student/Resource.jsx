import ResourceBox from "./resources/ResourceBox";
import LabResourceBox from "./resources/LabResourceBox";
import EmptyState from "../common/EmptyState";
import { useContent } from "../../hooks/useContent";

function groupResources(items) {
    const grouped = {};
    const typeMap = {
        Materials: "materials",
        "Question Papers": "question_papers",
        Syllabus: "syllabus",
        "Lab Documents": "documents",
    };
    for (const item of items) {
        const key = `${item.category}-${item.subject}`;
        if (!grouped[key]) {
            grouped[key] = {
                id: key,
                subject: item.subject,
                lab: item.category === "Lab",
            };
        }
        const field = typeMap[item.documentType] || "documents";
        grouped[key][field] = item.documentLink || item.attachment?.url || item.attachment;
    }
    return Object.values(grouped);
}

function Resource() {
    const { items, error, loading } = useContent("resources");
    const grouped = groupResources(items);
    if (loading) return <EmptyState message="Loading resources..." />;
    if (error) return <EmptyState message={error} />;
    if (grouped.length === 0) return <EmptyState message="No resources have been added yet." />;
    return (
        <div className="resources-box">
            <ResourceBox data={grouped} />
            <LabResourceBox data={grouped} />
        </div>
    );
}

export default Resource;
