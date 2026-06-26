import dotenv from "dotenv";

dotenv.config();

export default{

PORT:process.env.PORT,

SUPABASE_URL:process.env.SUPABASE_URL,

SUPABASE_SERVICE_ROLE:process.env.SUPABASE_SERVICE_ROLE,

JWT_SECRET:process.env.JWT_SECRET,

OPENAI_KEY:process.env.OPENAI_KEY,

CLAUDE_KEY:process.env.CLAUDE_KEY,

GEMINI_KEY:process.env.GEMINI_KEY

};
