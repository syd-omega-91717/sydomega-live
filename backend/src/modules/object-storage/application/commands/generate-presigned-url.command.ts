// ============================================================================
// FILE: /backend/src/modules/object-storage/application/commands/generate-presigned-url.command.ts
// NEW FILE
// ============================================================================

export class GeneratePresignedUrlCommand{

    constructor(

        readonly objectKey:string,

        readonly expiresIn:number

    ){}

}
