import morgan from "morgan";
import logger from "../utils/logger.js";

const stream = {
    write: (message) => logger.info(message.trim()),
};

const skip = () => {
    // Optional: Add logic to skip logging certain requests, e.g., health checks in production
    // if (config.env === 'production') return true;
    return false;
};

const httpLogger = morgan(
    ":remote-addr - :remote-user [:date[clf]] \":method :url HTTP/:http-version\" :status :res[content-length] \":referrer\" \":user-agent\"",
    { stream, skip }
);

export default httpLogger;
