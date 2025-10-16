import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Comment } from "../models/comment.model.js";

import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId || !mongoose.isValidObjectId(videoId)) {
    throw new ApiError("VideoId is not found or invalid", 400);
  }

  const isVideoLiked = await Like.findOne({
    video: videoId,
    owner: req.user._id,
  });
  if (!isVideoLiked) {
    const newLike = await Like.create({ video: videoId, owner: req.user._id });
    return res.status(200).json(new ApiResponse(200, "Video liked", newLike));
  } else {
    await Like.findByIdAndDelete(isVideoLiked._id);
    return res.status(200).json(new ApiResponse(200, "Video unliked", null));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId || !mongoose.isValidObjectId(commentId)) {
    throw new ApiError("CommentId is not found or invalid", 400);
  }
  const isCommented = await Comment.findOne({
    comment: commentId,
    owner: req.user._id,
  });
  if (!isCommented) {
    const newLike = await Like.create({
      comment: commentId,
      owner: req.user._id,
    });
    return res.status(200).json(new ApiResponse(200, "Comment liked", newLike));
  } else {
    await Like.findByIdAndDelete(isCommented._id);
    return res.status(200).json(new ApiResponse(200, "Comment unliked", null));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId) {
    throw new ApiError("TweetId is not found", 400);
  }
  const isTweetLiked = await Like.findOne({
    tweet: tweetId,
    owner: req.user._id,
  });
  if (!isTweetLiked) {
    const likeTweet = await Like.create({
      tweet: tweetId,
      owner: req.user._id,
    });
    return res.status(200).json(new ApiResponse(200, "Tweet liked", likeTweet));
  } else {
    await Like.findByIdAndDelete(isTweetLiked._id);
    return res.status(200).json(new ApiResponse(200, "Tweet un liked", null));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const ownerId = req.user && req.user._id;
  if (!ownerId) {
    throw new ApiError("Unauthorized user", 401);
  }
  const likedVideo = await Like.find({ owner: ownerId }).populate("video");

  if (!likedVideo) {
    throw new ApiError("No liked videos found", 404);
  }
  res
    .status(200)
    .json(
      new ApiResponse(200, "Liked videos fetched successfully", likedVideo)
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
