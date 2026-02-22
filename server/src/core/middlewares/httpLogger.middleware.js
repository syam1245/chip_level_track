import morgan from "morgan";
import logger from "../utils/logger.js";

const stream = {
    write: (message) => logger.info(message.trim()),
};

const skip = () => {
    // Skip these extremely verbose HTTP logs unless explicitly needed for debugging
    return true;
};

const httpLogger = morgan(
    ":remote-addr - :remote-user [:date[clf]] \":method :url HTTP/:http-version\" :status :res[content-length] \":referrer\" \":user-agent\"",
    { stream, skip }
);

export default httpLogger;
