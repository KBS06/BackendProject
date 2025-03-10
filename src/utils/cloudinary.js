import {v2 as cloudinary} from 'cloudinary';
import fs from 'node:fs';//file systems...for file handling 

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        //file has been uploaded successfully
        console.log("file is uploaded on cloudinary",response.secure_url);
        console.log(response);
        fs.unlink(localFilePath,(err)=>{
            if(err && err.code !== 'ENOENT'){
                console.error('Error deleting file:',err);
            }
        })
        return response;

    }catch(error){
        fs.unlinkSync(localFilePath)//remove the locally saved temporary file as the operation got failed
        return null;
    }
}

// const uploadResult = await cloudinary.uploader
//        .upload(
//            'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
//                public_id: 'shoes',
//            }
//        )
//        .catch((error) => {
//            console.log(error);
//        });
    
//     console.log(uploadResult);

export {uploadCloudinary}