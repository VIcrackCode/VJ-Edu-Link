import {
    NavLink,
    Route,
    Routes,
    Link,
    useNavigate
} from "react-router-dom";

import { useState } from "react";

import ContentManager from "./ContentManager";
import StudentsManager from "./StudentsManager";
import TimetableImageManager from "./TimetableImageManager";
import { managementPages } from "./managementConfig";

import Announcement from "../student/Announcement";
import TAndP from "../student/TAndP";
import Course from "../student/Course";
import Event from "../student/Event";
import Timetable from "../student/Timetable";
import Scholarship from "../student/Scholarship";
import Profile from "../student/Profile";
import Resource from "../student/Resource";
import AccountProfile from "../student/AccountProfile";

import "../../styles/classRepresentative.css";
import { useAuth } from "../../hooks/useAuth";


/* =========================================================
   CLASS REPRESENTATIVE VIEW PATHS
   ========================================================= */

const studentViews = [
    ["resources", "Resources", Resource],
    ["announcements", "Announcements", Announcement],
    ["tandpupdates", "T&P Updates", TAndP],
    ["courses", "Courses", Course],
    ["events", "Events", Event],
    ["timetables", "Timetable", Timetable],
    ["epass-updates", "E-PASS Updates", Scholarship],
    ["profiles", "Profiles", Profile],
];


/* =========================================================
   CLASS REPRESENTATIVE DASHBOARD
   ========================================================= */

function CrDashboard() {

    return (
        <section className="cr-dashboard">

            <div className="cr-page-header">

                <div>

                    <p className="cr-eyebrow">
                        Class Representative dashboard
                    </p>

                    <h1>
                        Manage your class, clearly.
                    </h1>

                    <p>
                        Publish and maintain the information students rely on,
                        while retaining all Student views.
                    </p>

                </div>

                <Link
                    className="cr-primary-button"
                    to="/class-representative/manage/announcements"
                >
                    Create announcement
                </Link>

            </div>


            <div className="cr-summary-grid">

                {Object.entries(managementPages).map(
                    ([key, page]) => (

                        <Link
                            className="cr-summary-card"
                            key={key}
                            to={`/class-representative/manage/${key}`}
                        >

                            <span>
                                {page.title}
                            </span>

                            <strong>
                                Manage
                            </strong>

                            <small>
                                {page.description}
                            </small>

                        </Link>

                    )
                )}


                <Link
                    className="cr-summary-card"
                    to="/class-representative/manage/accounts"
                >

                    <span>
                        Accounts
                    </span>

                    <strong>
                        Manage
                    </strong>

                    <small>
                        Create student logins with class details from your CR account.
                    </small>

                </Link>

            </div>

        </section>
    );
}


/* =========================================================
   CLASS REPRESENTATIVE MODULE
   ========================================================= */

function ClassRepresentative() {

    const [menuOpen, setMenuOpen] = useState(false);

    const closeMenu = () => {
        setMenuOpen(false);
    };

    const { logout, user } = useAuth();

    const navigate = useNavigate();


    return (

        <div className="cr-page">


            {/* =================================================
                HEADER
               ================================================= */}

            <header className="cr-header">

                <button
                    className="cr-menu-button"
                    type="button"
                    onClick={() =>
                        setMenuOpen((open) => !open)
                    }
                    aria-label="Toggle menu"
                >
                    ☰
                </button>


                <img
                    src="/full_logo.png"
                    alt="VJ Edu Link"
                />


                <Link className="cr-profile-link" to="/class-representative/account" aria-label="View account profile details">
                    <img src={user?.profileImage?.url || "/profile.png"} alt="" />

                    {user?.name} · Class Representative

                </Link>


                <button
                    className="cr-logout-button"
                    type="button"
                    onClick={() => {

                        logout();

                        navigate("/login");

                    }}
                >
                    Logout
                </button>

            </header>



            {/* =================================================
                MAIN SHELL
               ================================================= */}

            <div className="cr-shell">


                {/* =================================================
                    SIDEBAR
                   ================================================= */}

                <aside
                    className={`cr-sidebar ${
                        menuOpen ? "is-open" : ""
                    }`}
                >

                    <nav
                        onClick={closeMenu}
                        aria-label="Class Representative navigation"
                    >


                        {/* ================================
                            OVERVIEW
                           ================================= */}

                        <p className="cr-nav-label">
                            Overview
                        </p>


                        <NavLink
                            end
                            to="/class-representative"
                        >
                            Dashboard
                        </NavLink>



                        {/* ================================
                            STUDENT VIEWS
                           ================================= */}

                        <p className="cr-nav-label">
                            Student views
                        </p>


                        {studentViews.map(
                            ([path, label]) => (

                                <NavLink
                                    key={path}
                                    to={`/class-representative/view/${path}`}
                                >
                                    View {label}
                                </NavLink>

                            )
                        )}



                        {/* ================================
                            MANAGEMENT
                           ================================= */}

                        <p className="cr-nav-label">
                            Management
                        </p>


                        {Object.entries(managementPages).map(
                            ([key, page]) => (

                                <NavLink
                                    key={key}
                                    to={`/class-representative/manage/${key}`}
                                >
                                    Manage {page.title}
                                </NavLink>

                            )
                        )}


                        <NavLink
                            to="/class-representative/manage/accounts"
                        >
                            Manage Accounts
                        </NavLink>


                    </nav>

                </aside>



                {/* =================================================
                    MOBILE BACKDROP
                   ================================================= */}

                {menuOpen && (

                    <button
                        className="cr-backdrop"
                        type="button"
                        aria-label="Close navigation"
                        onClick={closeMenu}
                    />

                )}



                {/* =================================================
                    CONTENT
                   ================================================= */}

                <main className="cr-main">

                    <Routes>


                        <Route path="account" element={<AccountProfile />} />


                        {/* Dashboard */}

                        <Route
                            index
                            element={<CrDashboard />}
                        />



                        {/* Student Views */}

                        {studentViews.map(
                            ([path, , ViewComponent]) => (

                                <Route
                                    key={path}
                                    path={`view/${path}`}
                                    element={<ViewComponent />}
                                />

                            )
                        )}



                        {/* Management Pages */}

                        {Object.entries(managementPages).map(
                            ([key, config]) => (

                                <Route
                                    key={key}
                                    path={`manage/${key}`}
                                    element={
                                        <>
                                            {key === "timetable" && <TimetableImageManager />}
                                            <ContentManager {...config} />
                                        </>
                                    }
                                />

                            )
                        )}



                        {/* Accounts */}

                        <Route
                            path="manage/accounts"
                            element={<StudentsManager />}
                        />

                    </Routes>

                </main>

            </div>

        </div>
    );
}


export default ClassRepresentative;
