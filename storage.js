// storage.js
// Helper functions for LocalStorage / SessionStorage

const LS_USERS_KEY = "yt_users";          // LocalStorage users list
const SS_CURRENT_USER = "currentUser";    // SessionStorage current user

export function getUsers() {
    const raw = localStorage.getItem(LS_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
}

export function saveUsers(users) {
    localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
}

export function findUser(username) {
    return getUsers().find(u => u.username.toLowerCase() === username.toLowerCase());
}

export function setCurrentUser(username) {
    sessionStorage.setItem(SS_CURRENT_USER, username);
}

export function getCurrentUser() {
    return sessionStorage.getItem(SS_CURRENT_USER);
}

export function logout() {
    sessionStorage.removeItem(SS_CURRENT_USER);
}

export function requireAuthOrRedirect() {
    const u = getCurrentUser();
    if (!u) window.location.href = "login.html";
    return u;
}

// Playlist helpers (per user)
export function getUserPlaylists(username) {
    const user = findUser(username);
    if (!user) return [];
    if (!user.playlists) user.playlists = []; // ensure exists
    return user.playlists;
}

export function upsertUser(username, updaterFn) {
    const users = getUsers();
    const idx = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
    if (idx === -1) return;

    const updated = updaterFn(users[idx]) || users[idx];
    users[idx] = updated;
    saveUsers(users);
}

export function ensureDefaultPlaylist(username) {
    upsertUser(username, (u) => {
        if (!u.playlists) u.playlists = [];
        if (u.playlists.length === 0) {
            u.playlists.push({
                id: crypto.randomUUID(),
                name: "My Favorites",
                items: [] // each item: { videoId, title, thumbnail, duration, viewCount, rating }
            });
        }
        return u;
    });
}
