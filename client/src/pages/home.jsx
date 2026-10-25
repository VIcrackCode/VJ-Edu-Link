import { Link, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/home.css";
import MenuOptions from "../components/common/MenuOptions.jsx";
import Resource from "../components/student/Resource.jsx";
import Announcement from "../components/student/Announcement.jsx";
import TAndP from "../components/student/TAndP.jsx";
import Course from "../components/student/Course.jsx";
import Event from "../components/student/Event.jsx";
import Timetable from "../components/student/Timetable.jsx";
import Scholarship from "../components/student/Scholarship.jsx";
import Profile from "../components/student/Profile.jsx";
import AccountProfile from "../components/student/AccountProfile.jsx";
import { useAuth } from "../hooks/useAuth";

function DashboardOverview() {
    return (
        <section className="dashboard-overview">
            <h1>Welcome to VJ Edu Link</h1>
            <p>Choose an option from the menu to view resources, schedules, courses, announcements, and more.</p>
        </section>
    );
}

function HomePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(() => typeof window === "undefined" ? true : window.innerWidth > 650);

    useEffect(() => {
        const handleResize = () => setMenuOpen(window.innerWidth > 650);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === "Escape" && window.innerWidth <= 650) setMenuOpen(false);
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, []);

    const closeMobileMenu = () => {
        if (window.innerWidth <= 650) setMenuOpen(false);
    };

    return (
        <div className="home-page">
            <div className="header">
                <div className="menu-button-section">
                    <button
                        id="menu-button"
                        className="menu-button"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={menuOpen}
                        aria-controls="main-menu"
                    >
                        &#9776;
                    </button>
                </div>
                <div className="logo-section">
                    <img src="/full_logo.png" className="full-logo-image" alt="logo" />
                </div>
                <div className="profile-section">
                    <Link className="profile-shortcut" to="/home/account" aria-label="View account profile details">
                    <div className="profile-details">
                        <p>{user.name} · {user.role}</p>
                        <p>{user.collegeId || user.id}</p>
                        <p>{user.branch}-{user.section}</p>
                    </div>
                    <div className="profile">
                        <img src={user.profileImage?.url || "/profile.png"} className="profile-image" alt="Profile" />
                    </div>
                    </Link>
                    <button className="logout-button" type="button" onClick={() => { logout(); navigate("/login"); }}>Logout</button>
                </div>
            </div>
            <div className={menuOpen ? "view" : "view menu-closed"}>
                <button className="menu-backdrop" type="button" aria-label="Close menu" onClick={closeMobileMenu} />
                <aside className="menu-section" id="main-menu">
                    <MenuOptions onNavigate={closeMobileMenu} />
                </aside>
                <main className="view-section">
                    <Routes>
                        <Route index element={<DashboardOverview />} />
                        <Route path="resources" element={<Resource />} />
                        <Route path="announcements" element={<Announcement />} />
                        <Route path="tandp-updates" element={<TAndP />} />
                        <Route path="courses" element={<Course />} />
                        <Route path="events" element={<Event />} />
                        <Route path="timetables" element={<Timetable />} />
                        <Route path="epass-updates" element={<Scholarship />} />
                        <Route path="profiles" element={<Profile />} />
                        <Route path="account" element={<AccountProfile />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}

export default HomePage;
