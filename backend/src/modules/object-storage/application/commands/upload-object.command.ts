// ============================================================================
// FILE: /backend/src/modules/object-storage/application/commands/upload-object.command.ts
// NEW FILE
// ============================================================================

export class UploadObjectCommand{

    constructor(

        readonly bucket:string,

        readonly objectKey:string,

        readonly contentLength:number

    ){}

}
