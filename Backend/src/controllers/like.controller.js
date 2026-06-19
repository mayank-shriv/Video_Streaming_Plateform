import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";
import { Notification } from "../models/notification.model.js";
import { Video } from "../models/video.model.js";
import mongoose from "mongoose";

// POST /api/v1/likes/toggle/v/:videoId — Toggle like on a video
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(
            new ApiResponse(200, { isLiked: false }, "Video unliked")
        );
    }

    await Like.create({
        video: videoId,
        likedBy: req.user._id
    });

    // Notify video owner
    const video = await Video.findById(videoId);
    if (video && video.owner.toString() !== req.user._id.toString()) {
        await Notification.create({
            recipient: video.owner,
            sender: req.user._id,
            type: "like",
            video: videoId,
            message: `${req.user.fullname || req.user.username} liked your video`
        });
    }

    return res.status(200).json(
        new ApiResponse(200, { isLiked: true }, "Video liked")
    );
});

// POST /api/v1/likes/toggle/c/:commentId — Toggle like on a comment
const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(
            new ApiResponse(200, { isLiked: false }, "Comment unliked")
        );
    }

    await Like.create({
        comment: commentId,
        likedBy: req.user._id
    });

    return res.status(200).json(
        new ApiResponse(200, { isLiked: true }, "Comment liked")
    );
});

// GET /api/v1/likes/videos — Get all liked videos for current user
const getLikedVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: { $exists: true, $ne: null }
            }
        },
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    { $match: { isPublished: true } },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                { $project: { fullname: 1, username: 1, avatar: 1 } }
                            ]
                        }
                    },
                    { $unwind: "$owner" }
                ]
            }
        },
        { $unwind: "$video" },
        { $replaceRoot: { newRoot: "$video" } },
        { $skip: (parseInt(page) - 1) * parseInt(limit) },
        { $limit: parseInt(limit) }
    ]);

    return res.status(200).json(
        new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    );
});

export {
    toggleVideoLike,
    toggleCommentLike,
    getLikedVideos
};
