// ============================================================================
// FILE: /backend/src/platform/context/context.store.ts
// NEW FILE
// ============================================================================

import { AsyncLocalStorage } from "node:async_hooks";

import type { RequestContext } from "./request-context.js";

class ContextStore {

    private readonly storage =

        new AsyncLocalStorage<RequestContext>();

    public run<T>(

        context: RequestContext,

        callback: () => T

    ): T {

        return this.storage.run(

            context,

            callback

        );

    }

    public current(): RequestContext {

        const context =

            this.storage.getStore();

        if (!context) {

            throw new Error(

                "Request context unavailable."

            );

        }

        return context;

    }

}

export default new ContextStore();
