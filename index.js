import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

/* ===== SEARCH ACROSS MULTIPLE MUSIC SOURCES ===== */
app.get("/search", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.json([]);

  const results = [];

  // 1️⃣ Internet Archive
  try {
    const r = await fetch(`https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)} AND mediatype:(audio OR movies)&fl[]=identifier&fl[]=title&rows=20&output=json`);
    const j = await r.json();
    j.response.docs.forEach(v => results.push({
      source: "archive",
      id: v.identifier,
      title: v.title
    }));
  } catch (e) {}

  // 2️⃣ Jamendo (requires client_id, free registration)
  try {
    const JAMENDO_CLIENT = "YOUR_JAMENDO_CLIENT_ID";
    const r = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT}&format=json&limit=20&search=${encodeURIComponent(q)}`);
    const j = await r.json();
    j.results.forEach(v => results.push({
      source: "jamendo",
      id: v.id,
      title: v.name,
      artist: v.artist_name,
      audio: v.audio,       // mp3 URL
      thumbnail: v.album_image
    }));
  } catch (e) {}

  // 3️⃣ Free Music Archive
  try {
    const r = await fetch(`https://freemusicarchive.org/api/get/tracks.json?api_key=YOUR_FMA_KEY&limit=20&track_title=${encodeURIComponent(q)}`);
    const j = await r.json();
    j.dataset.forEach(v => results.push({
      source: "fma",
      id: v.track_id,
      title: v.track_title,
      artist: v.artist_name,
      audio: v.track_file_url
    }));
  } catch (e) {}

  // 4️⃣ PeerTube (مثال 3 instances)
  const instances = ["https://peertube.social", "https://video.blender.org"];
  for (let inst of instances) {
    try {
      const r = await fetch(`${inst}/api/v1/search/videos?search=${encodeURIComponent(q)}`);
      const j = await r.json();
      j.data.forEach(v => results.push({
        source: "peertube",
        instance: inst,
        id: v.uuid,
        title: v.name,
        video: v.files[0]?.fileUrl
      }));
    } catch (e) {}
  }

  res.json(results);
});

/* ===== FETCH FORMATS / QUALITIES ===== */
app.get("/formats", async (req, res) => {
  const { source, id, instance } = req.query;

  if (source === "archive") {
    const r = await fetch(`https://archive.org/metadata/${id}`);
    const j = await r.json();
    const files = j.files.filter(f => f.format?.includes("MPEG") || f.format?.includes("MP3"));
    return res.json(files.map(f => ({
      quality: f.format,
      url: `https://archive.org/download/${id}/${f.name}`
    })));
  }

  if (source === "peertube") {
    const r = await fetch(`${instance}/api/v1/videos/${id}`);
    const j = await r.json();
    return res.json(
      j.files.map(f => ({
        quality: f.resolution?.label || "default",
        url: f.fileUrl
      }))
    );
  }

  if (source === "jamendo" || source === "fma") {
    return res.json([{ quality: "default", url: req.query.audio }]);
  }

  res.json([]);
});

/* ===== DOWNLOAD PROXY (OPTIONAL) ===== */
app.get("/download", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.sendStatus(400);

  const r = await fetch(url);
  res.setHeader("Content-Length", r.headers.get("content-length"));
  res.setHeader("Content-Type", r.headers.get("content-type"));
  r.body.pipe(res);
});

app.listen(3000, () => console.log("Music backend running on 3000"));
