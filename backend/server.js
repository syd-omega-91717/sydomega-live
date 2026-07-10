// ============================================================================
// FILE: backend/server.js
// Ω SYD OMEGA 91717
// Enterprise Server Bootstrap
// ============================================================================

import express from "express";
import cors from "cors";

import env from "./config/env.js";

import logger from "./middleware/logger.js";
import limiter from "./middleware/rateLimiter.js";
import errorHandler from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.js";
import systemRoutes from "./routes/system.js";
import enterpriseRoutes from "./routes/enterprise.js";
import aiRoutes from "./routes/ai.js";

const app = express();

app.use(cors());

app.use(express.json());

app.use(logger);

app.use(limiter);

app.use("/api/system", systemRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/enterprise", enterpriseRoutes);

app.use("/api/ai", aiRoutes);

app.use(errorHandler);

app.listen(env.PORT, () => {

    console.log(`Ω SYD OMEGA 91717 Backend running on port ${env.PORT}`);

});
