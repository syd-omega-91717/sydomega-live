// ============================================================================
// FILE: /backend/src/server.js
// REPLACE THE ENTIRE FILE
// ============================================================================

import dotenv from "dotenv";
import http from "http";
import app from "./app.js";

dotenv.config();

const PORT = Number(process.env.PORT || 3000);

const server = http.createServer(app);

server.listen(PORT, () => {

    console.log("====================================");
    console.log("Ω SYD OMEGA 91717");
    console.log("Backend Running");
    console.log("Port:", PORT);
    console.log("Environment:", process.env.NODE_ENV || "development");
    console.log("====================================");

});

process.on("SIGTERM", () => {

    console.log("SIGTERM received.");

    server.close(() => {

        process.exit(0);

    });

});

process.on("SIGINT", () => {

    console.log("SIGINT received.");

    server.close(() => {

        process.exit(0);

    });

});

process.on("unhandledRejection", err => {

    console.error(err);

});

process.on("uncaughtException", err => {

    console.error(err);

});
