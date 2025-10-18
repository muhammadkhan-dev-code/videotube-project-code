import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
  const pageNumber = Math.max(1, Number(page));
  const pageSize = Math.min(100, Number(limit));
  const skip = (pageNumber - 1) * pageSize;

  const match = { isPublished: true };

  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError("Invalid userId", 400);
    }
    match.owner = userId;
    if (req.user && String(req.user._id) === String(userId)) {
      delete match.isPublished;
    }
  }
  if ((query || "").trim()) {
    match.$or = [
      {
        title: { $regex: query.trim(), $options: "i" },
      },
      {
        description: { $regex: query.trim(), $options: "i" },
      },
    ];
  }
  const allowedSort = new Set(["createdAt", "views", "title"]);
  const sortField = allowedSort.has(String(sortBy))
    ? String(sortBy)
    : "createdAt";
  const sortOrder = String(sortType).toLowerCase() === "asc" ? 1 : -1;
  const sort = { [sortField]: sortOrder };

  const [docs, totalDocs] = await Promise.all([
    Video.find(match)
      .populate("owner", "username fullName avatar")
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .lean(),
    Video.countDocuments(match),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalDocs / pageSize));
  const payload = {
    docs,
    totalDocs,
    limit: pageSize,
    page: pageNumber,
    totalPages,
    hasNextPage: pageNumber < totalPages,
    hasPrevPage: pageNumber > 1,
    nextPage: pageNumber < totalPages ? pageNumber + 1 : null,
    prevPage: pageNumber > 1 ? pageNumber - 1 : null,
  };
  return res
    .status(200)
    .json(new ApiResponse(200, "Videos fetched successfully", payload));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const ownerId = req.user && req.user._id;
  const { title, description } = req.body;

  if (!ownerId || !isValidObjectId(ownerId)) {
    throw new ApiError(404, "Unauthorized Owner");
  }

  if (!title || title.trim() === "") {
    throw new ApiError("Title can not be empty", 400);
  }

  const video_local_path = req.files?.videoFile?.[0].path;
  const thumbnail_path = req.files?.thumbnail?.[0].path;

  if (!video_local_path) {
    throw new ApiError("Video file is required", 400);
  }

  const uploadedVideo = await uploadOnCloudinary(video_local_path, "video");

  if (!uploadedVideo?.url) {
    throw new ApiError("Video upload failed", 500);
  }

  let uploadedThumb = null;
  if (thumbnail_path) {
    uploadedThumb = await uploadOnCloudinary(thumbnail_path, "image");
    if (!uploadedThumb?.url) {
      throw new ApiError("Thumbnail upload failed", 500);
    }
  }

  const video = await Video.create({
    title: title.trim(),
    description: description?.trim() || "",
    videoFile: uploadedVideo.url,
    duration: uploadedVideo?.duration || undefined,
    thumbnail: uploadedThumb?.url || undefined,
    owner: ownerId,
    isPublished: true,
  });

  return res.status(200).json(200, "video published successFully" ,video);
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError("Invalid videoId", 400);
  }

  const video = await Video.findById(videoId).populate(
    "owner",
    "username fullName avatar"
  );
  if (!video) {
    throw new ApiError("Video not found", 404);
  }

  const requesterId = req.user && req.user._id;

  const isOwner =
    requesterId && String(video.owner._id) === String(requesterId);

  if (!video.isPublished && !isOwner) {
    throw new ApiError("video is not published ", 400);
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "Video fetched successfully", video));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError("Invalid videoId", 400);
  }
  const existing_video = await Video.findById(videoId);
  if (!existing_video) {
    throw new ApiError("Video not found", 404);
  }
  const owner_id = req.user && req.user._id;
  if (!owner_id || String(existing_video.owner) !== String(owner_id)) {
    throw new ApiError("You are not owner to update this video", 403);
  }
  const updates = {};
  const { title, description } = req.body;

  if (typeof title === "string" && title.trim() !== "")
    updates.title = title.trim();
  if (typeof description === "string") updates.description = description.trim();

  const thumbLocalPath = req.files?.thumbnail?.[0]?.path || req.file?.path;
  if (thumbLocalPath) {
    const uploadedThumb = await uploadOnCloudinary(thumbLocalPath);
    if (!uploadedThumb?.url) {
      throw new ApiError("Thumbnail upload failed", 500);
    }
    updates.thumbnail = uploadedThumb.url;
  }

  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  if (videoLocalPath) {
    const uploadedVideo = await uploadOnCloudinary(videoLocalPath, {
      resource_type: "video",
    });
    if (!uploadedVideo?.url) {
      throw new ApiError("Video upload failed", 500);
    }
    updates.videoFile = uploadedVideo.url;
    if (uploadedVideo?.duration) updates.duration = uploadedVideo.duration;
  }
  if (Object.keys(updates).length === 0) {
    throw new ApiError("Nothing to update", 400);
  }

  const updated = await Video.findByIdAndUpdate(videoId, updates, {
    new: true,
    runValidators: true,
  }).populate("owner", "username fullName avatar");

  return res
    .status(200)
    .json(new ApiResponse(200, "Video updated successfully", updated));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError("Invalid videoId", 400);
  }

  const existing = await Video.findById(videoId);
  if (!existing) {
    throw new ApiError("Video not found", 404);
  }

  const ownerId = req.user && req.user._id;
  if (!ownerId || String(existing.owner) !== String(ownerId)) {
    throw new ApiError("You are not allowed to delete this video", 403);
  }

  await Video.findByIdAndDelete(videoId);

 
  await Promise.all([
    Like.deleteMany({ video: videoId }),
    Comment.deleteMany({ video: videoId }),
  ]);
  res
    .status(200)
    .json(new ApiResponse(200, "Video deleted successfully", null));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError("Invalid videoId", 400);
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError("Video not found", 404);
  }

  const ownerId = req.user && req.user._id;
  if (!ownerId || String(video.owner) !== String(ownerId)) {
    throw new ApiError("You are not allowed to change publish status", 403);
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Video publish status updated", video));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
