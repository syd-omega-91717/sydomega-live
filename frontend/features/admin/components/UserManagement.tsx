// ============================================================================
// FILE:
// /frontend/features/admin/components/UserManagement.tsx
// ============================================================================

'use client';

import EnterpriseCard from "@/components/ui/Card";
import EnterpriseTable from "@/components/ui/Table";

export default function UserManagement(){

    return(

        <EnterpriseCard title="Users">

            <EnterpriseTable

                columns={[

                    "Username",

                    "Email",

                    "Status"

                ]}

                rows={[]}

            />

        </EnterpriseCard>

    );

}
