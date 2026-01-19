import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

// مفتاح Jamendo الصالح
const CLIENT_ID = "977d2cd1";

// صفحة رئيسية
app.get("/", (req,res)=>{
  res.send("Backend Jamendo Works!");
});

// API للبحث في Jamendo
app.get("/search", async (req,res)=>{
  const q = req.query.q;
  if(!q) return res.json({error:"No query provided"});

  try{
    const r = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=json&limit=20&search=${encodeURIComponent(q)}&include=musicinfo+licenses`);
    const data = await r.json();
    
    if(data.headers.status !== "success") return res.json({error:"Jamendo API failed", details:data});

    const results = data.results.map(t=>({
      id: t.id,
      title: t.name,
      artist: t.artist_name,
      image: t.album_image,
      audio: t.audio,
      duration: t.duration
    }));

    res.json(results);

  }catch(e){
    res.status(500).json({error:e.message});
  }
});

// API للتحميل المباشر
app.get("/download", async (req,res)=>{
  const url = req.query.url;
  if(!url) return res.status(400).send("No URL");

  try{
    const r = await fetch(url);
    res.setHeader("Content-Type","audio/mpeg");
    r.body.pipe(res);
  }catch(e){
    res.status(500).send(e.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>console.log(`Server running on port ${PORT}`));
