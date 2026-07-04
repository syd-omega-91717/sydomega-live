// ============================================================================
// FILE:
// /frontend/features/iot/components/DeviceTable.tsx
// ============================================================================

import EnterpriseTable
from "@/components/ui/Table";

export default function DeviceTable(){

    return(

        <EnterpriseTable

            columns={[

                "Device",

                "Status",

                "Health"

            ]}

            rows={[

                {

                    Device:"Sensor-1",

                    Status:"Online",

                    Health:"99%"

                }

            ]}

        />

    );

}
