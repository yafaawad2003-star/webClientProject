renderHeader("register");

function isStrongPassword(pw) {
    if (pw.length < 6) return false;
    const hasLetter = /[A-Za-z]/.test(pw);
    const hasDigit = /\d/.test(pw);
    return hasLetter && hasDigit;
}

document.getElementById("btnRegister").addEventListener("click", () => {
    const err = document.getElementById("err");
    err.textContent = "";

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const password = document.getElementById("password").value;
    const password2 = document.getElementById("password2").value;
    const imageUrl = document.getElementById("imageUrl").value.trim();

    // שדות חובה
    if (!username || !email || !firstName || !lastName || !password || !password2 || !imageUrl) {
        err.textContent = "כל השדות חובה.";
        return;
    }

    // username לא קיים
    if (getUserByUsername(username)) {
        err.textContent = "שם המשתמש כבר קיים במערכת.";
        return;
    }

    // סיסמה
    if (!isStrongPassword(password)) {
        err.textContent = "סיסמה חייבת מינימום 6 תווים ולכלול לפחות אות אחת ומספר אחד.";
        return;
    }

    // אימות סיסמה
    if (password !== password2) {
        err.textContent = "אימות הסיסמה לא תואם.";
        return;
    }

    const users = loadUsers();
    users.push({
        username, email, firstName, lastName, password, imageUrl,
        playlists: []
    });
    saveUsers(users);

    window.location.href = "login.html";
});
