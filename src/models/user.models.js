import mongoose,{Schema} from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';//for encoding and decoding 

const userSchema = new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,//for white spaces
        index:true//for enabling searching field
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String,//cloudinary url
        required:true
    },
    coverImage:{
        type:String,//cloudinary url
    },
    watchHistory:[{
        type:Schema.Types.ObjectId,
        ref:"Video",
    }],
    password:{
        type:String,
        required:[true,'Password is required']
    },
    refreshToken:{
        type:String
    }
},{timestamps:true})

userSchema.pre("save",async function (next){//next to transfer control to next after function
    if(!this.isModified("password")) return next();
    
    this.password =await bcrypt.hash(this.password,10)//10 is number of rounds
    next()
} );//it changes everytime so if condition is used

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
};//for verifying password

userSchema.methods.generateAccessToken = function(){
    return jwt.sign({//payload that is data
        _id: this._id,
        email: this.email,
        username:this.username,
        fullName:this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
    )//to generate tokens=>sign
};//JWT tokens

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({//payload that is data
        _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
    )
}

export const User = mongoose.model("User",userSchema)
