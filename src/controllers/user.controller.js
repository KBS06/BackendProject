import { asyncHandler } from "../utils/asyncHandler.js";//for req res handling
import { ApiError } from "../utils/ApiErrors.js";//for validation and showing errors
import { User} from "../models/user.models.js";//checking if user already exists
import { uploadCloudinary } from "../utils/cloudinary.js";//for uploading images and large files to cloudinary
import { ApiResponse } from "../utils/ApiResponse.js";//for giving user response

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
    console.log("email: ",email);

    // if(fullName === ""){
    //     throw new ApiError(400,"Fullname is required")
    // }

    if(
        [fullName,email,username,password].some((field) =>//.some predicts each element and returns boolean value
        field?.trim() === "")
    ){
        throw new ApiError(400,"All fields are required")
    }

    const existedUser = User.findOne({//for checking if user already exists
        $or: [ { username } , { email }]//for checking moere than one fields
    })

    if(existedUser){
        throw new ApiError(409,"User with Username or email already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;//[0] as it returns obj of avatar and path
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required.")
    }

    const avatar = await uploadCloudinary(avatarLocalPath);
    const coverImage = await uploadCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    const user = await User.create({//object of user
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
        throw new ApiError(500,"Something went wrong while regitering the user ");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser,"User registered successfully.")
    )

})

export { registerUser}