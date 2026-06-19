import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { Notification } from "../models/notification.model.js";
import mongoose from "mongoose";

// GET /api/v1/comments/:videoId — Get all comments for a video
const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const pipeline = [
        { $match: { video: new mongoose.Types.ObjectId(videoId) } },
        { $sort: { createdAt: -1 } },
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
                foreignField: "comment",
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
    ];

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    const result = await Comment.aggregatePaginate(
        Comment.aggregate(pipeline),
        options
    );

    return res.status(200).json(
        new ApiResponse(200, result, "Comments fetched successfully")
    );
});

// POST /api/v1/comments/:videoId — Add a comment
const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required");
    }

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const comment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: req.user._id
    });

    const populatedComment = await Comment.findById(comment._id).populate(
        "owner", "fullname username avatar"
    );

    // Notify video owner (if commenter is not the owner)
    if (video.owner.toString() !== req.user._id.toString()) {
        await Notification.create({
            recipient: video.owner,
            sender: req.user._id,
            type: "comment",
            video: videoId,
            message: `${req.user.fullname || req.user.username} commented on your video`
        });
    }

    return res.status(201).json(
        new ApiResponse(201, populatedComment, "Comment added successfully")
    );
});

// PATCH /api/v1/comments/c/:commentId — Update a comment
const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required");
    }

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only edit your own comments");
    }

    comment.content = content.trim();
    await comment.save();

    const updatedComment = await Comment.findById(commentId).populate(
        "owner", "fullname username avatar"
    );

    return res.status(200).json(
        new ApiResponse(200, updatedComment, "Comment updated successfully")
    );
});

// DELETE /api/v1/comments/c/:commentId — Delete a comment
const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only delete your own comments");
    }

    // Delete associated likes
    await Like.deleteMany({ comment: commentId });

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    );
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
};
