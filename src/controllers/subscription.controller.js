import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req.user && req.user._id;

  if (!channelId || mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channelId");
  }
  if (!subscriberId || !mongoose.isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriberId");
  }

  if (channelId.toString() === subscriberId.toString()) {
    throw new ApiError(400, "You cannot subscribe to yourself");
  }
  const channelUser = await User.findById(channelId).lean();

  if (!channelUser) {
    throw new ApiError(400, "Channel Not Found");
  }
 
  const existing = await Subscription.findOne({
    $or: [
      { channel: channelId, subscriber: subscriberId },
      { to: channelId, subscriber: subscriberId },
      { subscribedTo: channelId, subscriber: subscriberId },
    ],
  });

  if (existing) {
    
    await Subscription.findByIdAndDelete(existing._id);
    return res
      .status(200)
      .json(new ApiResponse(200, "Unsubscribed successfully", null));
  }

  const newSub = await Subscription.create({
    channel: channelId,
    subscriber: subscriberId,
  });
  if (!newSub) {
    throw new ApiError(500, "Failed to create subscription");
  }
  const paylaod = await Subscription.findById(newSub._id).populate(
    "subscriber",
    "username fullName avatar"
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Subscription toggled successfully", paylaod));
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId || !mongoose.Types.ObjectId.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channelId");
  }
  const subscriber = await Subscription.find({
    $or: [
      {
        channel: channelId,
      },
      {
        to: channelId,
      },
      {
        subscribedTo: channelId,
      },
    ],
  })
    .populate("subscriber", "username fullName avatar")
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, "Subscribers fetched successfully", subscriber));
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!subscriberId || !mongoose.isValidate(subscribedId)) {
    throw new ApiError(400, "Subscribed Id not Found");
  }

  const subs = await Subscription.find({
    subscriber: subscriberId,
  })
    .populate({
      path: "channel",
      select: "username fullName avatar",
    })
    .lean();

  if (!subs || subs.length === 0) {
    const alt = await Subscription.find({
      $or: [{ subscriber: subscriberId }],
    })
      .populate({
        path: "channel",
        select: "username fullName avatar",
      })
      .lean();

    return res
      .status(200)
      .json(new ApiResponse(200, "Subscribed channels fetched successfully"));
  }
  const channels = subs.map((s) => s.channel).filter(Boolean);
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Subscribed channels fetched successfully", {
        total: channels.length,
        channels,
      })
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
