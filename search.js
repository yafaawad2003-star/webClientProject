requireLogin();
renderHeader("search");

const user = getUserByUsername(getCurrentUsername());
document.getElementById("welcome").textContent = `Welcome Message: שלום ${user.username}`;

const resultsEl = document.getElementById("results");
const errEl = document.getElementById("err");
const qInput = document.getElementById("q");

const playerModal = new bootstrap.Modal("#playerModal");
const favModal = new bootstrap.Modal("#favModal");
const toast = new bootstrap.Toast("#saveToast");

let pendingVideo = null;

function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

function setQueryParamAndPush(q) {
    const url = new URL(window.location.href);
    url.searchParams.set("q", q);
    history.pushState({}, "", url);
}

function videoExistsInAnyPlaylist(videoId) {
    return (user.playlists || []).some(p => (p.items || []).some(it => it.videoId === videoId));
}

function renderCards(items) {
    resultsEl.innerHTML = "";

    items.forEach(item => {
        const videoId = item.id.videoId;
        const title = item.snippet.title;
        const thumb = item.snippet.thumbnails.medium.url;
        const channelTitle = item.snippet.channelTitle;

        const already = videoExistsInAnyPlaylist(videoId);

        const col = document.createElement("div");
        col.className = "col-md-4";

        col.innerHTML = `
      <div class="card h-100">
        <img src="${thumb}" class="card-img-top pointer" data-action="play" data-id="${videoId}" data-title="${encodeURIComponent(title)}">
        <div class="card-body">
          <h6 class="card-title truncate-2" title="${title}">
            <span class="pointer" data-action="play" data-id="${videoId}" data-title="${encodeURIComponent(title)}">${title}</span>
          </h6>
          <p class="small text-muted mb-2">${channelTitle}</p>

          <button class="btn btn-sm ${already ? "btn-success" : "btn-outline-primary"}"
                  data-action="fav"
                  data-id="${videoId}"
                  data-title="${encodeURIComponent(title)}"
                  data-thumb="${encodeURIComponent(thumb)}"
                  data-channel="${encodeURIComponent(channelTitle)}">
            ${already ? "✔ נוסף" : "הוספה למועדפים"}
          </button>
        </div>
      </div>
    `;
        resultsEl.appendChild(col);
    });
}

async function doSearch(q) {
    errEl.textContent = "";
    if (!q) return;

    try {
        const data = await ytSearch(q);
        renderCards(data.items || []);
    } catch (e) {
        errEl.textContent = "שגיאה בחיפוש. בדקי מפתח API או רשת.";
    }
}

function fillPlaylistDropdown() {
    const sel = document.getElementById("playlistSelect");
    sel.innerHTML = "";
    (user.playlists || []).forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.name;
        sel.appendChild(opt);
    });
}

document.getElementById("btnSearch").addEventListener("click", () => {
    const q = qInput.value.trim();
    setQueryParamAndPush(q);        // ✔️ querystring
    doSearch(q);
});

// Back/Forward
window.addEventListener("popstate", () => {
    const q = getQueryParam("q") || "";
    qInput.value = q;
    doSearch(q);
});

// קליקים על תוצאות
resultsEl.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;

    const action = el.getAttribute("data-action");
    if (action === "play") {
        const id = el.getAttribute("data-id");
        const title = decodeURIComponent(el.getAttribute("data-title"));

        document.getElementById("playerTitle").textContent = title;
        document.getElementById("playerFrame").src = `https://www.youtube.com/embed/${id}`;
        playerModal.show();
    }

    if (action === "fav") {
        pendingVideo = {
            videoId: el.getAttribute("data-id"),
            title: decodeURIComponent(el.getAttribute("data-title")),
            thumb: decodeURIComponent(el.getAttribute("data-thumb")),
            channelTitle: decodeURIComponent(el.getAttribute("data-channel")),
            addedAt: Date.now()
        };
        document.getElementById("favErr").textContent = "";
        document.getElementById("newPlaylistName").value = "";
        fillPlaylistDropdown();
        favModal.show();
    }
});

document.getElementById("btnAddFav").addEventListener("click", () => {
    const favErr = document.getElementById("favErr");
    favErr.textContent = "";
    if (!pendingVideo) return;

    const newName = document.getElementById("newPlaylistName").value.trim();
    const selectedId = document.getElementById("playlistSelect").value;

    // create playlist if typed
    if (newName) {
        const newPl = {
            id: "pl_" + Date.now(),
            name: newName,
            createdAt: Date.now(),
            items: []
        };
        user.playlists = user.playlists || [];
        user.playlists.push(newPl);
    }

    // re-pick playlist after maybe creating
    const finalId = newName ? user.playlists[user.playlists.length - 1].id : selectedId;
    const pl = (user.playlists || []).find(p => p.id === finalId);

    if (!pl) {
        favErr.textContent = "בחרי פלייליסט או צרי חדש.";
        return;
    }

    // אם כבר קיים בפלייליסט הזה – לא להוסיף כפול
    if ((pl.items || []).some(it => it.videoId === pendingVideo.videoId)) {
        favErr.textContent = "הסרטון כבר נמצא בפלייליסט.";
        return;
    }

    pl.items = pl.items || [];
    pl.items.push(pendingVideo);

    updateUser(user); // ✔️ שמירה ל-LocalStorage

    // Toast + לינק לפלייליסט (QueryString)
    const link = document.getElementById("goToPlaylistLink");
    link.href = `playlists.html?playlistId=${encodeURIComponent(pl.id)}`;
    toast.show();

    favModal.hide();
    // רענון UI כדי להראות ✔ נוסף
    doSearch(qInput.value.trim());
});

// טעינה ראשונית לפי querystring
const initialQ = getQueryParam("q") || "";
qInput.value = initialQ;
if (initialQ) doSearch(initialQ);
