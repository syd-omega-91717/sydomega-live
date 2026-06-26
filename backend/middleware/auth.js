import jwt from "jsonwebtoken";
import env from "../config/env.js";

export default function authenticate(req, res, next) {

    const header = req.headers.authorization;

    if (!header) {

        return res.status(401).json({

            success: false,

            message: "Missing Authorization Header"

        });

    }

    const token = header.replace("Bearer ", "");

    try {

        req.user = jwt.verify(token, env.JWT_SECRET);

        next();

    } catch {

        return res.status(401).json({

            success: false,

            message: "Invalid Token"

        });

    }

}
