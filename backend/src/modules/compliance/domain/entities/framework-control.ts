// ============================================================================
// FILE: /backend/src/modules/compliance/domain/entities/framework-control.ts
// NEW FILE
// ============================================================================

import { FrameworkFamily }
from "../enums/framework-family";

export class FrameworkControl{

    constructor(

        readonly framework:FrameworkFamily,

        readonly controlId:string,

        readonly title:string,

        readonly domain:string,

        readonly version:string

    ){}

}
