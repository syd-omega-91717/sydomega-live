import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import dotenv from "dotenv";

import accessRouter from "./routes/access";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import dashboardRoutes from "./routes/dashboard.js";
import academyRoutes from "./routes/academy.js";
import consultancyRoutes from "./routes/consultancy.js";
import publishingRoutes from "./routes/publishing.js";
import searchRoutes from "./routes/search.js";
import aiRoutes from "./routes/ai.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json({limit:"25mb"}));
app.use(express.urlencoded({extended:true}));
app.use(morgan("combined"));

app.get("/",(req,res)=>{

    res.json({

        system:"Ω SYD OMEGA 91717",

        version:"1.0.0",

        status:"ONLINE"

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
app.use("/api/access", accessRouter);

const PORT=process.env.PORT||3000;

app.listen(PORT,()=>{

    console.log("Ω Backend Running on Port",PORT);

});
