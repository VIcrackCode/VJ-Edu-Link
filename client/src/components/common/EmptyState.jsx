import "../../styles/emptyState.css";

function EmptyState({ message }) {
    return (
        <div className="empty-state" role="status">
            <p>{message}</p>
            <span>Please check back later.</span>
        </div>
    );
}

export default EmptyState;
