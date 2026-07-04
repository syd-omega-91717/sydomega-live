// ============================================================================
// FILE:
// /frontend/types/analytics.ts
// ============================================================================

export interface KPI{

    id:string;

    title:string;

    value:number|string;

    unit?:string;

    trend:number;

    previousValue:number;

}

export interface DashboardMetric{

    timestamp:string;

    value:number;

}
