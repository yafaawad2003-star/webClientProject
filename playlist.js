import { requireAuthOrRedirect, logout, getUserPlaylists, upsertUser, ensureDefaultPlaylist } from "./storage.js";

const username = requireAuthOrRedirect();
ensureDefaultPlaylist(username);

document.getElementById("logoutBtn").addEventListener("click", () => {
    logout();
    window.location.href = "login.html";
});

const plistEl = document.getElementById("plist");
const songsEl = document.getElementById("songs");
const currentNameEl = document.getElementById("currentName");
const filterInput = document.getElementById("filterInput");
const sortSelect = document.getElementById("sortSelect");
const deletePlaylistBtn = document.getElementById("deletePlaylistBtn");

let currentPlaylistId = null;

// QueryString support for playlist id:
const params = new URLSearchParams(window.location.search);
currentPlaylistId = params.get("pid"); // may be null

renderSidebar();
selectInitialPlaylist();

filterInput.addEventListener("input", renderSongs);
sortSelect.addEventListener("change", renderSongs);

deletePlaylistBtn.addEventListener("click", () => {
    if (!currentPlaylistId) return;

    const ok = confirm("Delete this playlist?");
    if (!ok) return;

    upsertUser(username, (u) => {
        u.playlists = (u.playlists || []).filter(p => p.id !== currentPlaylistId);
        if (u.playlists.length === 0) {
            u.playlists.push({ id: crypto.randomUUID(), name: "My Favorites", items: [] });
        }
        return u;
    });

    renderSidebar();
    currentPlaylistId = null;
    selectInitialPlaylist();
});

plistEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-pid]");
    if (!btn) return;

    currentPlaylistId = btn.dataset.pid;

    // update querystring
    const p = new URLSearchParams(window.location.search);
    p.set("pid", currentPlaylistId);
    window.history.replaceState({}, "", `playlists.html?${p.toString()}`);

    renderSidebar();
    renderSongs();
});

document.getElementById("newPlaylistBtn").addEventListener("click", () => {
    document.getElementById("pname").value = "";
    new bootstrap.Modal(document.getElementById("newPModal")).show();
});

document.getElementById("createPBtn").addEventListener("click", () => {
    const name = document.getElementById("pname").value.trim();
    if (!name) return;

    const newId = crypto.randomUUID();
    upsertUser(username, (u) => {
        if (!u.playlists) u.playlists = [];
        u.playlists.push({ id: newId, name, items: [] });
        return u;
    });

    bootstrap.Modal.getInstance(document.getElementById("newPModal")).hide();

    currentPlaylistId = newId;
    const p = new URLSearchParams(window.location.search);
    p.set("pid", currentPlaylistId);
    window.history.replaceState({}, "", `playlists.html?${p.toString()}`);

    renderSidebar();
    renderSongs();
});

function selectInitialPlaylist() {
    const pls = getUserPlaylists(username);
    if (!pls.length) return;

    if (!currentPlaylistId || !pls.some(p => p.id === currentPlaylistId)) {
        currentPlaylistId = pls[0].id; // default: first playlist
        const p = new URLSearchParams(window.location.search);
        p.set("pid", currentPlaylistId);
        window.history.replaceState({}, "", `playlists.html?${p.toString()}`);
    }
    renderSidebar();
    renderSongs();
}

function renderSidebar() {
    const pls = getUserPlaylists(username);

    plistEl.innerHTML = pls.map(p => {
        const active = p.id === currentPlaylistId ? "active" : "";
        return `
      <button class="list-group-item list-group-item-action playlist-item ${active}"
              data-pid="${p.id}">
        <div class="d-flex justify-content-between align-items-center">
          <span>${escapeHtml(p.name)}</span>
          <span class="badge text-bg-light">${(p.items || []).length}</span>
        </div>
      </button>
    `;
    }).join("");
}

function renderSongs() {
    const pls = getUserPlaylists(username);
    const p = pls.find(x => x.id === currentPlaylistId);
    if (!p) {
        songsEl.innerHTML = `<div class="alert alert-info">No playlist selected.</div>`;
        currentNameEl.textContent = "";
        return;
    }

    currentNameEl.textContent = p.name;

    const term = filterInput.value.trim().toLowerCase();
    let items = [...(p.items || [])];

    // filter by title
    if (term) items = items.filter(it => (it.title || "").toLowerCase().includes(term));

    // sort
    if (sortSelect.value === "az") {
        items.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else {
        items.sort((a, b) => (Number(b.rating || 0) - Number(a.rating || 0)));
    }

    if (!items.length) {
        songsEl.innerHTML = `<div class="alert alert-secondary mb-0">No videos in this playlist.</div>`;
        return;
    }

    songsEl.innerHTML = items.map(it => `
    <div class="card p-2 mb-2">
      <div class="d-flex gap-2 align-items-center">
        <img src="${it.thumbnail}" class="rounded-4" style="width:100px;height:60px;object-fit:cover;">
        <div class="flex-grow-1">
          <div class="fw-bold clamp-2" title="${escapeHtml(it.title)}">${escapeHtml(it.title)}</div>
          <div class="text-secondary small">Duration: ${escapeHtml(it.duration || "")} • Views: ${formatViews(it.viewCount || 0)}</div>

          <div class="mt-2 d-flex align-items-center gap-2">
            <label class="text-secondary small mb-0">Rating:</label>
            ${ratingStars(it.rating || 0, it.videoId)}
          </div>
        </div>

        <div class="d-flex flex-column gap-2">
          <a class="btn btn-outline-secondary btn-sm" target="_blank"
             href="https://www.youtube.com/watch?v=${encodeURIComponent(it.videoId)}">Open</a>

          <button class="btn btn-outline-danger btn-sm" data-del="${it.videoId}">Remove</button>
        </div>
      </div>
    </div>
  `).join("");
}

songsEl.addEventListener("click", (e) => {
    // remove item
    const del = e.target.closest("[data-del]");
    if (del) {
        const vid = del.dataset.del;
        upsertUser(username, (u) => {
            const p = (u.playlists || []).find(x => x.id === currentPlaylistId);
            if (!p) return u;
            p.items = (p.items || []).filter(it => it.videoId !== vid);
            return u;
        });
        renderSidebar();
        renderSongs();
        return;
    }

    // set rating
    const star = e.target.closest("[data-rate]");
    if (star) {
        const vid = star.dataset.vid;
        const rate = Number(star.dataset.rate);
        upsertUser(username, (u) => {
            const p = (u.playlists || []).find(x => x.id === currentPlaylistId);
            if (!p) return u;
            const it = (p.items || []).find(x => x.videoId === vid);
            if (it) it.rating = rate;
            return u;
        });
        renderSongs();
    }
});

function ratingStars(current, videoId) {
    const stars = [1, 2, 3, 4, 5].map(n => {
        const filled = n <= current;
        return `<button class="btn btn-sm ${filled ? "btn-brand" : "btn-outline-secondary"}"
                    data-rate="1" data-vid="${videoId}" data-rate="${n}">${n}</button>`;
    }).join("");
    return `<div class="d-flex gap-1">${stars}</div>`;
}

function formatViews(n) {
    n = Number(n || 0);
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return String(n);
}

function escapeHtml(s = "") {
    return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
