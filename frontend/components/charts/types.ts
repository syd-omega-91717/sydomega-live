// ============================================================================
// FILE:
// /frontend/components/charts/types.ts
// ============================================================================

export interface ChartSeries {

    id: string;

    name: string;

    color: string;

    values: number[];

}

export interface ChartPoint {

    label: string;

    value: number;

}

export interface TimeSeriesPoint {

    timestamp: string;

    value: number;

}

export interface BaseChartProps {

    title?: string;

    height?: number;

    loading?: boolean;

}
