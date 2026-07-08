// ============================================================================
// FILE:
// /enterprise/intelligence/DashboardEngine.ts
// ============================================================================

import { Dashboard } from "./Dashboard";

export class DashboardEngine{

    publish(

        dashboard:Dashboard

    ){

        dashboard.published=true;

        return dashboard;

    }

}
