// ============================================================================
// FILE: /backend/src/platform/kernel/lifecycle.ts
// NEW FILE
// ============================================================================

import kernel from "./platform.js";

export function registerLifecycle() {

    process.on(

        "SIGINT",

        async () => {

            console.log(

                "Stopping Platform..."

            );

            await kernel.shutdown();

            process.exit(0);

        }

    );

    process.on(

        "SIGTERM",

        async () => {

            console.log(

                "Stopping Platform..."

            );

            await kernel.shutdown();

            process.exit(0);

        }

    );

}
