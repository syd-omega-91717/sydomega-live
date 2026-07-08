// ============================================================================
// FILE:
// /core/ai/MemoryEngine.ts
// ============================================================================

export class MemoryEngine{

    private readonly memory=

    new Map<string,unknown>();

    store(

        key:string,

        value:unknown

    ){

        this.memory.set(

            key,

            value

        );

    }

    recall(

        key:string

    ){

        return this.memory.get(key);

    }

}
