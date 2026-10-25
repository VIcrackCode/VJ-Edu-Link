import Card from "./Card";
import "../../../styles/eventDetailing.css";

function EventCards({ data = [] }) {
    return (
        <div className="event-cards">
            {data.map((item) => <Card key={item.id} details={item} />)}
        </div>
    );
}

export default EventCards;
