import morgan from "morgan";
import logger from "../utils/logger.js";
import config from "../config/index.js";

// Route morgan output through Winston so all logs go to the same transport —
// no interleaved console.log vs winston output in the terminal.
const stream = {
    write: (message) => logger.http(message.trim()),
};

// "combined" is morgan's built-in Apache Combined Log Format.
// The original code wrote this format out manually — identical bytes but a
// maintenance risk if morgan ever changes token names. Use the named preset.
const format = config.isProduction ? "combined" : "dev";

// Skip health-check pings from the log to avoid noise.
// req.originalUrl is used instead of req.url for robustness — req.url is
// relative to the mount point, req.originalUrl is always the full path.
const skip = (req) => req.originalUrl === "/api/health";

const httpLogger = morgan(format, { stream, skip });

export default httpLogger;