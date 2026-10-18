import "../../../styles/resourceDetailing.css";

function ResourceBox({ data }) {
    return (
        <div className="resource-full-box">
            <h2>Theory</h2>
            <div className="resource-box">
                {data.filter((item) => !item.lab).map((item) => (
                    <div key={item.id} className="resource-container">
                        <h3>{item.subject}</h3>
                        {item.materials && <a target="_blank" rel="noreferrer" className="resource-links" href={item.materials}>Materials</a>}
                        {item.question_papers && <a target="_blank" rel="noreferrer" className="resource-links" href={item.question_papers}>Question Papers</a>}
                        {item.syllabus && <a target="_blank" rel="noreferrer" className="resource-links" href={item.syllabus}>Syllabus</a>}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ResourceBox;
