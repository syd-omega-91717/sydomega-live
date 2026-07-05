// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/SceneValidator.ts
// ============================================================================

export interface ValidationIssue{

    assetId:string;

    message:string;

}

export class SceneValidator{

    validate(

        assets:any[]

    ){

        const issues:ValidationIssue[]=[];

        assets.forEach(asset=>{

            if(!asset.id){

                issues.push({

                    assetId:"UNKNOWN",

                    message:"Missing asset id"

                });

            }

        });

        return issues;

    }

}
