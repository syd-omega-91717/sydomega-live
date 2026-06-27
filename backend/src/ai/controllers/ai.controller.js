// ============================================================================
// FILE: /backend/src/ai/controllers/ai.controller.js
// ============================================================================

import AI from "../orchestrator/AIOrchestrator.js";

export async function chat(req,res){

    try{

        const answer=await AI.chat({

            userId:req.user.id,

            conversationId:req.body.conversationId,

            prompt:req.body.prompt,

            provider:req.body.provider,

            model:req.body.model

        });

        res.json({

            success:true,

            answer

        });

    }

    catch(error){

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

}
