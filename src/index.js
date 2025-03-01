//require('dotenv').config(path: '../.env');
import dotenv from 'dotenv'; 
// import mongoose from 'mongoose';
// import {DB_NAME} from "./constants.js";
import connectDB from "./db/index.js";
dotenv.config({path: './env'});

connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("ERROR",error);
        process.exit(1);
    })

    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running at port ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log("MongoDB connection failed!!!",error);
})










/*
import express from 'express';
const app = express();


( async () =>{
    try{
        await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("Error: ",error)
            throw error
        })

    app.listen(process.env.PORT,()=>{
        console.log(`App is running on port ${process.env.PORT}`)
        } )
    } catch(error){
        console.error("ERROR: ",error)
        throw error
    }
})()
*/ 

