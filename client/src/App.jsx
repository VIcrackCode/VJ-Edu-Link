import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/login.jsx";
import HomePage from "./pages/home.jsx";
import ClassRepresentative from "./components/representative/ClassRepresentative.jsx";
import AdminDashboard from "./components/admin/AdminDashboard.jsx";
import RoleRoute from "./components/representative/RoleRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { useAuth } from "./hooks/useAuth.js";
import LoadingScreen from "./components/common/LoadingScreen.jsx";

function DashboardRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  const destination = user.role === "Admin"
    ? "/admin"
    : user.role === "Class Representative"
      ? "/class-representative"
      : "/home";
  return <Navigate to={destination} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<DashboardRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home/*" element={<RoleRoute allowedRoles={["Student", "Class Representative"]}><HomePage /></RoleRoute>} />
          <Route path="/class-representative/*" element={<RoleRoute allowedRoles={["Class Representative"]}><ClassRepresentative /></RoleRoute>} />
          <Route path="/admin/*" element={<RoleRoute allowedRoles={["Admin"]}><AdminDashboard /></RoleRoute>} />
          <Route path="*" element={<DashboardRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
