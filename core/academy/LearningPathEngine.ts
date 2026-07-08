// ============================================================================
// FILE:
// /core/academy/LearningPathEngine.ts
// ============================================================================

export class LearningPathEngine{

    build(

        userId:string,

        interests:string[]

    ){

        return{

            userId,

            interests,

            generatedAt:Date.now()

        };

    }

}
