// ============================================================================
// FILE: /backend/src/modules/oidc/presentation/routes/oidc.routes.ts
// NEW FILE
// ============================================================================

GET     /.well-known/openid-configuration

GET     /.well-known/jwks.json

GET     /connect/authorize

POST    /connect/token

GET     /connect/userinfo

POST    /connect/logout

GET     /connect/check-session

GET     /connect/end-session-callback
