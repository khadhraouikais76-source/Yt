import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

/* ===== SEARCH MULTIPLE OPEN SOURCES ===== */
app.get("/search", async (req,res)=>{
  const q = req.query.q;
  if(!q) return res.json([]);

  const results = [];

  /* -------- Internet Archive -------- */
  try{
    const r = await fetch(`https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)} AND mediatype:(audio OR movies)&fl[]=identifier&fl[]=title&fl[]=mediatype&rows=20&output=json`);
    const j = await r.json();
    if(j.response && j.response.docs){
      j.response.docs.forEach(v=>{
        results.push({
          source:"archive",
          id:v.identifier,
          title:v.title,
          mediatype:v.mediatype
        });
      });
    }
  }catch(e){ console.log("Archive failed",e.message); }

  /* -------- Wikimedia Commons Videos -------- */
  try{
    const r = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*`);
    const j = await r.json();
    if(j.query && j.query.search){
      j.query.search.forEach(v=>{
        results.push({
          source:"wikimedia",
          id:v.title,
          title:v.title
        });
      });
    }
  }catch(e){ console.log("Wikimedia failed",e.message); }

  /* -------- PeerTube Instances (Open) -------- */
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
            video:v.files[0]?.fileUrl
          });
        });
      }
    }catch(e){ console.log(`PeerTube ${inst} failed`,e.message); }
  }

  res.json(results);
});

/* ===== FORMATS / QUALITIES ===== */
app.get("/formats", async (req,res)=>{
  const {source,id,instance} = req.query;
  try{
    if(source==="archive"){
      const r = await fetch(`https://archive.org/metadata/${id}`);
      const j = await r.json();
      if(j.files){
        const files = j.files.filter(f=> f.format?.includes("MPEG") || f.format?.includes("MP3"));
        return res.json(files.map(f=>({quality:f.format,url:`https://archive.org/download/${id}/${f.name}`})));
      }
    }

    if(source==="wikimedia"){
      // الفيديو غالبًا يكون MP4 مباشر
      return res.json([{quality:"default", url:`https://commons.wikimedia.org/wiki/Special:FilePath/${id}.webm`}]);
    }

    if(source==="peertube"){
      const r = await fetch(`${instance}/api/v1/videos/${id}`);
      const j = await r.json();
      if(j.files){
        return res.json(j.files.map(f=>({quality:f.resolution?.label||"default",url:f.fileUrl})));
      }
    }
  }catch(e){ console.log("formats error",e.message); }

  res.json([]);
});

/* ===== DOWNLOAD PROXY ===== */
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
