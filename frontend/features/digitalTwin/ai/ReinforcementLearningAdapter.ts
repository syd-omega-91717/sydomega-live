// ============================================================================
// FILE:
// /frontend/features/digitalTwin/ai/ReinforcementLearningAdapter.ts
// ============================================================================

export interface Experience{

    state:any;

    action:any;

    reward:number;

}

export class ReinforcementLearningAdapter{

    train(

        experiences:Experience[]

    ){

        return{

            trained:true,

            samples:

            experiences.length

        };

    }

}
