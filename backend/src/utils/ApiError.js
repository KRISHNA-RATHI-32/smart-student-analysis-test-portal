class ApiError extends Error{
    constructor(
        statusCode,
        message="Something went wrong",
        errors=[],
        stack=""//error stack
    ){
        super(message)  
        this.statusCode=statusCode
        this.data=null
        this.message=message
        this.success=false;//actally we are handeling api errors not response
        this.errors=errors;
        if(stack){
            this.stack=stack;

        }else{
            Error.captureStackTrace(this,this.constructor)//this will capture the stack trace of the error and assign it to the stack property of the error object. The first argument is the error object itself, and the second argument is the constructor function of the error class. This helps to exclude the constructor function from the stack trace, making it cleaner and more relevant to where the error actually occurred.
        }
    }
}



export{ApiError}