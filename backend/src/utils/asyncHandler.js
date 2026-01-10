const asyncHandler=(requestHandler)=>{
    //we will return asitis in promise format
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next))
        .catch((err)=>next(err))
    }
}



//we are using first with try catch





export{asyncHandler}