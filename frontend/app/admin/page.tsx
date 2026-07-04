// ============================================================================
// FILE:
// /frontend/app/admin/page.tsx
// ============================================================================

'use client';

import UserManagement from "@/features/admin/components/UserManagement";
import OrganizationManagement from "@/features/admin/components/OrganizationManagement";
import RoleManagement from "@/features/admin/components/RoleManagement";
import AuditViewer from "@/features/admin/components/AuditViewer";

export default function AdminPage(){

    return(

        <main>

            <h1>Enterprise Administration</h1>

            <UserManagement/>

            <OrganizationManagement/>

            <RoleManagement/>

            <AuditViewer/>

        </main>

    );

}
