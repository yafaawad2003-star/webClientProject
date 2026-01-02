// youtube.js
const API_BASE = "https://www.googleapis.com/youtube/v3";

const YT_API_KEY = "AIzaSyCM__RdOfouWpcDKUhFKOvEp1paXbeP7LE";

export async function searchYouTube(query, maxResults = 12) {
    if (!YT_API_KEY) throw new Error("Missing YouTube API key");

    // 1) search.list
    const searchUrl = new URL(API_BASE + "/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("q", query);
    searchUrl.searchParams.set("maxResults", String(maxResults));
    searchUrl.searchParams.set("key", YT_API_KEY);

    const sRes = await fetch(searchUrl);
    const sJson = await sRes.json();
    if (!sRes.ok) throw new Error(sJson?.error?.message || "YouTube search failed");

    const ids = (sJson.items || []).map(it => it.id?.videoId).filter(Boolean);
    if (ids.length === 0) return [];

    // 2) videos.list
    const vUrl = new URL(API_BASE + "/videos");
    vUrl.searchParams.set("part", "snippet,contentDetails,statistics");
    vUrl.searchParams.set("id", ids.join(","));
    vUrl.searchParams.set("key", YT_API_KEY);

    const vRes = await fetch(vUrl);
    const vJson = await vRes.json();
    if (!vRes.ok) throw new Error(vJson?.error?.message || "YouTube videos details failed");

    return (vJson.items || []).map(v => ({
        videoId: v.id,
        title: v.snippet?.title || "",
        thumbnail: v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || "",
        channelTitle: v.snippet?.channelTitle || "",
        duration: isoDurationToText(v.contentDetails?.duration || "PT0S"),
        viewCount: Number(v.statistics?.viewCount || 0),
    }));
}

export function isoDurationToText(iso) {
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!m) return "0:00";
    const h = parseInt(m[1] || "0", 10);
    const min = parseInt(m[2] || "0", 10);
    const s = parseInt(m[3] || "0", 10);
    const mm = h > 0 ? String(min).padStart(2, "0") : String(min);
    const ss = String(s).padStart(2, "0");
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
