import jwt from "jsonwebtoken";

function jwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not configured.");
    }
    return secret;
}

export function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) {
        return res.status(401).json({ message: "Authentication is required." });
    }
    try {
        req.user = jwt.verify(token, jwtSecret());
        return next();
    } catch {
        return res.status(401).json({ message: "Your session is invalid or expired." });
    }
}

export function requireRole(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user?.role)) {
            return res.status(403).json({ message: "You do not have permission for this action." });
        }
        return next();
    };
}

export { jwtSecret };
