// ============================================================================
// FILE: /backend/src/ai/providers/providers/anthropic.provider.js
// ============================================================================

import BaseProvider from "./base.provider.js";

export default class AnthropicProvider extends BaseProvider{

    constructor(){

        super();

        this.name="anthropic";

    }

    async chat(request){

        return{

            provider:this.name,

            model:request.model,

            content:""

        };

    }

}
