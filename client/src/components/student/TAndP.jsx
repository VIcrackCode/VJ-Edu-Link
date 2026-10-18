import TandPCards from "./tandp/TandPCards";
import "../../styles/tandpDetailing.css";
import EmptyState from "../common/EmptyState";
import { useContent } from "../../hooks/useContent";

function TAndP() {
    const { items, error, loading } = useContent("tandp");
    if (loading) return <EmptyState message="Loading T&P updates..." />;
    if (error) return <EmptyState message={error} />;
    return (
        <div className="tandp-box">
            <TandPCards data={items} />
        </div>
    );
}

export default TAndP;
