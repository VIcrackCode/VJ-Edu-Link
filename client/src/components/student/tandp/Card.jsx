import ContentImage from "../../common/ContentImage";

function Card({ details }) {
    const poster = details.image || details.img;
    return (
        <div className="tandp-card">
            <div className="tandp-card-image">
                <ContentImage
                    image={poster}
                    contentType="tandp"
                    contentId={details.id}
                    fallback="/poster.jpeg"
                    alt={`${details.title} poster`}
                />
            </div>
            <div className="tandp-card-content">
                <h3>{details.title}</h3>
                <p>{details.description}</p>
            </div>
        </div>
    );
}

export default Card;
