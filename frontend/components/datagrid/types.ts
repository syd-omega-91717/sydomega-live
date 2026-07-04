// ============================================================================
// FILE:
// /frontend/components/datagrid/types.ts
// ============================================================================

import { ReactNode } from "react";

export type DataGridAlignment =
    | "left"
    | "center"
    | "right";

export type SortDirection =
    | "asc"
    | "desc";

export interface DataGridColumn<T>{

    id:string;

    title:string;

    width?:number|string;

    sortable?:boolean;

    searchable?:boolean;

    resizable?:boolean;

    hidden?:boolean;

    align?:DataGridAlignment;

    render:(row:T)=>ReactNode;

}

export interface PaginationState{

    page:number;

    pageSize:number;

    totalItems:number;

    totalPages:number;

}

export interface SortState{

    field:string;

    direction:SortDirection;

}

export interface FilterState{

    field:string;

    value:string;

}

export interface DataGridProps<T>{

    rows:T[];

    columns:DataGridColumn<T>[];

    loading?:boolean;

    selectable?:boolean;

    pagination?:PaginationState;

    sort?:SortState;

    filters?:FilterState[];

    emptyMessage?:string;

    onRefresh?:()=>void;

    onSort?:(field:string)=>void;

    onSelect?:(rows:T[])=>void;

}
