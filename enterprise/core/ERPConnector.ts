// ============================================================================
// ENTERPRISE CORE EC-001
// FILE:
// /enterprise/core/ERPConnector.ts
// ============================================================================

export interface ERPConnector{

    id:string;

    vendor:string;

    version:string;

    connected:boolean;

    connect():Promise<boolean>;

    disconnect():Promise<boolean>;

    synchronize():Promise<void>;

}
