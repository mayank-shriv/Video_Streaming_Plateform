import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middlewares.js";
import {
    getAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus
} from "../controllers/video.controller.js";

const router = Router();

router.route("/")
    .get(getAllVideos)
    .post(
        verifyJwt,
        upload.fields([
            { name: "videoFile", maxCount: 1 },
            { name: "thumbnail", maxCount: 1 }
        ]),
        publishAVideo
    );

router.route("/:videoId")
    .get(getVideoById)
    .patch(verifyJwt, upload.single("thumbnail"), updateVideo)
    .delete(verifyJwt, deleteVideo);

router.route("/toggle/publish/:videoId").patch(verifyJwt, togglePublishStatus);

export default router;
