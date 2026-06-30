// ============================================================================
// FILE: /backend/src/modules/identity/presentation/routes/identity-admin.routes.ts
// NEW FILE
// ============================================================================

POST    /identity/admin/users/{id}/lock

POST    /identity/admin/users/{id}/unlock

POST    /identity/admin/users/{id}/suspend

POST    /identity/admin/users/{id}/activate

POST    /identity/admin/users/{id}/disable

POST    /identity/admin/users/{id}/reset-password

POST    /identity/admin/users/{id}/reset-mfa

POST    /identity/admin/users/{id}/revoke-sessions
