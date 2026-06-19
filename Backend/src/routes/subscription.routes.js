import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middlewares.js";
import { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels } from "../controllers/subscription.controller.js";

const router = Router();

router.route("/c/:channelId").post(verifyJwt, toggleSubscription).get(getUserChannelSubscribers);
router.route("/u/:subscriberId").get(verifyJwt, getSubscribedChannels);

export default router;
