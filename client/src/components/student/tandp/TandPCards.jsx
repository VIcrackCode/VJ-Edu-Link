import Card from "./Card";
import EmptyState from "../../common/EmptyState";

function TandPCards({ data = [] }) {
    if (!Array.isArray(data) || data.length === 0) {
        return <EmptyState message="No training and placement updates have been added yet." />;
    }
    return (
        <div className="tandp-cards">
            {data.map((item) => <Card key={item.id} details={item} />)}
        </div>
    );
}

export default TandPCards;
