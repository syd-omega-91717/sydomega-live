// ============================================================================
// FILE: /backend/src/ai/providers/providers/openai.provider.js
// ============================================================================

import BaseProvider from "./base.provider.js";

export default class OpenAIProvider extends BaseProvider{

    constructor(){

        super();

        this.name="openai";

    }

    async chat(request){

        // integrate official SDK

        return {

            provider:this.name,

            model:request.model,

            content:""

        };

    }

}
