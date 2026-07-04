// ============================================================================
// FILE:
// /frontend/components/datagrid/types.ts
// ============================================================================

import { ReactNode } from "react";

export type DataGridAlignment =
    | "left"
    | "center"
    | "right";

export interface DataGridColumn<T> {

    id: string;

    title: string;

    width?: number | string;

    sortable?: boolean;

    searchable?: boolean;

    align?: DataGridAlignment;

    render: (row: T) => ReactNode;

}

export interface PaginationState {

    page: number;

    pageSize: number;

    totalItems: number;

    totalPages: number;

}

export interface DataGridProps<T> {

    rows: T[];

    loading?: boolean;

    columns: DataGridColumn<T>[];

    pagination?: PaginationState;

    selectable?: boolean;

    emptyMessage?: string;

    onRefresh?: () => void;

}
