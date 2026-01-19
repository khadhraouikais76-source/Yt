const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");

const app = express();
app.use(cors()); // لتجاوز CORS

// صفحة رئيسية للتأكد أن السيرفر شغال
app.get("/", (req, res) => res.send("Backend works!"));

// API لتحليل روابط YouTube
app.get("/api", (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ error: "no url provided" });

  exec(`yt-dlp -J "${url}"`, (err, stdout, stderr) => {
    if (err) return res.json({ error: stderr || err.message });

    try {
      const data = JSON.parse(stdout);
      const formats = data.formats
        .filter(f => f.url)
        .map(f => ({
          quality: f.format_note || f.format_id,
          ext: f.ext,
          url: f.url
        }));
      res.json({ title: data.title, thumbnail: data.thumbnail, formats });
    } catch (e) {
      res.json({ error: "parse failed" });
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
