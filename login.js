renderHeader("login");

document.getElementById("btnLogin").addEventListener("click", () => {
    const err = document.getElementById("err");
    err.textContent = "";

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    const user = getUserByUsername(username);
    if (!user || user.password !== password) {
        err.textContent = "שם משתמש או סיסמה לא נכונים.";
        return;
    }

    setCurrentUsername(username);
    window.location.href = "search.html";
});
