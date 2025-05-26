import bcrypt from 'bcryptjs';

const createAdminAcc = () => {
    const adminUsername = "Administrator";
    const adminEmail = "admin@mymusiclib.lib";
    const admiinPassword = "admin123";

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(admiinPassword, salt);

    const admin = {
    username: adminUsername,
    password: hash,
    email: adminEmail,
    role: "admin",
    createAt: new Date().toDateString()
    };

    localStorage.setItem('admin', JSON.stringify(admin));

}
export default createAdminAcc;