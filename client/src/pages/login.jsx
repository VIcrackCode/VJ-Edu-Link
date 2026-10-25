import { Navigate, useLocation, useNavigate } from "react-router-dom";
import "../styles/login.css";
import fullLogo from "../assets/images/full_logo.png";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { requestPasswordReset, resetPassword } from "../services/authService";
import LoadingScreen from "../components/common/LoadingScreen";

function Login() {
    const { login } = useAuth();
    const location = useLocation();
    const [enteredDetails, setEnteredDetails] = useState({ id: "", password: "" });
    const [resetDetails, setResetDetails] = useState({ phone: "", otp: "", password: "", confirmPassword: "" });
    const [mode, setMode] = useState("login");
    const [feedback, setFeedback] = useState(location.state?.message || "");
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    function handleChange(e) {
        const { name, value } = e.target;
        setEnteredDetails((prev) => ({ ...prev, [name]: value }));
        setFeedback("");
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        setFeedback("");
        try {
            const user = await login(enteredDetails);
            navigate(user.role === "Admin" ? "/admin" : user.role === "Class Representative" ? "/class-representative" : "/home");
        } catch (error) {
            setFeedback(error.message || "Unable to sign in. Check your connection and try again.");
        } finally {
            setSubmitting(false);
        }
    }

    function handleResetChange(event) {
        const { name, value } = event.target;
        setResetDetails((current) => ({ ...current, [name]: value }));
    }

    async function sendOtp(event) {
        event.preventDefault();
        try {
            const result = await requestPasswordReset(resetDetails.phone);
            setMode("verify");
            setFeedback(result.developmentOtp ? `Development OTP: ${result.developmentOtp}` : result.message || "Password reset request submitted.");
        } catch (error) {
            setFeedback(error.message);
        }
    }

    async function handlePasswordReset(event) {
        event.preventDefault();
        if (resetDetails.password !== resetDetails.confirmPassword) {
            setFeedback("Passwords do not match.");
            return;
        }
        try {
            await resetPassword(resetDetails);
            setMode("login");
            setFeedback("Password reset successfully. You can now sign in.");
        } catch (error) {
            setFeedback(error.message);
        }
    }

    return (
        <main className="auth-page">
        <div className="login-container">
            <div className="logo-container">
                <img src={fullLogo} className="full-logo" alt="VJ Edu Link" />
            </div>
            <div className="login-header">
                <h1>{mode === "login" ? "Login to VJ Edu Link" : "Reset your password"}</h1>
                <div className="login-description">
                    <p className="description">A centralized platform for educational resources, designed to make learning
                    smarter, more accessible, and more productive for every student.</p>
                </div>
            </div>
            {feedback && <p className="auth-feedback" role="status">{feedback}</p>}
            {mode === "login" ? <form onSubmit={handleSubmit} className="login-form">
                <div className="input-container">
                    <label htmlFor="id">Enter College-Id</label>
                    <input type="text" id="id" name="id" autoComplete="username" autoCapitalize="characters" spellCheck="false" placeholder="e.g. 25071A0001" value={enteredDetails.id} onChange={handleChange} required />
                </div>
                <div className="input-container">
                    <label htmlFor="password">Enter Password</label>
                    <input type="password" id="password" name="password" autoComplete="current-password" placeholder="Password" value={enteredDetails.password} onChange={handleChange} required />
                </div>
                <div className="submit-container">
                    <button type="submit" disabled={submitting}>{submitting ? "Signing in…" : "Login"}</button>
                </div>
            </form> : mode === "request" ? <form onSubmit={sendOtp} className="login-form">
                <div className="input-container">
                    <label htmlFor="phone">Registered phone number</label>
                    <input type="tel" id="phone" name="phone" inputMode="numeric" placeholder="10-digit phone number" value={resetDetails.phone} onChange={handleResetChange} required />
                </div>
                <div className="submit-container"><button type="submit">Send OTP</button></div>
            </form> : <form onSubmit={handlePasswordReset} className="login-form">
                <div className="input-container"><label htmlFor="otp">OTP</label><input id="otp" name="otp" inputMode="numeric" placeholder="6-digit OTP" value={resetDetails.otp} onChange={handleResetChange} required /></div>
                <div className="input-container"><label htmlFor="new-password">New password</label><input type="password" id="new-password" name="password" minLength="8" value={resetDetails.password} onChange={handleResetChange} required /></div>
                <div className="input-container"><label htmlFor="confirm-password">Confirm new password</label><input type="password" id="confirm-password" name="confirmPassword" minLength="8" value={resetDetails.confirmPassword} onChange={handleResetChange} required /></div>
                <div className="submit-container"><button type="submit">Reset password</button></div>
            </form>}
            <button className="auth-link-button" type="button" onClick={() => { setMode(mode === "login" ? "request" : "login"); setFeedback(""); }}>
                {mode === "login" ? "Forgot password? Reset by phone OTP" : "Back to login"}
            </button>
        </div>
        </main>
    );
}

function LoginGate() {
    const { user, loading } = useAuth();
    if (loading) return <LoadingScreen />;
    if (user) return <Navigate to={user.role === "Admin" ? "/admin" : user.role === "Class Representative" ? "/class-representative" : "/home"} replace />;
    return <Login />;
}

export default LoginGate;
