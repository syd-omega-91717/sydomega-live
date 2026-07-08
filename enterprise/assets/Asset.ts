// ============================================================================
// ENTERPRISE CORE EC-005
// FILE:
// /enterprise/assets/Asset.ts
// ============================================================================

export interface Asset{

    id:string;

    code:string;

    name:string;

    category:string;

    manufacturer:string;

    model:string;

    serialNumber:string;

    facilityId:string;

    location:string;

    status:string;

    purchaseDate:number;

    warrantyUntil:number;

    createdAt:number;

}
