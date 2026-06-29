// ============================================================================
// FILE: /backend/src/kernel/config/config.service.ts
// NEW FILE
// ============================================================================

export interface ConfigService {

    get(key: string): string;

    getNumber(key: string): number;

    getBoolean(key: string): boolean;

}
