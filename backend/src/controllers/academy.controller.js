// ============================================================================
// FILE: /backend/src/controllers/academy.controller.js
// ============================================================================

import * as Academy from "../services/academy.service.js";

export async function dashboard(req,res){

    try{

        res.json({

            success:true,

            data:await Academy.dashboard(req.user.id)

        });

    }

    catch(error){

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

}

export async function enroll(req,res){

    try{

        const enrollment=await Academy.enroll(

            req.user.id,

            req.params.courseId

        );

        res.json({

            success:true,

            enrollment

        });

    }

    catch(error){

        res.status(400).json({

            success:false,

            message:error.message

        });

    }

}

export async function completeLesson(req,res){

    try{

        await Academy.completeLesson(

            req.user.id,

            req.params.lessonId

        );

        res.json({

            success:true

        });

    }

    catch(error){

        res.status(400).json({

            success:false,

            message:error.message

        });

    }

}
