if (
    profile.access_state !== "active" ||
    new Date(profile.approval_expires_at) < new Date()
) {
    return res.status(403).json({
        success: false,
        message: "Approval expired."
    });
}
