import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,// allow to server to accept request from different origin
    credentials:true// allow session cookie from browser to pass through
}))

app.use(express.json({//parse the incoming request with JSON payloads
    limit: '16kb' // limit the body of the request to 16kb
}))

app.use(express.urlencoded({
    extended:true,//parse the incoming request with urlencoded payloads
    limit:'16kb'//here comma is used not semi colon
}))

app.use(express.static('public'))//to serve static files

app.use(cookieParser());//parse the incoming cookies

export { app };