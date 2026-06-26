import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

import healthRouter from "./routes/health";
import authRouter from "./routes/auth";
import projectsRouter from "./routes/projects";
import tasksRouter from "./routes/tasks";
import aiRouter from "./routes/ai";
import storageRouter from "./routes/storage";
import searchRouter from "./routes/search";
import webhookRouter from "./routes/webhooks";

const app = express();

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));

app.get("/", (_, res) => {

    res.json({

        system: "Ω SYD OMEGA 91717",

        version: "1.0.0",

        status: "ONLINE"

    });

});

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/ai", aiRouter);
app.use("/api/storage", storageRouter);
app.use("/api/search", searchRouter);
app.use("/api/webhooks", webhookRouter);

export default app;
