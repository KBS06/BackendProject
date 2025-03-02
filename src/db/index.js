//this is to connect mongoose and database that is in mongoDB
import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";


const connectDB = async () => {
    try{
        const connectionInstance = await mongoose.connect
        (`${process.env.MONGO_URL}/${DB_NAME}`)// slash means ,
        console.log(`MongoDB connected !! DB Host: ${connectionInstance.connection.host}`)
        
    }catch(error){
        console.error("MongoDB connection error: ",error)
        process.exit(1);
    }
}

export default connectDB;