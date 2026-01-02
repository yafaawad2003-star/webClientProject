// assets/header.js

// This file injects a simple header into #appHeader on every page.
// It also reads currentUser from sessionStorage to show the user name and image.

const headerHost = document.getElementById("appHeader");

function getCurrentUser() {
  const raw = sessionStorage.getItem("currentUser");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const user = getCurrentUser();

// Header HTML
headerHost.innerHTML = `
  <nav class="navbar navbar-expand-lg bg-white border-bottom">
    <div class="container">
      <a class="navbar-brand fw-bold" href="index.html">WEB CLIENT</a>

      <div class="ms-auto d-flex align-items-center gap-2">
        ${user
    ? `
              <span class="text-muted">Hello, <b>${user.fullName || user.username}</b></span>
              ${user.imageUrl
      ? `<img src="${user.imageUrl}" alt="User" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">`
      : ""
    }
              <a class="btn btn-outline-secondary btn-sm" href="playlists.html">Playlists</a>
              <a class="btn btn-outline-danger btn-sm" href="#" id="btnLogout">Logout</a>
            `
    : `
              <a class="btn btn-outline-primary btn-sm" href="login.html">Login</a>
              <a class="btn btn-primary btn-sm" href="register.html">Register</a>
            `
  }
      </div>
    </div>
  </nav>
`;

// Logout behavior: clear session and go back to index
const btnLogout = document.getElementById("btnLogout");
if (btnLogout) {
  btnLogout.addEventListener("click", (e) => {
    e.preventDefault();
    sessionStorage.removeItem("currentUser");
    window.location.href = "index.html";
  });
}
