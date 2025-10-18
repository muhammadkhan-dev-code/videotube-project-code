import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  
  const channelId = req.user && req.user._id;

  if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(404, "Channel not found");
  }

  const channel = mongoose.Types.ObjectId(channelId);

  const videos = await Video.find({ owner: channel });
  const totalVideos = videos.length;
  const totalViews = videos.reduce((acc, video) => {
    return acc + video.views;
  }, 0);
  const video_ids = videos.map((video) => mongoose.Types.ObjectId(video._id));

  let likes = 0;
  let dislikes = 0;

  if (video_ids.length > 0) {
    likes = await Like.countDocuments({
      video: { $in: video_ids },
      like: true,
    });
    dislikes = await Like.countDocuments({
      video: { $in: video_ids },
      like: false,
    });
  }

  const totalSubscribers = await Subscription.countDocuments({
    $or: [{ to: channel }, { subscribeTo: channel }, { channel: channel }],
  });

  const res_data = {
    totalVideos,
    totalViews,
    totalLikes: likes,
    totalDislikes: dislikes,
    totalSubscribers,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, "Channel stats fetched successfully", res_data));
});


const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const channelId= req.user && req.user._id;
  
  if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(404, "Channel not found");
  }
    const channel = mongoose.Types.ObjectId(channelId);
    
    const [videos,total]= await Promise.all([
        Video.find({owner:channel}).
        populate("owner","username fullName avatar")
        .lean(),
       Video.countDocuments({owner:channel}),
    ]);

    const channel_info={videos,total};

    res.status(200).
    json(new ApiResponse(200,"Channel videos fetched successfully",channel_info));


});

export { getChannelStats, getChannelVideos };
