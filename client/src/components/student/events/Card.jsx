import "../../../styles/eventDetailing.css";
import ContentImage from "../../common/ContentImage";

function Card({ details }) {
    const poster = details.poster || details.img;
    return (
        <div className="event-card">
            <div className="event-card-header-section">
                <p><strong>By: </strong>{details.organizer || details.by}</p>
                <p><strong>Venue: </strong>{details.venue}</p>
                <p><strong>Time: </strong>{details.time}</p>
                <p><strong>Type Of Event: </strong>@ {details.eventType || details.type}</p>
                <p><strong>Link to Register: </strong>
                    <a target="_blank" rel="noreferrer" href={details.registrationLink || details.link}>
                        {details.registrationLink || details.link}
                    </a>
                </p>
            </div>
            <div className="event-card-poster-section">
                <ContentImage
                    className="poster"
                    image={poster}
                    contentType="events"
                    contentId={details.id}
                    fallback="/poster.jpeg"
                    alt=""
                />
            </div>
        </div>
    );
}

export default Card;
