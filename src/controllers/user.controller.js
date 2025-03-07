import { asyncHandler } from "../utils/asyncHandler.js";//for req res handling
import { ApiError } from "../utils/ApiErrors.js";//for validation and showing errors
import { User} from "../models/user.models.js";//checking if user already exists
import { uploadCloudinary } from "../utils/cloudinary.js";//for uploading images and large files to cloudinary
import { ApiResponse } from "../utils/ApiResponse.js";//for giving user response
import jwt from 'jsonwebtoken';

//as access and refresh tokens will be used many times

const generateAccessAndRefreshTokens = async(userId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})//to save token in user

        return {accessToken,refreshToken}

    }catch{
        throw new ApiError(500,"Something went wrong while generating refresh and access tokens.")
    }
}

//Register

const registerUser = asyncHandler( async(req,res) => {
    // res.status(200).json({
    //     message: "Khushi Shah"
    // })
    //get user details from frontend(now postman...as no frontend in this)
    //validation...for empty or incorrect formats
    //check if user already exists:username ,email
    //check for images,check for avatar as it is required
    //upload them to cloudinary,avatar
    //create user object as mongodb is nosql...create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return response

    const { fullName,email,username,password } = req.body//data from json or forms..not for url
    //console.log(req.body);
    console.log(email);

    // if(fullName === ""){
    //     throw new ApiError(400,"Fullname is required")
    // }

    if(
        [fullName,email,username,password].some((field) =>//.some predicts each element and returns boolean value
        field?.trim() === "")
    ){
        throw new ApiError(400,"All fields are required")
    }

    const existedUser =await User.findOne({//for checking if user already exists
        $or: [ { username } , { email }]//for checking moere than one fields
    })

    if(existedUser){
        throw new ApiError(409,"User with Username or email already exists")
    }

    //console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;//[0] as it returns obj of avatar and path
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required.")
    }

    const avatar = await uploadCloudinary(avatarLocalPath);
    const coverImage = await uploadCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    const user = await User.create({//object of user//User is in mongodb
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )//by using findById an _id field is created in User with each entry
    //by using select we can tell what fields to be shown...-means not to be added like password

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user ");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser,"User registered successfully.")
    )

})

//Login

const loginUser = asyncHandler(async(req,res) => {
    //req body data
    //username or email 
    //find user
    //check password
    //access and refresh token
    //send cookies

    const {email,username,password} = req.body

    if(!(username || email)){
        throw new ApiError(400,"Username or email is required");
    }

    const user = await User.findOne({//if we want to check one from both
        $or : [{email},{username}]
    })

    if(!user){
        throw new ApiError(404,"User does not exist");
    }
    
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Password incorrect")
    }

    const {accessToken,refreshToken} = await 
    generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true//so it can be now modifiable with servers only
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)//so it is modifiable in server only
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {//data
                user: loggedInUser,accessToken,refreshToken
            },
            "User logged in successfully"//message
        )
    )
})

//Logout

const logoutUser = asyncHandler(async(req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,//find user
        {//update operator set
            $set: {
                refreshToken: undefined
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out successfully"))
})

//refreshAccessToken

const refreshAccessToken = asyncHandler(async (req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }

    try{
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id);
    
        if(!user){
            throw new ApiError(401,"Invalid Refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure : true
        }
    
        const {accessToken,newrefreshToken}= await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newrefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken : newrefreshToken},
                "Access token refreshed"
            )
        )
    }catch(error){
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }
})

//Password change

const changeCurrentPassword = asyncHandler(async(req,res) => {
    const {oldPassword , newPassword }= req.body

    const user = await User.findById(req.user?._id)
    //chceking if old password correct
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid password")
    }

    //changing password

    user.password = newPassword
    await user.save({
        validateBeforeSave:false//for not doing other validations
    })

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "Password changed successfully"
    ))
})

//get current user
const getCurrentUser = asyncHandler(async(req,res) =>{
    return res
    .status(200)
    .json(
        200,
        req.user,
        "Current user fetched successfully"
    )
})

//Update Account Details

const updateAccountDetails = asyncHandler(async(req,res) =>{
    const {fullName,email} = req.body 

    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }

    const user = User.findByIdAndUpdate(//mongoose method
        req.user?._id,
        {
            $set: {
                fullName,//fullname and email...in both ways can be written
                email: email
            }
        },
        {new : true}//to return updated document...not old
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        user,
        "Account details updated successfully"
    ))
})

//Update user avatar

const updateUserAvatar = asyncHandler(async(req,res) =>{
    const avatarLocalPath = req.file?.path
    //first used files as it was array object or multiple objects...here one change only so file
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }
    //uploading file on cloudinary
    const avatar = await uploadCloudinary(avatarLocalPath)
    
    if(!avatar.url){
        throw new ApiError(400,"Error while uploading on avatar")
    }

    //update avatar

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Avatar updated successfully"
        )
    )

})

//Update user coverImage

const updateUserCoverImage = asyncHandler(async(req,res) =>{
    const coverImageLocalPath = await req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover Image file is missing")
    }

    const coverImage = uploadCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading cover image")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                coverImage : coverImage.url
            }
        },
        {new: true}
    ).select("-password ")

    return res
    .status(200)
    .json (
        new ApiResponse(
            200,
            user,
            "Cover Image updated successfully"
        )
    )
})

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}