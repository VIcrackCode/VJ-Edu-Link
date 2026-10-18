import "../../styles/announcementDetailing.css";
import { useState } from "react";
import AnnouncementCards from "./announcements/AnnouncementCards";
import EmptyState from "../common/EmptyState";
import { useContent } from "../../hooks/useContent";

const categoryMap = {
    assignment: "Assignments",
    exam: "Exams",
    cbp: "CBPs",
    report: "WILs",
};

function Announcement() {
    const { items, error, loading } = useContent("announcements");
    const [filter, setFilter] = useState("all");
    const filtered = filter === "all"
        ? items
        : items.filter((item) => item.category === categoryMap[filter] || item.category?.toLowerCase() === filter);
    if (loading) return <EmptyState message="Loading announcements..." />;
    if (error) return <EmptyState message={error} />;
    return (
        <div className="announcements-box">
            <div className="filter-header">
                <p> Filter : Choose an Option</p>
                <select className="filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="all">All Announcements</option>
                    <option value="assignment">Assignments</option>
                    <option value="exam">Exams</option>
                    <option value="cbp">CBPs</option>
                    <option value="report">WILs</option>
                    <option value="other">Other</option>
                </select>
            </div>
            {filtered.length > 0 ? (
                <AnnouncementCards data={filtered} />
            ) : (
                <EmptyState message={items.length === 0 ? "No announcements have been added yet." : "No announcements in this category."} />
            )}
        </div>
    );
}

export default Announcement;
