import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { Notification } from "../models/notification.model.js";
import { SubScription } from "../models/subscription.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

// GET /api/v1/videos — Get all videos (with search, pagination, sort)
const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 12,
        query,
        sortBy = "createdAt",
        sortType = "desc",
        userId
    } = req.query;

    const pipeline = [];

    // Search by title or description
    if (query) {
        pipeline.push({
            $match: {
                $or: [
                    { title: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } }
                ]
            }
        });
    }

    // Filter by user
    if (userId) {
        pipeline.push({
            $match: { owner: new mongoose.Types.ObjectId(userId) }
        });
    }

    // Only published videos (unless owner is requesting their own)
    pipeline.push({
        $match: { isPublished: true }
    });

    // Sort
    const sortOrder = sortType === "asc" ? 1 : -1;
    pipeline.push({ $sort: { [sortBy]: sortOrder } });

    // Lookup owner details
    pipeline.push({
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
            pipeline: [
                { $project: { fullname: 1, username: 1, avatar: 1 } }
            ]
        }
    });
    pipeline.push({ $unwind: "$owner" });

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    const result = await Video.aggregatePaginate(
        Video.aggregate(pipeline),
        options
    );

    return res.status(200).json(
        new ApiResponse(200, result, "Videos fetched successfully")
    );
});

// POST /api/v1/videos — Upload a video
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required");
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required");
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoFile) {
        throw new ApiError(400, "Failed to upload video file");
    }
    if (!thumbnail) {
        throw new ApiError(400, "Failed to upload thumbnail");
    }

    const video = await Video.create({
        title,
        description,
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        duration: videoFile.duration || 0,
        owner: req.user._id,
        isPublished: true
    });

    const createdVideo = await Video.findById(video._id).populate(
        "owner", "fullname username avatar"
    );

    // Notify subscribers about new video
    const subscribers = await SubScription.find({ channel: req.user._id });
    if (subscribers.length > 0) {
        const notifications = subscribers.map(sub => ({
            recipient: sub.subscriber,
            sender: req.user._id,
            type: "new_video",
            video: video._id,
            message: `${req.user.fullname || req.user.username} uploaded a new video: "${title}"`
        }));
        await Notification.insertMany(notifications);
    }

    return res.status(201).json(
        new ApiResponse(201, createdVideo, "Video published successfully")
    );
});

// GET /api/v1/videos/:videoId — Get video by ID
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Increment view count
    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });

    const video = await Video.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(videoId) } },
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
        { $unwind: "$owner" },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        { $project: { likes: 0 } }
    ]);

    if (!video.length) {
        throw new ApiError(404, "Video not found");
    }

    // Add to watch history if user is logged in
    if (req.user) {
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { watchHistory: new mongoose.Types.ObjectId(videoId) }
        });
        await User.findByIdAndUpdate(req.user._id, {
            $push: {
                watchHistory: {
                    $each: [new mongoose.Types.ObjectId(videoId)],
                    $position: 0
                }
            }
        });
    }

    return res.status(200).json(
        new ApiResponse(200, video[0], "Video fetched successfully")
    );
});

// PATCH /api/v1/videos/:videoId — Update video details
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;

    // Update thumbnail if provided
    const thumbnailLocalPath = req.file?.path;
    if (thumbnailLocalPath) {
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        if (!thumbnail) {
            throw new ApiError(400, "Failed to upload thumbnail");
        }
        // Delete old thumbnail
        await deleteFromCloudinary(video.thumbnail);
        updateData.thumbnail = thumbnail.url;
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateData },
        { new: true }
    ).populate("owner", "fullname username avatar");

    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video updated successfully")
    );
});

// DELETE /api/v1/videos/:videoId — Delete video
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video");
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(video.videoFile);
    await deleteFromCloudinary(video.thumbnail);

    // Delete associated data
    await Like.deleteMany({ video: videoId });
    await Comment.deleteMany({ video: videoId });

    // Remove from all users' watch history
    await User.updateMany(
        {},
        { $pull: { watchHistory: new mongoose.Types.ObjectId(videoId) } }
    );

    await Video.findByIdAndDelete(videoId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Video deleted successfully")
    );
});

// PATCH /api/v1/videos/toggle/publish/:videoId — Toggle publish status
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to toggle this video");
    }

    video.isPublished = !video.isPublished;
    await video.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(
            200,
            { isPublished: video.isPublished },
            `Video ${video.isPublished ? "published" : "unpublished"} successfully`
        )
    );
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
};
