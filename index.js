import yt from "./util/ytdl.js";
import express from "express";
import fb from "./util/firebase.js";
import util from "./util/util.js";
const app = express();
const port = process.env.port || 3000;

// app.get("/test/:videoId", async (req, res) => {
//   const videoId = req.params.videoId;
//   const data = await fb.audioExist(videoId);
//   console.log(data);
//   res.send(data);
// });

app.get("/stream/:videoId", async (req, res) => {
  req.setTimeout(60 * 1000);
  const videoId = req.params.videoId;

  // Audio already exist in storage?
  if (await fb.audioExist(videoId)) {
    const url = await fb.getAudioDirectUrl(videoId);
    res.redirect(url);
  }
  // If Audio not exist in storage
  else {
    const { stream, contentLength } = await yt.getAudioStream(videoId);
    util.assignAudioToFirebase({ stream, videoId });
    // Set response header
    res.set({
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "audio/mp4",
    });
    // Pipe audio stream
    const data = stream.pipe(res);
    data.on("close", () => {
      console.log("destroyed");
    });

    data.on("error", (error) => {
      console.log(error);
    });
    data.on("finish", () => {
      console.log("finished");
    });
  }
});

app.get("*", (req, res) => {
  res.send("Hello World!! ^_^v");
});

app.listen(port, () => {
  console.log("App Listening On Port " + port);
});
