// ============================================================================
// FILE:
// /mobile/lib/core/security/secure_storage.dart
// ============================================================================

abstract class SecureStorage{

    Future store();

    Future read();

    Future remove();

    Future wipe();

}
