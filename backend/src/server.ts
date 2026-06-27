// ============================================================================
// FILE: /backend/src/server.js
// REPLACE THE ENTIRE FILE
// ============================================================================

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import dotenv from "dotenv";

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

import { expireAll } from "./services/access.service.js";

dotenv.config();

const app = express();

app.disable("x-powered-by");

app.use(cors());

app.use(helmet({

    crossOriginEmbedderPolicy:false,

    contentSecurityPolicy:false

}));

app.use(compression());

app.use(express.json({

    limit:"25mb"

}));

app.use(express.urlencoded({

    extended:true,

    limit:"25mb"

}));

app.use(morgan("combined"));

app.get("/",(req,res)=>{

    res.json({

        system:"Ω SYD OMEGA 91717",

        version:"1.1.0",

        environment:process.env.NODE_ENV,

        status:"ONLINE",

        uptime:process.uptime(),

        timestamp:new Date()

    });

});

app.get("/health",(req,res)=>{

    res.json({

        success:true,

        database:"ONLINE",

        backend:"ONLINE",

        api:"ONLINE",

        timestamp:new Date()

    });

});

app.use("/api/auth",authRoutes);

app.use("/api/profile",profileRoutes);

app.use("/api/dashboard",dashboardRoutes);

app.use("/api/academy",academyRoutes);

app.use("/api/consultancy",consultancyRoutes);

app.use("/api/publishing",publishingRoutes);

app.use("/api/search",searchRoutes);

app.use("/api/ai",aiRoutes);

app.use("/api/access",accessRoutes);

app.use("/api/approvals",approvalRoutes);

app.use("/api/notifications",notificationRoutes);

app.use("/api/founder",founderDashboardRoutes);

setInterval(async()=>{

    try{

        await expireAll();

    }

    catch(err){

        console.error(err);

    }

},60000);

app.use((req,res)=>{

    res.status(404).json({

        success:false,

        message:"Endpoint not found."

    });

});

app.use((err,req,res,next)=>{

    console.error(err);

    res.status(500).json({

        success:false,

        message:err.message

    });

});

const PORT=process.env.PORT||3000;

app.listen(PORT,()=>{

    console.log("");

    console.log("====================================");

    console.log("Ω SYD OMEGA 91717");

    console.log("Backend Running");

    console.log("Port:",PORT);

    console.log("====================================");

});
