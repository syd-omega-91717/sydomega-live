// ============================================================================
// FILE:
// /frontend/types/api.ts
// ============================================================================

export interface ApiResponse<T>{

    success:boolean;

    data:T;

    message:string;

    timestamp:string;

}

export interface Pagination{

    page:number;

    size:number;

    total:number;

    pages:number;

}

export interface PaginatedResponse<T>{

    items:T[];

    pagination:Pagination;

}
