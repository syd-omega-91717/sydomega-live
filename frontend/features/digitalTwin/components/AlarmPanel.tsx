// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/AlarmPanel.tsx
// ============================================================================

'use client';

import {

useAlarmMonitor

}

from "../hooks/useAlarmMonitor";

import {

useAlarmStore

}

from "../store/alarmStore";

export default function AlarmPanel(){

    useAlarmMonitor();

    const alarms=

    useAlarmStore(

        s=>s.alarms

    );

    return(

        <section>

            <h3>

                Active Alarms

            </h3>

            {

                alarms.map(

                    (alarm:any)=>(

                        <div

                            key={alarm.id}

                        >

                            [

                            {alarm.severity}

                            ]

                            {" "}

                            {alarm.message}

                        </div>

                    )

                )

            }

        </section>

    );

}
