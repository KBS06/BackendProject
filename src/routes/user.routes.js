import { Router } from "express";
import { changeCurrentPassword, 
        getCurrentUser,
        getUserChannelProfile,
        getWatchHistory,
        logoutUser,
        registerUser,
        updateAccountDetails,
        updateUserAvatar,
        updateUserCoverImage } 
        from "../controllers/user.controller.js";
import {upload} from '../middlewares/multer.middleware.js';
import { loginUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";//for verifying if user is loggedin
import { refreshAccessToken } from "../controllers/user.controller.js";

 const router = Router()

router.route("/register").post(
    upload.fields([//from multer upload files or images to it
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

//update routes

router.route("/change-password").post(verifyJWT,changeCurrentPassword)//as we want to take details from user
router.route("/current-user").get(verifyJWT,getCurrentUser)//as nothing to take from user
router.route("/update-account").patch(verifyJWT,updateAccountDetails)//as we want to update existing details

router.route("/avatar").patch(verifyJWT, upload.single("avatar"),updateUserAvatar)//multer upload method to get file
router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)

router.route("/c/:username").get(verifyJWT,getUserChannelProfile)//as data is taken from url
router.route("/history").get(verifyJWT,getWatchHistory)

export default router