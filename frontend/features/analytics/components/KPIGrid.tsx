// ============================================================================
// FILE:
// /frontend/features/analytics/components/KPIGrid.tsx
// ============================================================================

'use client';

import KPICard from "./KPICard";

const metrics=[

{

id:"users",

title:"Users",

value:15280,

trend:6,

previousValue:14400

},

{

id:"organizations",

title:"Organizations",

value:842,

trend:2,

previousValue:825

},

{

id:"devices",

title:"Devices",

value:62104,

trend:13,

previousValue:55000

},

{

id:"ai",

title:"AI Requests",

value:4300213,

trend:18,

previousValue:3640000

}

];

export default function KPIGrid(){

    return(

        <div className="omega-kpi-grid">

            {

                metrics.map(

                    metric=>

                    <KPICard

                        key={metric.id}

                        metric={metric}

                    />

                )

            }

        </div>

    );

}
