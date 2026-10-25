import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import LoadingScreen from "../common/LoadingScreen";

function RoleRoute({ children, allowedRoles }) {
    const { user, loading } = useAuth();
    if (loading) return <LoadingScreen />;
    if (!user) return <Navigate to="/login" replace />;
    if (!allowedRoles.includes(user.role)) {
        const destination = user.role === "Admin"
            ? "/admin"
            : user.role === "Class Representative"
                ? "/class-representative"
                : "/home";
        return <Navigate to={destination} replace />;
    }
    return children;
}

export default RoleRoute;
