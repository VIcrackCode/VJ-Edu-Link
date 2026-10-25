import "../../styles/timetableDetailing.css";
import Cards from "./timetable/Cards";
import EmptyState from "../common/EmptyState";
import { useContent } from "../../hooks/useContent";
import ContentImage from "../common/ContentImage";

function Timetable() {
    const { items, error, loading } = useContent("timetable");
    const timetableRecord = items.find((item) => item.timetableImage);
    if (loading) return <EmptyState message="Loading timetable..." />;
    if (error) return <EmptyState message={error} />;
    return (
        <div className="timetable-box">
            <div className="timetable-section">
                <h3>Time Table</h3>
                <ContentImage
                    className="timetable"
                    image={timetableRecord?.timetableImage}
                    sourcePath="/timetable-image/file"
                    fallback="/CSE_A_TimeTable.jpg"
                    alt="Class timetable"
                />
            </div>
            <div className="timetable-updates-section">
                <h3>Updates listed in Time Table</h3>
                <Cards data={items} />
            </div>
        </div>
    );
}

export default Timetable;
