function loadUsers() {
    const raw = localStorage.getItem("users");
    return raw ? JSON.parse(raw) : [];
}

function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
}

function getUserByUsername(username) {
    return loadUsers().find(u => u.username === username);
}

function updateUser(updatedUser) {
    const users = loadUsers();
    const idx = users.findIndex(u => u.username === updatedUser.username);
    if (idx !== -1) {
        users[idx] = updatedUser;
        saveUsers(users);
    }
}

function getCurrentUsername() {
    return sessionStorage.getItem("currentUser");
}

function setCurrentUsername(username) {
    sessionStorage.setItem("currentUser", username);
}

function clearCurrentUsername() {
    sessionStorage.removeItem("currentUser");
}
