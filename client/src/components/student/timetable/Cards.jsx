import TimeTableUpdateCard from "./TimeTableUpdateCard.jsx";
import EmptyState from "../../common/EmptyState";

function Cards({ data = [] }) {
    if (!Array.isArray(data) || data.length === 0) {
        return <EmptyState message="No timetable updates have been added yet." />;
    }
    return data.map((updates) => <TimeTableUpdateCard key={updates.id} updates={updates} />);
}

export default Cards;
