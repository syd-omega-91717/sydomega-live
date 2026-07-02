// ============================================================================
// FILE: /backend/src/modules/compliance/domain/entities/dashboard-widget.ts
// NEW FILE
// ============================================================================

import { DashboardWidgetType }
from "../enums/dashboard-widget-type";

export class DashboardWidget{

    constructor(

        readonly widgetId:string,

        readonly type:DashboardWidgetType,

        readonly title:string,

        readonly position:number,

        readonly enabled:boolean

    ){}

}
