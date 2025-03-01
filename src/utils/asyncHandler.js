 const asyncHandler = (requestHandler) => {
    (req, res, next) => {
        Promise.resolve(requestHandler(req,res,next)).
        catch((error) => next(error))
 }
}


export {asyncHandler}

// const asyncHandler = (fn) => async (req,res,next) => {
//     try{
//         await fn(req,res,next)
//     }catch (error){
//         res.status(error.code || 500).json({//error.code is the status code that we get from the error object
//             success : false,//success is false because the request was not successful
//             message: error.message //error.message is the message that we get from the error object
//         }
//         )
//     }
// }