// ============================================================================
// FILE: /backend/src/database/health.ts
// NEW FILE
// ============================================================================

import database from "./database.js";

export async function databaseHealth() {

    try {

        const {

            error

        } = await database

            .table("profiles")

            .select("id")

            .limit(1);

        if (error) {

            return {

                healthy: false,

                message: error.message

            };

        }

        return {

            healthy: true,

            message: "Database Online"

        };

    }

    catch (error) {

        return {

            healthy: false,

            message:

                error instanceof Error

                    ? error.message

                    : "Unknown database error"

        };

    }

}
