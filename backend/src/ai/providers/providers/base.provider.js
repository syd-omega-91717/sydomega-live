// ============================================================================
// FILE: /backend/src/ai/providers/providers/base.provider.js
// ============================================================================

export default class BaseProvider{

    constructor(){

        this.name="base";

    }

    async chat(){

        throw new Error(

            "chat() not implemented."

        );

    }

    async embeddings(){

        throw new Error(

            "embeddings() not implemented."

        );

    }

}
