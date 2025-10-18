import { Router } from 'express';
import {
    getLikedVideos,
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
} from "../controllers/like.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

 
router.route("/toggle/:videoId").post(toggleVideoLike);
router.route("/toggle/:commentId").post(toggleCommentLike);
router.route("/toggle/:tweetId").post(toggleTweetLike);
router.route("/videos").get(getLikedVideos);

export default router