// ============================================================================
// FILE: /backend/src/app.js
// NEW FILE
// ============================================================================

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import dashboardRoutes from "./routes/dashboard.js";
import academyRoutes from "./routes/academy.js";
import consultancyRoutes from "./routes/consultancy.js";
import publishingRoutes from "./routes/publishing.js";
import searchRoutes from "./routes/search.js";
import aiRoutes from "./routes/ai.js";
import accessRoutes from "./routes/access.js";
import approvalRoutes from "./routes/approvals.js";
import notificationRoutes from "./routes/notifications.js";
import founderDashboardRoutes from "./routes/founderDashboard.js";

const app = express();

app.disable("x-powered-by");

app.set("trust proxy", 1);

app.use(cors());

app.use(
    helmet({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: false
    })
);

app.use(compression());

app.use(
    express.json({
        limit: "25mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "25mb"
    })
);

app.use(morgan("combined"));

app.get("/", (req, res) => {

    res.json({

        system: "Ω SYD OMEGA 91717",

        version: "1.1.0",

        status: "ONLINE",

        environment: process.env.NODE_ENV || "development",

        uptime: process.uptime(),

        timestamp: new Date()

    });

});

app.get("/health", (req, res) => {

    res.json({

        success: true,

        backend: "ONLINE",

        api: "ONLINE",

        timestamp: new Date()

    });

});

app.get("/ready", (req, res) => {

    res.json({

        ready: true,

        timestamp: new Date()

    });

});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/academy", academyRoutes);
app.use("/api/consultancy", consultancyRoutes);
app.use("/api/publishing", publishingRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/access", accessRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/founder", founderDashboardRoutes);

app.use((req, res) => {

    res.status(404).json({

        success: false,

        message: "Endpoint not found."

    });

});

app.use((err, req, res, next) => {

    console.error(err);

    res.status(err.status || 500).json({

        success: false,

        message: err.message || "Internal Server Error"

    });

});

export default app;
