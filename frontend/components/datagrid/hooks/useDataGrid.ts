// ============================================================================
// FILE:
// /frontend/components/datagrid/hooks/useDataGrid.ts
// ============================================================================

'use client';

import { useMemo, useState } from "react";

import {

    FilterState,

    SortState

} from "../types";

export function useDataGrid() {

    const [search, setSearch] = useState("");

    const [filters, setFilters] =

        useState<FilterState[]>([]);

    const [sort, setSort] =

        useState<SortState>();

    const [selectedRows, setSelectedRows] =

        useState<unknown[]>([]);

    const state = useMemo(

        () => ({

            search,

            filters,

            sort,

            selectedRows

        }),

        [

            search,

            filters,

            sort,

            selectedRows

        ]

    );

    function addFilter(filter: FilterState) {

        setFilters(previous => [

            ...previous,

            filter

        ]);

    }

    function removeFilter(field: string) {

        setFilters(previous =>

            previous.filter(

                filter => filter.field !== field

            )

        );

    }

    function clearSelection() {

        setSelectedRows([]);

    }

    return {

        state,

        search,

        filters,

        sort,

        selectedRows,

        setSearch,

        setSort,

        setSelectedRows,

        addFilter,

        removeFilter,

        clearSelection

    };

}
