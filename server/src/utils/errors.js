export function duplicateKeyMessage(error) {
    const key = Object.keys(error.keyPattern || {})[0];
    if (key === "collegeId") return "That college ID is already registered.";
    if (key === "phone") return "That phone number is already registered.";
    return "A record with those details already exists.";
}
