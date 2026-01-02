function getUsers() {
  return JSON.parse(localStorage.getItem("users") || "[]");
}
function setUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function getCurrentUser() {
  return JSON.parse(sessionStorage.getItem("currentUser") || "null");
}
function setCurrentUser(u) {
  sessionStorage.setItem("currentUser", JSON.stringify(u));
}
function logout() {
  sessionStorage.removeItem("currentUser");
  window.location.href = "login.html";
}

function requireAuth() {
  const u = getCurrentUser();
  if (!u) window.location.href = "login.html";
  return u;
}

function renderHeader({ active = "" } = {}) {
  const header = document.getElementById("appHeader");
  if (!header) return;

  const u = getCurrentUser();
  const userHtml = u
    ? `
      <div class="user-pill">
        <img src="${u.imageUrl || "https://i.pravatar.cc/80?img=12"}" alt="user">
        <div class="small">
          <div class="fw-semibold">${u.username}</div>
          <a href="#" class="text-decoration-none small" id="logoutBtn">Logout</a>
        </div>
      </div>
    `
    : `<a class="btn btn-dark btn-sm" href="login.html">Login</a>`;

  header.innerHTML = `
  <nav class="navbar navbar-expand-lg bg-transparent py-3">
    <div class="container app-shell">
      <a class="navbar-brand" href="index.html">TubeTracker</a>

      <div class="d-flex align-items-center gap-2">
        ${u ? `
          <a class="btn btn-outline-dark btn-sm ${active === "search" ? "active" : ""}" href="search.html">Search</a>
          <a class="btn btn-outline-dark btn-sm ${active === "playlists" ? "active" : ""}" href="playlists.html">Playlists</a>
        ` : `
          <a class="btn btn-outline-dark btn-sm" href="register.html">Register</a>
        `}
        ${userHtml}
      </div>
    </div>
  </nav>
  `;

  const btn = document.getElementById("logoutBtn");
  if (btn) btn.addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });
}
