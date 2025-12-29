function isLoggedIn() {
    return !!getCurrentUsername();
}

function requireLogin() {
    if (!isLoggedIn()) {
        window.location.href = "login.html";
    }
}

function logout() {
    clearCurrentUsername();
    window.location.href = "login.html";
}
