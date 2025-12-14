import Transport from "winston-transport";
import ErrorLog from "../../models/ErrorLog.model.ts";

interface MongoTransportOptions extends Transport.TransportStreamOptions {
  levels?: string[];
}

/**
 * Custom Winston transport that writes logs to MongoDB.
 * Only stores error and warn levels by default.
 */
export class MongoTransport extends Transport {
  private allowedLevels: string[];

  constructor(opts?: MongoTransportOptions) {
    super(opts);
    this.allowedLevels = opts?.levels || ["error", "warn"];
  }

  async log(info: any, callback: () => void) {
    setImmediate(() => this.emit("logged", info));

    // Only persist allowed levels
    if (!this.allowedLevels.includes(info.level)) {
      return callback();
    }

    try {
      await ErrorLog.create({
        level: info.level,
        message: info.message,
        stack: info.stack || info[Symbol.for("splat")]?.[0]?.stack,
        context: info.context || {},
        timestamp: new Date(),
      });
    } catch (err) {
      // Silent fail - we don't want logging to break the app
      console.error("[MongoTransport] Failed to write log:", err);
    }

    callback();
  }
}
