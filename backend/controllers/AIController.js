// ============================================================================
// FILE: backend/controllers/AIController.js
// Ω SYD OMEGA 91717
// Enterprise AI Controller
// ============================================================================

import AISystemService from "../services/ai/AISystemService.js";

export async function chat(req, res, next) {

    try {

        const {

            provider = "claude",

            prompt,

            context = {},

            options = {}

        } = req.body;

        const response = await AISystemService.chat(provider, {

            prompt,

            context,

            options

        });

        return res.json({

            success: true,

            provider,

            response

        });

    }

    catch (error) {

        next(error);

    }

}

export async function providers(req, res) {

    return res.json({

        success: true,

        providers: AISystemService.providers()

    });

}
