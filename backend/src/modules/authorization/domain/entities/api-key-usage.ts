// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/api-key-usage.ts
// NEW FILE
// ============================================================================

export class ApiKeyUsage{

    constructor(

        readonly apiKeyId:string,

        readonly requestCount:number,

        readonly lastUsedAt:Date|null,

        readonly lastIpAddress:string|null

    ){}

}
