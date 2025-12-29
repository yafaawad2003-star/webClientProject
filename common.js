function renderHeader(activePage) {
    const header = document.getElementById("appHeader");
    if (!header) return;

    const username = getCurrentUsername();
    const user = username ? getUserByUsername(username) : null;

    header.innerHTML = `
    <nav class="navbar navbar-expand-lg bg-white border-bottom">
      <div class="container">
        <a class="navbar-brand fw-bold" href="index.html">WEB CLIENT</a>

        <div class="d-flex gap-2 align-items-center">
          <a class="btn btn-outline-primary btn-sm ${activePage === "search" ? "active" : ""}" href="search.html">חיפוש</a>
          <a class="btn btn-outline-primary btn-sm ${activePage === "playlists" ? "active" : ""}" href="playlists.html">פלייליסטים</a>

          ${user ? `
            <div class="d-flex align-items-center gap-2 ms-2">
              <span class="small">שלום, <b>${user.username}</b></span>
              <img src="${user.imageUrl}" alt="user" style="width:32px;height:32px;border-radius:50%;object-fit:cover">
              <button class="btn btn-sm btn-danger ms-2" id="btnLogout">התנתקות</button>
            </div>
          ` : `
            <a class="btn btn-sm btn-success" href="login.html">התחברות</a>
            <a class="btn btn-sm btn-secondary" href="register.html">הרשמה</a>
          `}
        </div>
      </div>
    </nav>
  `;

    const btn = document.getElementById("btnLogout");
    if (btn) btn.addEventListener("click", logout);
}
