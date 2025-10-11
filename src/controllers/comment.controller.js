import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

 const page = Math.max(1, Number(req.query.page) || 1);
const limit = Math.min(100, Number(req.query.limit) || 15);
const skip = (page - 1) * limit;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  const [docs, total] = await Promise.all([
    Comment.find({ video: videoId })
      .skip(skip)
      .limit(limit)
      .populate("owner", "username fullName avatar")
      .lean(),
    Comment.countDocuments({ video: videoId }),
  ]);

  const totalPages = Math.ceil(total / limit);

  if (total === 0) {
    return res.status(200).json(
      new ApiResponse(200, "No comments found", {
        docs: [],
        total,
        page,
        limit,
        totalPages,
      })
    );
  }
  const payload = { docs, total, page, limit: Number(limit), totalPages };

  res
    .status(200)
    .json(new ApiResponse(200, "Comments fetched successfully", payload));
});

const addComment = asyncHandler(async (req, res) => {
  // add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError("Invalid videoId", 400);
  }

  if (!content || content.trim() === "") {
    throw new ApiError("Content is required", 400);
  }

  const ownerId = req.user && req.user._id;

  if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
    throw new ApiError("unauthorized user owner id is invalid", 400);
  }

  // create comment
  const comment = await Comment.create({
    content,
    video: mongoose.Types.ObjectId(videoId),
    owner: mongoose.Types.ObjectId(ownerId),
  });

  // push comment id to video's comments

  const Video = mongoose.model("Video");
  if(!Video){ 
    throw new ApiError("Video model not found", 500);
  }
  await Video.findByIdAndUpdate(videoId, { $push: { comments: comment._id } });

  // populate owner fields for response
  const owner_field = await Comment.findById(comment._id).populate(
    "owner",
    "username fullName avatar"
  );

  return res
    .status(201)
    .json(new ApiResponse(201, "Comment added successfully", owner_field));
});

const updateComment = asyncHandler(async (req, res) => {
  
    const {commentId} = req.params;
    const {content}= req.body;
    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError("Invalid commentId", 400);
    }
if(!content || content.trim() === ""){
    throw new ApiError("Content is required", 400);
}

const ownerId = req.user && req.user._id;

if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
    throw new ApiError("unauthorized user owner id is invalid", 400);
}

 // find the comment 
const comment = await Comment.findById(commentId);

if (!comment) {
    throw new ApiError("Comment not found", 404);
}

if (comment.owner.toString() !== ownerId.toString()) {
    throw new ApiError("You are not owner of this comment to update", 403);
}

comment.content = content;
await comment.save();

res.status(200).json(new ApiResponse(200, "Comment updated successfully", comment));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError("Invalid commentId", 400);
 
}


const ownerId= req.user && req.user._id;
if(!ownerId){
    throw new ApiError("Unauthorized user", 401);
}
 const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError("Comment not found", 404);
    }

    if(comment.owner.toString() !== ownerId.toString()){
        throw new ApiError("You are not owner of this comment to delete", 403);

    }
    const deletedComment= await Comment.findByIdAndDelete(commentId);
    
    if(!deletedComment){
        throw new ApiError("Failed to delete comment", 500);
    }

    const Video = mongoose.model("Video");
  await Video.findByIdAndUpdate(comment.video, { $pull: { comments: comment._id } });

   const Like = mongoose.model("Like");
  await Like.deleteMany({ comment: comment._id });

    res.status(200).json(new ApiResponse(200, "Comment deleted successfully", deletedComment));



});

export { getVideoComments, addComment, updateComment, deleteComment };
