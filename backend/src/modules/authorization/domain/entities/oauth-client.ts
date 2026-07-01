// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/oauth-client.ts
// NEW FILE
// ============================================================================

import { OAuthClientId }
from "../value-objects/oauth-client-id";

import { OAuthClientType }
from "../enums/oauth-client-type";

import { OAuthGrantType }
from "../enums/oauth-grant-type";

export class OAuthClient{

    constructor(

        readonly id:OAuthClientId,

        readonly clientId:string,

        readonly clientName:string,

        readonly clientType:OAuthClientType,

        readonly grantTypes:OAuthGrantType[],

        readonly redirectUris:string[],

        readonly scopes:string[],

        readonly enabled:boolean

    ){}

}
