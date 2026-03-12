/**
 * Sends a consistent success response.
 * Shape mirrors errorMiddleware's { success, error } so the client
 * always receives the same envelope regardless of outcome.
 */
const sendResponse = (res, statusCode, data = null, message = "Success") => {
    // Catch accidental misuse at development time — a non-2xx status with
    // success:true would contradict itself and confuse any client checking either.
    if (process.env.NODE_ENV !== "production" && (statusCode < 200 || statusCode > 299)) {
        throw new Error(
            `[sendResponse] statusCode ${statusCode} is not a 2xx success code. ` +
            `Use errorMiddleware (via next(err)) for error responses.`
        );
    }

    // data defaults to null rather than undefined — JSON.stringify silently
    // drops undefined values, so without a default the field would simply be
    // absent from the response and the client would get no data with no error.
    res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

export default sendResponse;