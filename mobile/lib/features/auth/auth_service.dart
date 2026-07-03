// ============================================================================
// FILE:
// /mobile/lib/features/auth/auth_service.dart
// ============================================================================

abstract class AuthenticationService{

    Future login();

    Future logout();

    Future refreshToken();

    Future biometricLogin();

    Future registerDevice();

}
