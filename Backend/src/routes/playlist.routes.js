import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middlewares.js";
import {
    createPlaylist, getUserPlaylists, getPlaylistById,
    updatePlaylist, deletePlaylist, addVideoToPlaylist, removeVideoFromPlaylist
} from "../controllers/playlist.controller.js";

const router = Router();

router.route("/").post(verifyJwt, createPlaylist);
router.route("/user/:userId").get(getUserPlaylists);
router.route("/:playlistId").get(getPlaylistById).patch(verifyJwt, updatePlaylist).delete(verifyJwt, deletePlaylist);
router.route("/add/:videoId/:playlistId").patch(verifyJwt, addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(verifyJwt, removeVideoFromPlaylist);

export default router;
