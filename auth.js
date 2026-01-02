// auth.js
import { getUsers, saveUsers, findUser, setCurrentUser, ensureDefaultPlaylist } from "./storage.js";

export function attachRegister(formId, msgId) {
    const form = document.getElementById(formId);
    const msg = document.getElementById(msgId);

    form.addEventListener("submit", (e) => {
        e.preventDefault(); // IMPORTANT: otherwise page reloads and you "stay" on same page

        const username = form.username.value.trim();
        const password = form.password.value.trim();
        const confirm = form.confirm.value.trim();

        if (username.length < 3) return show(msg, "Username must be at least 3 characters.");
        if (password.length < 4) return show(msg, "Password must be at least 4 characters.");
        if (password !== confirm) return show(msg, "Passwords do not match.");

        if (findUser(username)) return show(msg, "This username already exists.");

        const users = getUsers();
        users.push({
            username,
            password,
            playlists: [] // will be created default after register
        });
        saveUsers(users);

        ensureDefaultPlaylist(username);
        show(msg, "Registered successfully! You can login now.", true);

        setTimeout(() => window.location.href = "login.html", 700);
    });
}

export function attachLogin(formId, msgId) {
    const form = document.getElementById(formId);
    const msg = document.getElementById(msgId);

    form.addEventListener("submit", (e) => {
        e.preventDefault(); // IMPORTANT

        const username = form.username.value.trim();
        const password = form.password.value.trim();

        const user = findUser(username);
        if (!user || user.password !== password) {
            return show(msg, "Wrong username or password.");
        }

        // requirement: save currentUser in SessionStorage
        setCurrentUser(user.username);
        ensureDefaultPlaylist(user.username);

        // redirect to search.html
        window.location.href = "search.html";
    });
}

function show(el, text, ok = false) {
    el.classList.remove("d-none");
    el.classList.toggle("alert-success", ok);
    el.classList.toggle("alert-danger", !ok);
    el.textContent = text;
}
