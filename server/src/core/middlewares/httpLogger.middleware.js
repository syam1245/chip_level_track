import morgan from "morgan";
import logger from "../utils/logger.js";
import config from "../config/index.js";

// Route the morgan output through our Winston logger so everything goes to
// the same transport (avoids interleaved console.log vs winston output).
const stream = {
    write: (message) => logger.http(message.trim()),
};

// In production: full Apache Combined Log format for audit trail.
// In development: compact 'dev' format (:method :url :status :response-time ms).
const format = config.isProduction
    ? ":remote-addr - :remote-user [:date[clf]] \":method :url HTTP/:http-version\" :status :res[content-length] \":referrer\" \":user-agent\""
    : "dev";

// Only skip internal health-check polls to avoid spamming the log.
const skip = (req) => req.url === "/api/health";

const httpLogger = morgan(format, { stream, skip });

export default httpLogger;
