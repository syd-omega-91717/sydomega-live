// ============================================================================
// FILE: /backend/src/config/logger.js
// NEW FILE
// ============================================================================

const levels = {

    info: "INFO",

    warn: "WARN",

    error: "ERROR",

    debug: "DEBUG",

    audit: "AUDIT"

};

function write(level, message, meta = {}) {

    console.log(JSON.stringify({

        level,

        timestamp: new Date().toISOString(),

        message,

        ...meta

    }));

}

export default {

    info(message, meta = {}) {

        write(levels.info, message, meta);

    },

    warn(message, meta = {}) {

        write(levels.warn, message, meta);

    },

    error(message, meta = {}) {

        write(levels.error, message, meta);

    },

    debug(message, meta = {}) {

        if (process.env.NODE_ENV !== "production") {

            write(levels.debug, message, meta);

        }

    },

    audit(message, meta = {}) {

        write(levels.audit, message, meta);

    }

};
