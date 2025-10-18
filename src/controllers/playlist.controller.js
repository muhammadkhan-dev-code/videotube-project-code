import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// todo : 1 Create Playlist
const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name || !description) {
        throw new ApiError(400, "Name and description are required");
    }

    const ownerId = req.user?._id;

    const newPlaylist = await Playlist.create({
        name,
        description,
        owner: ownerId,
    });

    res.status(201).json(
        new ApiResponse(201, "Playlist created successfully", newPlaylist)
    );
});

// todo :2 Get All Playlists of a User
const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId || !isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    const playlists = await Playlist.find({ owner: userId })
        .populate("videos")
        .exec();

    res.status(200).json(
        new ApiResponse(200, "User playlists fetched successfully", playlists)
    );
});

// todo :3 Get Playlist by ID
const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId");
    }

    const playlist = await Playlist.findById(playlistId)
        .populate("videos")
        .exec();

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    res.status(200).json(
        new ApiResponse(200, "Playlist fetched successfully", playlist)
    );
});

// todo : 4 Add Video to Playlist
const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId");
    }
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video already exists in this playlist");
    }

    playlist.videos.push(videoId);
    await playlist.save();

    res.status(200).json(
        new ApiResponse(200, "Video added to playlist successfully", playlist)
    );
});

// todo : 5 Remove Video from Playlist
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId");
    }
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $pull: { videos: videoId } },
        { new: true }
    );

    if (!updatedPlaylist) {
        throw new ApiError(404, "Playlist not found");
    }

    res.status(200).json(
        new ApiResponse(
            200,
            "Video removed from playlist successfully",
            updatedPlaylist
        )
    );
});

// todo : 6 Delete Playlist
const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    const ownerId = req.user?._id;
    if (!ownerId || String(playlist.owner) !== String(ownerId)) {
        throw new ApiError(403, "You are not authorized to delete this playlist");
    }

    const deleted_playlist = await Playlist.findByIdAndDelete(playlistId);

    return res.status(200).json(
        new ApiResponse(200, "Playlist deleted successfully", deleted_playlist)
    );
});

// todo : 7 Update Playlist
const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    const ownerId = req.user?._id;
    if (!ownerId || String(playlist.owner) !== String(ownerId)) {
        throw new ApiError(403, "You are not allowed to update this playlist");
    }

    const updates = {};
    if (typeof name === "string" && name.trim() !== "") updates.name = name.trim();
    if (typeof description === "string") updates.description = description.trim();

    if (Object.keys(updates).length === 0) {
        throw new ApiError(400, "Nothing to update");
    }

    const updated = await Playlist.findByIdAndUpdate(
        playlistId,
        updates,
        { new: true, runValidators: true }
    ).populate("owner", "username fullName avatar");

    return res.status(200).json(
        new ApiResponse(200, "Playlist updated successfully", updated)
    );
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
};
