const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

// الصفحة الرئيسية
app.get("/", (req,res) => res.send("Backend works!"));

// API لتحليل رابط الفيديو وجلب كل الجودات من عشرات المصادر
app.get("/api", async (req,res) => {
    const url = req.query.url;
    if(!url) return res.json({error:"no url provided"});

    const sources = [];

    // قائمة المصادر التي سنجربها
    const sourceList = [
        {name:"ssyoutube", api:"https://api.ssyoutube.com/get?url="},
        {name:"y2mate", api:"https://api.y2mate.com/get?url="},
        {name:"savefrom", api:"https://api.savefrom.net/api?url="},
        {name:"fdownloader", api:"https://api.fdownloader.com/get?url="},
        {name:"getfvid", api:"https://api.getfvid.com/download?url="},
        {name:"loader", api:"https://api.loader.to/api?url="},
        {name:"youtubemp4", api:"https://api.youtubemp4.to/get?url="},
        {name:"fetchvideo", api:"https://api.fetchvideo.com/get?url="},
        {name:"vidfast", api:"https://api.vidfast.com/get?url="},
        {name:"fastsave", api:"https://api.fastsave.com/get?url="},
        {name:"keepvid", api:"https://api.keepvid.com/get?url="},
        {name:"videodownloader", api:"https://api.videodownloader.com/get?url="},
        {name:"catchvideo", api:"https://api.catchvideo.com/get?url="},
        {name:"downvid", api:"https://api.downvid.com/get?url="},
        {name:"videograbber", api:"https://api.videograbber.net/get?url="},
        {name:"video2mp3", api:"https://api.video2mp3.net/get?url="},
        {name:"youtubevideo", api:"https://api.youtubevideo.com/get?url="},
        {name:"vidloader", api:"https://api.vidloader.net/get?url="},
        {name:"youtubedl", api:"https://api.youtubedl.net/get?url="},
        {name:"allvid", api:"https://api.allvid.com/get?url="}
    ];

    for(let src of sourceList){
        try{
            let r = await axios.get(src.api + encodeURIComponent(url));
            if(r.data && r.data.formats && r.data.formats.length>0){
                sources.push({name:src.name, formats:r.data.formats});
            }
        }catch(e){ 
            console.log(`Source failed: ${src.name}`); 
        }
    }

    if(sources.length===0) return res.json({error:"no sources available"});

    res.json({
        title:"Video Title Placeholder",
        thumbnail:"Thumbnail URL Placeholder",
        sources
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
