import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

app.get("/", (req,res)=>{
  res.send("Music & Video Backend Works! استخدم /search?q=الكلمة للبحث");
});

/* ===== البحث في Jamendo + PeerTube + Archive ===== */
app.get("/search", async (req,res)=>{
  const q = req.query.q;
  if(!q) return res.json([]);

  const results = [];

  /* -------- Jamendo API -------- */
  try{
    // استخدم client_id عام من Jamendo
    const JAMENDO_CLIENT = "YOUR_JAMENDO_CLIENT_ID"; // سجل على Jamendo وخذ client_id مجاني
    const r = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT}&format=json&limit=10&name=${encodeURIComponent(q)}`);
    const j = await r.json();
    if(j.results){
      j.results.forEach(t=>{
        results.push({
          source:"jamendo",
          id:t.id,
          title:t.name+" - "+t.artist_name,
          thumbnail:t.album_image,
          audio:t.audio,
          duration:t.duration
        });
      });
    }
  }catch(e){ console.log("Jamendo failed:", e.message); }

  /* -------- PeerTube (أمثلة على instances عامة) -------- */
  const instances = [
    "https://peertube.social",
    "https://tube.pawoo.net",
    "https://video.blender.org"
  ];
  for(let inst of instances){
    try{
      const r = await fetch(`${inst}/api/v1/search/videos?search=${encodeURIComponent(q)}`);
      const j = await r.json();
      if(j.data){
        j.data.forEach(v=>{
          results.push({
            source:"peertube",
            instance:inst,
            id:v.uuid,
            title:v.name,
            video:v.files[0]?.fileUrl,
            thumbnail:v.thumbnailUrl
          });
        });
      }
    }catch(e){ console.log(`PeerTube ${inst} failed`, e.message); }
  }

  /* -------- Internet Archive (صوت وفيديو مجاني) -------- */
  try{
    const r = await fetch(`https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)} AND mediatype:(audio OR movies)&fl[]=identifier&fl[]=title&fl[]=mediatype&rows=10&output=json`);
    const j = await r.json();
    if(j.response && j.response.docs){
      j.response.docs.forEach(v=>{
        results.push({
          source:"archive",
          id:v.identifier,
          title:v.title,
          mediatype:v.mediatype,
          thumbnail:"https://archive.org/services/img/"+v.identifier,
          video:"https://archive.org/download/"+v.identifier+"/"+v.identifier+".mp4"
        });
      });
    }
  }catch(e){ console.log("Archive failed:", e.message); }

  res.json(results);
});

/* ===== جودات وتشغيل ===== */
app.get("/formats", async (req,res)=>{
  const {source,id,instance} = req.query;
  try{
    if(source==="jamendo"){
      // Jamendo يعطي MP3 واحد
      return res.json([{quality:"MP3", url:`https://api.jamendo.com/v3.0/tracks/file/?id=${id}` }]);
    }
    if(source==="peertube"){
      const r = await fetch(`${instance}/api/v1/videos/${id}`);
      const j = await r.json();
      if(j.files){
        return res.json(j.files.map(f=>({quality:f.resolution?.label||"default", url:f.fileUrl})));
      }
    }
    if(source==="archive"){
      return res.json([{quality:"default", url:`https://archive.org/download/${id}/${id}.mp4`}]);
    }
  }catch(e){ console.log("formats error",e.message); }

  res.json([]);
});

/* ===== تحميل مباشر ===== */
app.get("/download", async (req,res)=>{
  const url = req.query.url;
  if(!url) return res.sendStatus(400);

  try{
    const r = await fetch(url);
    res.setHeader("Content-Length", r.headers.get("content-length"));
    res.setHeader("Content-Type", r.headers.get("content-type"));
    r.body.pipe(res);
  }catch(e){
    res.status(500).json({error:e.message});
  }
});

const PORT = process.env.PORT||3000;
app.listen(PORT,()=>console.log(`Server running on port ${PORT}`));
