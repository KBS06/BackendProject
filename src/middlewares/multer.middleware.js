import multer from 'multer';//for storing files in storage

const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,'./public/temp')//all file will be stored here
    },
    filename: function (req,file,cb){
        //const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() *1E9)
        cb(null, file.originalname)//.fieldname + '-' + uniqueSuffix)
    }
})

export const upload = multer({
    storage: storage
})