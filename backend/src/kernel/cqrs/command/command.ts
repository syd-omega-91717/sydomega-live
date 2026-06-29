// ============================================================================
// FILE: /backend/src/kernel/cqrs/command/command.ts
// NEW FILE
// ============================================================================

export interface Command{

    readonly correlationId:string;

    readonly timestamp:Date;

}
