// ============================================================================
// FILE: /backend/src/ai/providers/providers/gemini.provider.js
// ============================================================================

import BaseProvider from "./base.provider.js";

export default class GeminiProvider extends BaseProvider{

    constructor(){

        super();

        this.name="gemini";

    }

    async chat(request){

        return{

            provider:this.name,

            model:request.model,

            content:""

        };

    }

}
