import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import globalError from './middlewares/globalError.middleware.js';

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

app.use(express.static("public"));
app.use(cookieParser());
app.use(globalError);

// routes
import userRouter from "./routes/user.route.js";
import videoRouter from "./routes/video.route.js";
import commentRouter from "./routes/comment.route.js";
import likeRouter from "./routes/like.route.js";
import playlistRouter from "./routes/playlist.route.js";
import dashboardRouter from "./routes/dashboard.route.js";
import subscribeptionRouter from "./routes/subscription.route.js";
import healthrouter from "./routes/healthcheck.route.js";
import tweetRouter from "./routes/tweet.route.js";



app.use("/users", userRouter); // localhost:3000/users
app.use("/videos", videoRouter); // localhost:3000/videos
app.use("/comments", commentRouter); 
app.use("/likes", likeRouter);
app.use("/playlists", playlistRouter);
app.use("/dashboard", dashboardRouter);
app.use("/subscriptions", subscribeptionRouter);
app.use("/tweets", tweetRouter);
app.use("/health", healthrouter);


app.use((req, res) => res.status(404).json({ message: "Route not found" }));
export { app };
