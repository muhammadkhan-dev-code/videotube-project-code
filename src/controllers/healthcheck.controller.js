import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    if(res.status!==200){

        throw new ApiError(500,"Service is unhealthy")
    }
    
    res.status(200).json(new ApiResponse(200,"Service is healthy",null))


})

export {
    healthcheck
    }
    