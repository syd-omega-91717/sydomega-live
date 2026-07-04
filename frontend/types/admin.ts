// ============================================================================
// FILE:
// /frontend/types/admin.ts
// ============================================================================

export interface User{

    id:string;

    username:string;

    firstName:string;

    lastName:string;

    email:string;

    enabled:boolean;

    roles:string[];

}

export interface Role{

    id:string;

    name:string;

    permissions:string[];

}

export interface Organization{

    id:string;

    name:string;

    parentId?:string;

}
