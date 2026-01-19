const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");

const app = express();
app.use(cors()); // لتجاوز CORS

app.get("/api", (req, res) => {
  const url = req.query.url;
  if(!url) return res.json({error:"no url"});

  exec(`yt-dlp -J "${url}"`, (err, stdout, stderr) => {
    if(err) return res.json({error:stderr || err.message});

    try {
      const data = JSON.parse(stdout);
      const formats = data.formats.filter(f=>f.url).map(f=>({
        quality: f.format_note || f.format_id,
        ext: f.ext,
        url: f.url
      }));
      res.json({title: data.title, thumbnail: data.thumbnail, formats});
    } catch(e) {
      res.json({error:"Failed to parse yt-dlp output"});
    }
  });
});

app.listen(process.env.PORT || 3000, ()=>console.log("Server running"));
