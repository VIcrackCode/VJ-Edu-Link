import "../../styles/emptyState.css";

function LoadingScreen({ message = "Loading VJ Edu Link..." }) {
    return (
        <div className="empty-state" role="status">
            <p>{message}</p>
            <span>Please wait a moment.</span>
        </div>
    );
}

export default LoadingScreen;
