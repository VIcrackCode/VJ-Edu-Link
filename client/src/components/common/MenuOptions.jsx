import { NavLink } from "react-router-dom";

const menuItems = [
    { to: "/home/resources", label: "Resources" },
    { to: "/home/announcements", label: "Announcements" },
    { to: "/home/tandp-updates", label: "T&P Updates" },
    { to: "/home/courses", label: "Courses" },
    { to: "/home/events", label: "Events" },
    { to: "/home/timetables", label: "Timetables" },
    { to: "/home/epass-updates", label: "E-Pass Updates" },
    { to: "/home/profiles", label: "Profile" },
];

function MenuOptions({ onNavigate }) {
    return (
        <nav className="menu-options" aria-label="Main menu">
            {menuItems.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => isActive ? "menu-link active" : "menu-link"}
                    onClick={onNavigate}
                >
                    {item.label}
                </NavLink>
            ))}
        </nav>
    );
}

export default MenuOptions;
