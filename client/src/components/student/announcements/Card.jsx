function Card({ data }) {
    const documentLink = data.documentLink || data.document;

    return (
        <div className="announcement-card">
            <h3>{data.title}</h3>
            <p><strong>Description: </strong>{data.description}</p>
            {documentLink && (
                <p><strong>Related Documents: </strong>
                    <a target="_blank" rel="noreferrer" href={documentLink}>{documentLink}</a>
                </p>
            )}
        </div>
    );
}

export default Card;
