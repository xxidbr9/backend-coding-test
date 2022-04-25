import { createLogger, format, transports } from "winston";

const LEVEL = "info";
const log = createLogger({
  level: LEVEL,
  format: format.json(),
  transports: [
    new transports.File({ filename: "error.log", level: LEVEL }),
    new transports.File({ filename: "combined.log" }),

    new transports.File({
      level: LEVEL,
      filename: "api-ride.log",
      handleExceptions: true,
      format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.simple(),
        format.printf(
          (info) =>
            `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`
        ),
      ),
    }),
  ],
});

export default log;
