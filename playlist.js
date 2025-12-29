requireLogin();
renderHeader("playlists");

const user = getUserByUsername(getCurrentUsername());
user.playlists = user.playlists || [];

const listEl = document.getElementById("playlistList");
const songsArea = document.getElementById("songsArea");
const mainTitle = document.getElementById("mainTitle");
const btnDeletePlaylist = document.getElementById("btnDeletePlaylist");

const filterText = document.getElementById("filterText");
const sortBy = document.getElementById("sortBy");

const plModal = new bootstrap.Modal("#plModal");
const playerModal = new bootstrap.Modal("#playerModal");

let selectedPlaylistId = null;

function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

function setPlaylistQuery(id) {
    const url = new URL(window.location.href);
    url.searchParams.set("playlistId", id);
    history.pushState({}, "", url);
}

function renderSidebar() {
    listEl.innerHTML = "";
    user.playlists.forEach(p => {
        const a = document.createElement("a");
        a.href = "#";
        a.className = "list-group-item list-group-item-action" + (p.id === selectedPlaylistId ? " active" : "");
        a.textContent = p.name;
        a.addEventListener("click", (e) => {
            e.preventDefault();
            selectPlaylist(p.id, true);
        });
        listEl.appendChild(a);
    });
}

function getSelectedPlaylist() {
    return user.playlists.find(p => p.id === selectedPlaylistId);
}

function renderMain() {
    const pl = getSelectedPlaylist();
    songsArea.innerHTML = "";

    if (!pl) {
        mainTitle.textContent = "בחר פלייליסט מהרשימה";
        btnDeletePlaylist.classList.add("d-none");
        return;
    }

    btnDeletePlaylist.classList.remove("d-none");
    mainTitle.textContent = pl.name;

    let items = [...(pl.items || [])];

    // חיפוש פנימי
    const ft = filterText.value.trim().toLowerCase();
    if (ft) items = items.filter(it => it.title.toLowerCase().includes(ft));

    // מיון
    if (sortBy.value === "az") {
        items.sort((a, b) => a.title.localeCompare(b.title));
    } else {
        items.sort((a, b) => b.addedAt - a.addedAt);
    }

    if (items.length === 0) {
        songsArea.innerHTML = `<div class="text-muted">אין שירים להצגה.</div>`;
        return;
    }

    items.forEach(it => {
        const row = document.createElement("div");
        row.className = "d-flex align-items-center gap-3 border rounded-3 p-2 mb-2";

        row.innerHTML = `
      <img src="${it.thumb}" style="width:96px;height:54px;object-fit:cover;border-radius:8px" class="pointer" data-play="${it.videoId}" data-title="${encodeURIComponent(it.title)}">
      <div class="flex-grow-1">
        <div class="fw-semibold pointer" data-play="${it.videoId}" data-title="${encodeURIComponent(it.title)}" title="${it.title}">
          ${it.title}
        </div>
        <div class="small text-muted">${it.channelTitle || ""}</div>
      </div>
      <button class="btn btn-sm btn-outline-danger" data-del="${it.videoId}">מחק</button>
    `;
        songsArea.appendChild(row);
    });
}

function selectPlaylist(id, pushToQuery) {
    selectedPlaylistId = id;
    if (pushToQuery) setPlaylistQuery(id);
    renderSidebar();
    renderMain();
}

document.getElementById("btnNewPlaylist").addEventListener("click", () => {
    document.getElementById("plErr").textContent = "";
    document.getElementById("plName").value = "";
    plModal.show();
});

document.getElementById("btnCreatePl").addEventListener("click", () => {
    const name = document.getElementById("plName").value.trim();
    const err = document.getElementById("plErr");
    err.textContent = "";

    if (!name) {
        err.textContent = "חובה להזין שם פלייליסט.";
        return;
    }

    const newPl = { id: "pl_" + Date.now(), name, createdAt: Date.now(), items: [] };
    user.playlists.push(newPl);
    updateUser(user);

    plModal.hide();
    selectPlaylist(newPl.id, true);
});

songsArea.addEventListener("click", (e) => {
    // play
    const playEl = e.target.closest("[data-play]");
    if (playEl) {
        const id = playEl.getAttribute("data-play");
        const title = decodeURIComponent(playEl.getAttribute("data-title"));
        document.getElementById("playerTitle").textContent = title;
        document.getElementById("playerFrame").src = `https://www.youtube.com/embed/${id}`;
        playerModal.show();
        return;
    }

    // delete song
    const delEl = e.target.closest("[data-del]");
    if (delEl) {
        const vid = delEl.getAttribute("data-del");
        const pl = getSelectedPlaylist();
        pl.items = (pl.items || []).filter(it => it.videoId !== vid);
        updateUser(user);
        renderMain();
    }
});

btnDeletePlaylist.addEventListener("click", () => {
    if (!selectedPlaylistId) return;
    user.playlists = user.playlists.filter(p => p.id !== selectedPlaylistId);
    updateUser(user);

    // לבחור פלייליסט ראשון אם קיים
    selectedPlaylistId = user.playlists[0]?.id || null;
    if (selectedPlaylistId) setPlaylistQuery(selectedPlaylistId);

    renderSidebar();
    renderMain();
});

filterText.addEventListener("input", renderMain);
sortBy.addEventListener("change", renderMain);

// טעינה ראשונית לפי QueryString
const qPl = getQueryParam("playlistId");
selectedPlaylistId = qPl || (user.playlists[0]?.id || null);

renderSidebar();
renderMain();

if (selectedPlaylistId) setPlaylistQuery(selectedPlaylistId);

// back/forward
window.addEventListener("popstate", () => {
    const id = getQueryParam("playlistId");
    selectedPlaylistId = id;
    renderSidebar();
    renderMain();
});
