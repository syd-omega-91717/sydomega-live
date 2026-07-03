// ============================================================================
// FILE: /backend/src/modules/event-bus/domain/entities/schema-definition.ts
// NEW FILE
// ============================================================================

import { MessageFormat }
from "../enums/message-format";

export class SchemaDefinition{

    constructor(

        readonly schemaId:string,

        readonly subject:string,

        readonly version:number,

        readonly format:MessageFormat

    ){}

}
