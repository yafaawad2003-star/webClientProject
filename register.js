const form = document.getElementById("registerForm");
const msg = document.getElementById("msg");

function showMessage(text, type = "danger") {
    msg.className = `alert alert-${type}`;
    msg.textContent = text;
    msg.classList.remove("d-none");
}

function validPassword(pw) {
    if (pw.length < 6) return false;
    const hasLetter = /[A-Za-z]/.test(pw);
    const hasNumber = /\d/.test(pw);
    const hasSpecial = /[^A-Za-z0-9]/.test(pw);
    return hasLetter && hasNumber && hasSpecial;
}

form.addEventListener("submit", (e) => {
    e.preventDefault(); // חשוב! בלי זה יש רענון ומרגיש "לא עובד"

    const username = document.getElementById("username").value.trim();
    const firstName = document.getElementById("firstName").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const imageUrl = document.getElementById("imageUrl").value.trim();

    if (!username || !firstName || !password || !confirmPassword || !imageUrl) {
        return showMessage("כל השדות חובה.");
    }
    const users = getUsers();
    const exists = users.some(u => u.username.toLowerCase() === username.toLowerCase());
    if (exists) return showMessage("שם המשתמש כבר קיים.");

    if (!validPassword(password)) {
        return showMessage("סיסמה לא תקינה: מינימום 6 תווים וכוללת אות, מספר ותו מיוחד.");
    }
    if (password !== confirmPassword) {
        return showMessage("אימות סיסמה נכשל (הסיסמאות לא זהות).");
    }

    users.push({ username, firstName, password, imageUrl });
    setUsers(users);

    showMessage("נרשמת בהצלחה! מעבירה לדף התחברות…", "success");
    setTimeout(() => window.location.href = "login.html", 600);
});
