import { Router } from "express";

import {
    loginUser,
    logOutUser,
    registerUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverAvatar,
    getUserChannelProfile,
    getWatchHistory,
    clearWatchHistory
} from "../controllers/user.controller.js";

import { getNotifications, markAllAsRead } from "../controllers/notification.controller.js";

import { upload } from "../middlewares/multer.middlewares.js"

import { verifyJwt } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJwt, logOutUser)

router.route("/refresh-token").post(refreshAccessToken)

// Protected routes
router.route("/current-user").get(verifyJwt, getCurrentUser)
router.route("/change-password").post(verifyJwt, changePassword)
router.route("/update-account").patch(verifyJwt, updateAccountDetails)
router.route("/update-avatar").patch(verifyJwt, upload.single("avatar"), updateUserAvatar)
router.route("/update-cover").patch(verifyJwt, upload.single("coverImage"), updateUserCoverAvatar)
router.route("/channel/:username").get(getUserChannelProfile)

// Watch history
router.route("/history").get(verifyJwt, getWatchHistory).delete(verifyJwt, clearWatchHistory)

// Notifications
router.route("/notifications").get(verifyJwt, getNotifications)
router.route("/notifications/read").patch(verifyJwt, markAllAsRead)

export default router;
