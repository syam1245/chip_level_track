class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);

        // Shows as "AppError: message" in logs and stack traces instead of
        // the inherited "Error: message" — makes operational errors immediately
        // distinguishable from unexpected ones without reading the full trace.
        this.name = this.constructor.name;

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
        this.isOperational = true;

        // Excludes the AppError constructor itself from the stack trace so the
        // trace points at the actual throw site, not here.
        Error.captureStackTrace(this, this.constructor);
    }
}

export default AppError;