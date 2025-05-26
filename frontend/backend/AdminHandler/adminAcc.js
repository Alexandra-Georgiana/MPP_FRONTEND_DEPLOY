const createAdminAcc = () => {
    const adminUsername = "Administrator";
    const adminEmail = "admin@mymusiclib.lib";
    const adminPassword = "admin123"; // Note: This should be handled by your backend

    const admin = {
        username: adminUsername,
        email: adminEmail,
        role: "admin",
        createdAt: new Date().toDateString()
    };

    // Store only non-sensitive data in localStorage
    localStorage.setItem('admin', JSON.stringify(admin));
}

export default createAdminAcc;