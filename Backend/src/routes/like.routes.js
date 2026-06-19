import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middlewares.js";
import { toggleVideoLike, toggleCommentLike, getLikedVideos } from "../controllers/like.controller.js";

const router = Router();

router.use(verifyJwt); // All like routes require auth

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/videos").get(getLikedVideos);

export default router;
