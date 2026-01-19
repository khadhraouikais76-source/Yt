const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

// YouTube Search API
const YT_API_KEY = "AIzaSyDyaEyThUnZM8NKkTxZGbbzSNtonxiPLeQ";

app.get("/search", async (req,res)=>{
  const q = req.query.q;
  if(!q) return res.json({error:"no query"});
  try{
    const r = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
      params: { part:"snippet", maxResults:10, q, type:"video", key:YT_API_KEY }
    });
    const results = r.data.items.map(item=>({
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url
    }));
    res.json(results);
  } catch(e){ res.json({error:e.message}); }
});

// مصادر موثوقة للتحميل – كل مرة يولد روابط جديدة
const sources = [
  {name:"ssyoutube", api:"https://api.ssyoutube.com/get?url="},
  {name:"y2mate", api:"https://api.y2mate.com/get?url="},
  {name:"fdownloader", api:"https://api.fdownloader.com/get?url="}
];

app.get("/download", async (req,res)=>{
  const videoId = req.query.videoId;
  if(!videoId) return res.json({error:"no videoId"});
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const results = [];
  for(let src of sources){
    try{
      const r = await axios.get(src.api + encodeURIComponent(videoUrl));
      if(r.data && r.data.formats && r.data.formats.length>0){
        results.push({source: src.name, formats: r.data.formats});
      }
    }catch(e){ console.log(`${src.name} failed`); }
  }

  if(results.length===0) return res.json({error:"No sources available"});
  res.json(results); // كل روابط صالحة جديدة وقت الضغط
});

const PORT = process.env.PORT||3000;
app.listen(PORT,()=>console.log(`Server running on port ${PORT}`));
