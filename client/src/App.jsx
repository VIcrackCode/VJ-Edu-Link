import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/login.jsx";
import HomePage from "./pages/home.jsx";
import ClassRepresentative from "./components/representative/ClassRepresentative.jsx";
import RoleRoute from "./components/representative/RoleRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { useAuth } from "./hooks/useAuth.js";
import LoadingScreen from "./components/common/LoadingScreen.jsx";

function DashboardRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "Class Representative" ? "/class-representative" : "/home"} replace />;
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
          <Route path="*" element={<DashboardRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
