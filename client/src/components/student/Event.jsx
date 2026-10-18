import EventCards from "./events/EventCards";
import "../../styles/eventDetailing.css";
import { useState } from "react";
import EmptyState from "../common/EmptyState";
import { useContent } from "../../hooks/useContent";

function Event() {
    const { items, error, loading } = useContent("events");
    const [filter, setFilter] = useState("all");
    const filtered = filter === "all"
        ? items
        : items.filter((event) => String(event.eventType || event.type || "").toLowerCase() === filter);
    if (loading) return <EmptyState message="Loading events..." />;
    if (error) return <EmptyState message={error} />;
    return (
        <>
            <div className="filter-header">
                <p> Filter : Choose an Option</p>
                <select className="filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="all">All Events</option>
                    <option value="technical">Technical</option>
                    <option value="hackathon">Hackathons</option>
                    <option value="hardware">Hardware</option>
                    <option value="fun">Fun Activites</option>
                </select>
            </div>
            <div className="events-box">
                {filtered.length > 0 ? (
                    <EventCards data={filtered} />
                ) : (
                    <EmptyState message={items.length === 0 ? "No events have been added yet." : "No events are available in this category."} />
                )}
            </div>
        </>
    );
}

export default Event;
