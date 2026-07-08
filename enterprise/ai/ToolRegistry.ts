// ============================================================================
// FILE:
// /enterprise/ai/ToolRegistry.ts
// ============================================================================

import { ToolDefinition } from "./ToolDefinition";

export class ToolRegistry{

    private readonly registry=

    new Map<string,ToolDefinition>();

    register(

        tool:ToolDefinition

    ){

        this.registry.set(

            tool.id,

            tool

        );

    }

    resolve(

        id:string

    ){

        return this.registry.get(id);

    }

}
