import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import mongoose from "mongoose";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    if (!name?.trim()) throw new ApiError(400, "Playlist name is required");

    const playlist = await Playlist.create({
        name: name.trim(), description: description?.trim() || "", videos: [], owner: req.user._id
    });

    return res.status(201).json(new ApiResponse(201, playlist, "Playlist created"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) throw new ApiError(400, "Invalid user ID");

    const playlists = await Playlist.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        { $addFields: { videosCount: { $size: "$videos" } } },
        { $lookup: { from: "videos", localField: "videos", foreignField: "_id", as: "firstVideo",
            pipeline: [{ $limit: 1 }, { $project: { thumbnail: 1 } }] } },
        { $addFields: { thumbnail: { $ifNull: [{ $arrayElemAt: ["$firstVideo.thumbnail", 0] }, null] } } },
        { $project: { firstVideo: 0 } },
        { $sort: { updatedAt: -1 } }
    ]);

    return res.status(200).json(new ApiResponse(200, playlists, "Playlists fetched"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    if (!mongoose.isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist ID");

    const playlist = await Playlist.findById(playlistId).populate({
        path: "videos", populate: { path: "owner", select: "fullname username avatar" }
    }).populate("owner", "fullname username avatar");

    if (!playlist) throw new ApiError(404, "Playlist not found");

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist fetched"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    if (!mongoose.isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist ID");

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(404, "Playlist not found");
    if (playlist.owner.toString() !== req.user._id.toString()) throw new ApiError(403, "Not authorized");

    if (name) playlist.name = name.trim();
    if (description !== undefined) playlist.description = description.trim();
    await playlist.save();

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist updated"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    if (!mongoose.isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist ID");

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(404, "Playlist not found");
    if (playlist.owner.toString() !== req.user._id.toString()) throw new ApiError(403, "Not authorized");

    await Playlist.findByIdAndDelete(playlistId);
    return res.status(200).json(new ApiResponse(200, {}, "Playlist deleted"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if (!mongoose.isValidObjectId(playlistId) || !mongoose.isValidObjectId(videoId))
        throw new ApiError(400, "Invalid ID");

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(404, "Playlist not found");
    if (playlist.owner.toString() !== req.user._id.toString()) throw new ApiError(403, "Not authorized");

    if (playlist.videos.includes(videoId)) throw new ApiError(400, "Video already in playlist");

    playlist.videos.push(videoId);
    await playlist.save();

    return res.status(200).json(new ApiResponse(200, playlist, "Video added to playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if (!mongoose.isValidObjectId(playlistId) || !mongoose.isValidObjectId(videoId))
        throw new ApiError(400, "Invalid ID");

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(404, "Playlist not found");
    if (playlist.owner.toString() !== req.user._id.toString()) throw new ApiError(403, "Not authorized");

    playlist.videos = playlist.videos.filter(v => v.toString() !== videoId);
    await playlist.save();

    return res.status(200).json(new ApiResponse(200, playlist, "Video removed from playlist"));
});

export { createPlaylist, getUserPlaylists, getPlaylistById, updatePlaylist, deletePlaylist, addVideoToPlaylist, removeVideoFromPlaylist };
