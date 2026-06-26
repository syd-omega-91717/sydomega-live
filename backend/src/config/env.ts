import dotenv from "dotenv";

dotenv.config();

export const env = {

    NODE_ENV: process.env.NODE_ENV || "development",

    PORT: Number(process.env.PORT || 3000),

    SUPABASE_URL: process.env.SUPABASE_URL || "",

    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",

    JWT_SECRET: process.env.JWT_SECRET || "",

    OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",

    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",

    GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",

    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || "",

    OLLAMA_URL: process.env.OLLAMA_URL || "http://localhost:11434"

};

export default env;
