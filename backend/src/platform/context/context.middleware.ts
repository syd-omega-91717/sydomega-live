// ============================================================================
// FILE: /backend/src/platform/context/context.middleware.ts
// NEW FILE
// ============================================================================

import {

    Request,

    Response,

    NextFunction

} from "express";

import contextFactory from "./request-context.js";

import contextStore from "./context.store.js";

export function contextMiddleware(

    req: Request,

    res: Response,

    next: NextFunction

) {

    const context =

        contextFactory.create();

    context.ip = req.ip;

    context.userAgent =

        req.headers["user-agent"];

    context.language =

        req.headers["accept-language"];

    contextStore.run(

        context,

        () => next()

    );

}
