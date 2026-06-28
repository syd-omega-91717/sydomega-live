// ============================================================================
// FILE: /backend/src/core/Application.ts
// NEW FILE
// ============================================================================

import express, { Application as ExpressApplication } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

import env from "../config/env.js";
import logger from "../config/logger.js";

import requestId from "../middleware/requestId.js";
import audit from "../middleware/audit.js";
import rateLimiter from "../middleware/rateLimiter.js";
import notFound from "../middleware/notFound.js";
import errorHandler from "../middleware/errorHandler.js";

import container from "./Container.js";
import eventBus from "./EventBus.js";

export class Application {

    private readonly app: ExpressApplication;

    private initialized = false;

    constructor() {

        this.app = express();

    }

    /**
     * Boot application.
     */
    public async initialize(): Promise<void> {

        if (this.initialized) {

            return;

        }

        this.registerCore();

        this.registerMiddleware();

        await this.registerInfrastructure();

        await this.registerModules();

        this.registerRoutes();

        this.registerErrorHandlers();

        this.initialized = true;

        logger.info({

            event: "APPLICATION_INITIALIZED"

        });

    }

    /**
     * Express instance.
     */
    public express(): ExpressApplication {

        return this.app;

    }

    /**
     * Start HTTP server.
     */
    public async start(): Promise<void> {

        await this.initialize();

        this.app.listen(

            env.PORT,

            () => {

                logger.info({

                    system: "Ω SYD OMEGA 91717",

                    version: "RC3.1",

                    port: env.PORT,

                    environment: env.NODE_ENV

                });

            }

        );

    }

    /**
     * Register container services.
     */
    private registerCore(): void {

        container.singleton(

            "EventBus",

            () => eventBus

        );

        container.singleton(

            "Logger",

            () => logger

        );

    }

    /**
     * Global middleware.
     */
    private registerMiddleware(): void {

        this.app.disable("x-powered-by");

        this.app.use(cors());

        this.app.use(

            helmet({

                contentSecurityPolicy: false,

                crossOriginEmbedderPolicy: false

            })

        );

        this.app.use(compression());

        this.app.use(express.json({

            limit: "25mb"

        }));

        this.app.use(express.urlencoded({

            extended: true,

            limit: "25mb"

        }));

        this.app.use(morgan("combined"));

        this.app.use(requestId);

        this.app.use(audit);

        this.app.use(rateLimiter);

    }

    /**
     * Infrastructure bootstrap.
     */
    private async registerInfrastructure(): Promise<void> {

        logger.info({

            bootstrap: "Infrastructure"

        });

        // Future:
        //
        // Database
        // Redis
        // Queue
        // WebSocket
        // Storage
        // Scheduler
        // Monitoring
        // AI Runtime

    }

    /**
     * Register feature modules.
     */
    private async registerModules(): Promise<void> {

        logger.info({

            bootstrap: "Modules"

        });

        // Future modules:
        //
        // Authentication
        // Profile
        // Approval
        // Organization
        // Academy
        // Consultancy
        // Publishing
        // Marketplace
        // Wallet
        // AI
        // Analytics

    }

    /**
     * Register routes.
     */
    private registerRoutes(): void {

        this.app.get(

            "/",

            (_req, res) => {

                res.json({

                    system: "Ω SYD OMEGA 91717",

                    release: "RC3.1",

                    status: "ONLINE",

                    uptime: process.uptime(),

                    timestamp: new Date()

                });

            }

        );

        this.app.get(

            "/health",

            (_req, res) => {

                res.json({

                    success: true,

                    status: "HEALTHY",

                    uptime: process.uptime(),

                    timestamp: new Date()

                });

            }

        );

        /*
         *
         * Feature route registration
         * will occur here.
         *
         */

    }

    /**
     * Global handlers.
     */
    private registerErrorHandlers(): void {

        this.app.use(notFound);

        this.app.use(errorHandler);

    }

}

export default new Application();
