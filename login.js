const form = document.getElementById("loginForm");
const msg = document.getElementById("msg");

function showMessage(text, type = "danger") {
    msg.className = `alert alert-${type}`;
    msg.textContent = text;
    msg.classList.remove("d-none");
}

form.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    const users = getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user || user.password !== password) {
        return showMessage("שם משתמש או סיסמה לא נכונים.");
    }

    // חייב Session + redirect ל search :contentReference[oaicite:4]{index=4}
    setCurrentUser({
        username: user.username,
        firstName: user.firstName,
        imageUrl: user.imageUrl
    });

    showMessage("התחברת בהצלחה! מעבירה ל-Search…", "success");
    setTimeout(() => {
        window.location.href = "search.html";
    }, 350);
});
