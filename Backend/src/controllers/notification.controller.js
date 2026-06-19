import asyncHandler from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Notification } from "../models/notification.model.js";

const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("sender", "fullname username avatar")
        .populate("video", "title thumbnail");

    const unreadCount = await Notification.countDocuments({
        recipient: req.user._id, isRead: false
    });

    return res.status(200).json(
        new ApiResponse(200, { notifications, unreadCount }, "Notifications fetched")
    );
});

const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { $set: { isRead: true } }
    );

    return res.status(200).json(new ApiResponse(200, {}, "All notifications marked as read"));
});

export { getNotifications, markAllAsRead };
