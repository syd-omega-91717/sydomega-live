// ============================================================================
// FILE: /backend/src/modules/notification/domain/entities/template.ts
// NEW FILE
// ============================================================================

export class Template{

    constructor(

        readonly templateId:string,

        readonly name:string,

        readonly language:string,

        readonly version:string,

        readonly active:boolean

    ){}

}
