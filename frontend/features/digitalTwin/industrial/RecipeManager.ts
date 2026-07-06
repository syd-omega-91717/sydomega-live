// ============================================================================
// FILE:
// /frontend/features/digitalTwin/industrial/RecipeManager.ts
// ============================================================================

export interface Recipe{

    id:string;

    name:string;

    parameters:Record<string,number>;

}

export class RecipeManager{

    private recipes:Recipe[]=[];

    save(recipe:Recipe){

        this.recipes.push(recipe);

    }

    all(){

        return this.recipes;

    }

}
