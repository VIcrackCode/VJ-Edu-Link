import "../../../styles/resourceDetailing.css";

function LabResourceBox({ data }) {
    return (
        <div className="lab-resource-full-box">
            <h2>Lab</h2>
            <div className="lab-resource-box">
                {data.filter((item) => item.lab).map((item) => (
                    <div key={item.id} className="lab-resource-container">
                        <h3>{item.subject}</h3>
                        {item.documents && <a target="_blank" rel="noreferrer" className="resource-links" href={item.documents}>Documents</a>}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default LabResourceBox;
