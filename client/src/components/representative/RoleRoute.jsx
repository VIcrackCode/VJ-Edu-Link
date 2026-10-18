import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import LoadingScreen from "../common/LoadingScreen";

function RoleRoute({ children, allowedRoles }) {
    const { user, loading } = useAuth();
    if (loading) return <LoadingScreen />;
    if (!user) return <Navigate to="/login" replace />;
    if (!allowedRoles.includes(user.role)) {
        return <Navigate to={user.role === "Class Representative" ? "/class-representative" : "/home"} replace />;
    }
    return children;
}

export default RoleRoute;
