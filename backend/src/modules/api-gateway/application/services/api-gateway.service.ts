// ============================================================================
// FILE: /backend/src/modules/api-gateway/application/services/api-gateway.service.ts
// NEW FILE
// ============================================================================

export interface ApiGatewayService{

    authenticate():Promise<void>;

    authorize():Promise<void>;

    route():Promise<void>;

    throttle():Promise<void>;

}
