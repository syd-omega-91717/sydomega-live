// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/create-access-review.command.ts
// NEW FILE
// ============================================================================

export class CreateAccessReviewCommand{

    constructor(

        readonly name:string,

        readonly reviewerId:string,

        readonly dueDate:Date

    ){}

}
