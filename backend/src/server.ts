// ============================================================================
// FILE: /backend/src/server.ts
// Ω SYD OMEGA 91717
// Enterprise Backend Bootstrap
// ============================================================================

import dotenv from "dotenv";
import http from "node:http";

import app from "./app.js";
import { startAccessScheduler } from "./scheduler/access.scheduler.js";

dotenv.config();

const PORT = Number.parseInt(process.env.PORT ?? "3000", 10);

const server = http.createServer(app);

async function bootstrap(): Promise<void> {

    try {

        await Promise.resolve(startAccessScheduler());

        server.listen(PORT, () => {

            console.log(`
==================================================
Ω SYD OMEGA 91717 Enterprise Backend
==================================================
Environment : ${process.env.NODE_ENV ?? "development"}
Port        : ${PORT}
PID         : ${process.pid}
Status      : ONLINE
==================================================
`);

        });

    } catch (error) {

        console.error("Bootstrap failed.");
        console.error(error);

        process.exit(1);

    }

}

bootstrap();

async function gracefulShutdown(signal: string): Promise<void> {

    console.log(`${signal} received. Starting graceful shutdown...`);

    server.close(() => {

        console.log("HTTP server stopped.");

        process.exit(0);

    });

}

process.on("SIGINT", () => {

    void gracefulShutdown("SIGINT");

});

process.on("SIGTERM", () => {

    void gracefulShutdown("SIGTERM");

});

process.on("unhandledRejection", reason => {

    console.error("Unhandled Promise Rejection");
    console.error(reason);

});

process.on("uncaughtException", error => {

    console.error("Uncaught Exception");
    console.error(error);

    process.exit(1);

});
