// ============================================================================
// FILE: /backend/src/server.js
// REPLACE THE ENTIRE FILE
// ============================================================================

import dotenv from "dotenv";
import http from "http";

import app from "./app.js";

import { startAccessScheduler } from "./scheduler/access.scheduler.js";

dotenv.config();

const PORT = Number(process.env.PORT || 3000);

const server = http.createServer(app);

startAccessScheduler();

server.listen(PORT, () => {

    console.log("");
    console.log("==================================================");
    console.log("Ω SYD OMEGA 91717");
    console.log("Backend Started Successfully");
    console.log("Environment :", process.env.NODE_ENV || "development");
    console.log("Port        :", PORT);
    console.log("PID         :", process.pid);
    console.log("==================================================");
    console.log("");

});

async function shutdown(signal) {

    console.log(`${signal} received.`);

    server.close(() => {

        console.log("HTTP Server Closed.");

        process.exit(0);

    });

}

process.on("SIGINT", () => shutdown("SIGINT"));

process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", error => {

    console.error("Unhandled Promise Rejection");
    console.error(error);

});

process.on("uncaughtException", error => {

    console.error("Uncaught Exception");
    console.error(error);

});
