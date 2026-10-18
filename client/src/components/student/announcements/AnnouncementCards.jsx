import Card from "./Card";

function AnnouncementCards({ data = [] }) {
    return data.map((details) => <Card key={details.id} data={details} />);
}

export default AnnouncementCards;
