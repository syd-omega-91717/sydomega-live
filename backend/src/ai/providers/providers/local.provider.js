// ============================================================================
// FILE: /backend/src/ai/providers/providers/local.provider.js
// ============================================================================

import BaseProvider from "./base.provider.js";

export default class LocalProvider extends BaseProvider{

    constructor(){

        super();

        this.name="local";

    }

    async chat(request){

        return{

            provider:this.name,

            model:request.model,

            content:""

        };

    }

}
