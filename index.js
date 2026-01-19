const express = require("express");
const cors = require("cors");
const axios = require("axios");
const ytdl = require("ytdl-core");

const app = express();
app.use(cors());

// خذ المفتاح كما وضعته في كودك الأول
const YT_API_KEY = "AIzaSyDyaEyThUnZM8NKkTxZGbbzSNtonxiPLeQ";

// صفحة رئيسية
app.get("/", (req,res)=>res.send("Backend works!"));

// API للبحث في YouTube (كما في كودك الأصلي)
app.get("/search", async (req,res)=>{
    const q = req.query.q;
    if(!q) return res.json({error:"no query"});

    try{
        const r = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
            params: {
                part: "snippet",
                maxResults: 10,
                q: q,
                type: "video",
                key: YT_API_KEY
            }
        });
        res.json(r.data.items.map(item => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium.url
        })));
    }catch(e){
        res.json({error:e.message});
    }
});

// API لجلب روابط التحميل باستخدام ytdl-core
app.get("/video", async (req,res)=>{
    const videoId = req.query.videoId;
    if(!videoId) return res.json({error:"no videoId provided"});

    const url = `https://www.youtube.com/watch?v=${videoId}`;
    try{
        const info = await ytdl.getInfo(url);
        const formats = ytdl.filterFormats(info.formats, 'audioandvideo').map(f => ({
            itag: f.itag,
            quality: f.qualityLabel || f.audioBitrate+"kbps",
            container: f.container,
            size: f.contentLength ? (f.contentLength/1024/1024).toFixed(2)+" MB" : "N/A",
            url: f.url
        }));
        res.json({
            title: info.videoDetails.title,
            thumbnail: info.videoDetails.thumbnails[0].url,
            formats
        });
    }catch(e){
        res.json({error:e.message});
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
