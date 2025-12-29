// js/youtube.js
async function ytSearch(q) {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "12");
    url.searchParams.set("q", q);
    url.searchParams.set("key", window.YT_API_KEY);

    const res = await fetch(url.toString());
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
    }
    return await res.json();
}
