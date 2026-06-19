import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { SubScription } from "../models/subscription.model.js";
import { Notification } from "../models/notification.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!mongoose.isValidObjectId(channelId)) throw new ApiError(400, "Invalid channel ID");
    if (channelId === req.user._id.toString()) throw new ApiError(400, "Cannot subscribe to yourself");

    const channel = await User.findById(channelId);
    if (!channel) throw new ApiError(404, "Channel not found");

    const existing = await SubScription.findOne({ subscriber: req.user._id, channel: channelId });
    if (existing) {
        await SubScription.findByIdAndDelete(existing._id);
        return res.status(200).json(new ApiResponse(200, { isSubscribed: false }, "Unsubscribed"));
    }

    await SubScription.create({ subscriber: req.user._id, channel: channelId });
    await Notification.create({
        recipient: channelId, sender: req.user._id, type: "subscription",
        message: `${req.user.fullname || req.user.username} subscribed to your channel`
    });

    return res.status(200).json(new ApiResponse(200, { isSubscribed: true }, "Subscribed"));
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!mongoose.isValidObjectId(channelId)) throw new ApiError(400, "Invalid channel ID");

    const subscribers = await SubScription.aggregate([
        { $match: { channel: new mongoose.Types.ObjectId(channelId) } },
        { $lookup: { from: "users", localField: "subscriber", foreignField: "_id", as: "subscriber",
            pipeline: [{ $project: { fullname: 1, username: 1, avatar: 1 } }] } },
        { $unwind: "$subscriber" },
        { $replaceRoot: { newRoot: "$subscriber" } }
    ]);

    return res.status(200).json(new ApiResponse(200, subscribers, "Subscribers fetched"));
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    if (!mongoose.isValidObjectId(subscriberId)) throw new ApiError(400, "Invalid subscriber ID");

    const channels = await SubScription.aggregate([
        { $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) } },
        { $lookup: { from: "users", localField: "channel", foreignField: "_id", as: "channel",
            pipeline: [{ $project: { fullname: 1, username: 1, avatar: 1 } }] } },
        { $unwind: "$channel" },
        { $replaceRoot: { newRoot: "$channel" } }
    ]);

    return res.status(200).json(new ApiResponse(200, channels, "Subscribed channels fetched"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
