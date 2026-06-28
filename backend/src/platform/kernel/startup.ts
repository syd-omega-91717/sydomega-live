// ============================================================================
// FILE: /backend/src/platform/kernel/startup.ts
// NEW FILE
// ============================================================================

import kernel from "./platform.js";

import logger from "../observability/logger.js";

import database from "../../database/database.js";

export async function startup() {

    kernel.register({

        name: "Logger",

        async initialize() {

            logger.info(

                "Logger initialized."

            );

        },

        async shutdown() {}

    });

    kernel.register({

        name: "Database",

        async initialize() {

            await database

                .table("profiles")

                .select("id")

                .limit(1);

        },

        async shutdown() {}

    });

}
