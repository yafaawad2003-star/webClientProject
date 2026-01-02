import { requireAuthOrRedirect, getCurrentUser, logout, upsertUser, ensureDefaultPlaylist, getUserPlaylists } from "./storage.js";
import { searchYouTube } from "./youtube.js";

const username = requireAuthOrRedirect();
ensureDefaultPlaylist(username);

const welcome = document.getElementById("welcome");
welcome.textContent = `Hello ${username} 👋`;

document.getElementById("logoutBtn").addEventListener("click", () => {
  logout();
  window.location.href = "login.html";
});

const alertBox = document.getElementById("alertBox");
const resultsEl = document.getElementById("results");
const form = document.getElementById("searchForm");
const qInput = document.getElementById("q");

// QueryString sync requirement:
// - load page with q=
// - search updates q=
// - leaving and coming back keeps state (querystring does it)
const params = new URLSearchParams(window.location.search);
const initialQ = params.get("q") || "";
qInput.value = initialQ;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = qInput.value.trim();
  if (!q) return;

  // update querystring
  const newParams = new URLSearchParams(window.location.search);
  newParams.set("q", q);
  window.history.replaceState({}, "", `search.html?${newParams.toString()}`);

  await doSearch(q);
});

if (initialQ) {
  doSearch(initialQ);
}

async function doSearch(q) {
  setAlert("", true);
  resultsEl.innerHTML = skeletonCards(8);

  try {
    const items = await searchYouTube(q, 12);
    const playlists = getUserPlaylists(username);
    const allVideoIdsInFav = new Set();
    playlists.forEach(p => (p.items || []).forEach(it => allVideoIdsInFav.add(it.videoId)));

    if (items.length === 0) {
      resultsEl.innerHTML = `<div class="col-12"><div class="alert alert-info">No results.</div></div>`;
      return;
    }

    resultsEl.innerHTML = items.map(v => {
      const inFav = allVideoIdsInFav.has(v.videoId);
      const titleAttr = escapeHtml(v.title); // tooltip full title
      const buttonText = inFav ? "Added ✓" : "Add to favorites";
      const btnClass = inFav ? "btn btn-secondary" : "btn btn-brand";

      return `
      <div class="col-md-6 col-lg-4">
        <div class="card h-100 p-2">
          <div class="position-relative">
            <img src="${v.thumbnail}" class="w-100 rounded-4" style="cursor:pointer;"
                 data-action="play" data-video="${v.videoId}" data-title="${escapeAttr(v.title)}">
            ${inFav ? `<span class="position-absolute top-0 end-0 m-2 badge text-bg-success">✓</span>` : ""}
          </div>

          <div class="p-2">
            <div class="d-flex justify-content-between gap-2 mb-1">
              <span class="badge badge-soft">${v.duration}</span>
              <span class="text-secondary small">${formatViews(v.viewCount)} views</span>
            </div>

            <div class="fw-bold clamp-2" title="${titleAttr}" style="cursor:pointer;"
                 data-action="play" data-video="${v.videoId}" data-title="${escapeAttr(v.title)}">
              ${escapeHtml(v.title)}
            </div>

            <div class="text-secondary small mb-2">${escapeHtml(v.channelTitle)}</div>

            <button class="${btnClass} w-100"
                    ${inFav ? "disabled" : ""}
                    data-action="add"
                    data-video="${v.videoId}"
                    data-title="${escapeAttr(v.title)}"
                    data-thumb="${escapeAttr(v.thumbnail)}"
                    data-duration="${escapeAttr(v.duration)}"
                    data-views="${v.viewCount}">
              ${buttonText}
            </button>
          </div>
        </div>
      </div>`;
    }).join("");

  } catch (err) {
    resultsEl.innerHTML = "";
    setAlert(err.message || "Error searching YouTube");
  }
}

resultsEl.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;

  const action = el.dataset.action;
  const videoId = el.dataset.video;
  const title = el.dataset.title || "";

  if (action === "play") openPlayer(videoId, title);
  if (action === "add") openFavModal(el.dataset);
});

// ---- Player modal ----
function openPlayer(videoId, title) {
  document.getElementById("playerTitle").textContent = title;
  const frame = document.getElementById("playerFrame");
  frame.src = `https://www.youtube.com/embed/${videoId}`;

  const modal = new bootstrap.Modal(document.getElementById("playerModal"));
  modal.show();

  // stop video when closing
  document.getElementById("playerModal").addEventListener("hidden.bs.modal", () => {
    frame.src = "";
  }, { once: true });
}

// ---- Favorites modal ----
let pendingVideo = null;

function openFavModal(data) {
  pendingVideo = {
    videoId: data.video,
    title: data.title,
    thumbnail: data.thumb,
    duration: data.duration,
    viewCount: Number(data.views || 0),
    rating: 0
  };

  document.getElementById("favVideoTitle").textContent = pendingVideo.title;

  // fill dropdown
  const select = document.getElementById("playlistSelect");
  const playlists = getUserPlaylists(username);
  select.innerHTML = playlists.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("");

  document.getElementById("newPlaylistName").value = "";

  const modal = new bootstrap.Modal(document.getElementById("favModal"));
  modal.show();
}

document.getElementById("confirmAddBtn").addEventListener("click", () => {
  if (!pendingVideo) return;

  const newName = document.getElementById("newPlaylistName").value.trim();
  const selectedId = document.getElementById("playlistSelect").value;

  upsertUser(username, (u) => {
    if (!u.playlists) u.playlists = [];

    let targetPlaylist = null;

    if (newName) {
      targetPlaylist = { id: crypto.randomUUID(), name: newName, items: [] };
      u.playlists.push(targetPlaylist);
    } else {
      targetPlaylist = u.playlists.find(p => p.id === selectedId);
    }

    if (!targetPlaylist.items) targetPlaylist.items = [];
    const already = targetPlaylist.items.some(it => it.videoId === pendingVideo.videoId);
    if (!already) targetPlaylist.items.push(pendingVideo);

    return u;
  });

  const toastBody = document.getElementById("toastBody");
  toastBody.innerHTML = `Video saved. <a href="playlists.html?pid=${encodeURIComponent(newName ? "" : selectedId)}">Go to playlists</a>`;
  const toast = new bootstrap.Toast(document.getElementById("liveToast"));
  toast.show();

  // close modal
  bootstrap.Modal.getInstance(document.getElementById("favModal")).hide();

  // refresh current search results to show ✓ and disable button
  const q = new URLSearchParams(window.location.search).get("q") || qInput.value.trim();
  if (q) doSearch(q);
});

// ---- helpers ----
function setAlert(text, hide = false) {
  alertBox.classList.toggle("d-none", hide || !text);
  alertBox.textContent = text || "";
}

function formatViews(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function skeletonCards(count) {
  return Array.from({ length: count }).map(() => `
    <div class="col-md-6 col-lg-4">
      <div class="card p-3">
        <div class="placeholder-glow">
          <div class="placeholder col-12 rounded-4" style="height:160px;"></div>
          <div class="placeholder col-9 mt-3"></div>
          <div class="placeholder col-6 mt-2"></div>
          <div class="placeholder col-12 mt-3"></div>
        </div>
      </div>
    </div>
  `).join("");
}

function escapeHtml(s = "") {
  return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function escapeAttr(s = "") {
  return escapeHtml(s).replaceAll('"', "&quot;");
}
