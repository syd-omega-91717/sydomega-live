// ============================================================================
// FILE:
// /frontend/features/admin/components/UserEditor.tsx
// ============================================================================

'use client';

import EnterpriseButton from "@/components/ui/Button";

export default function UserEditor(){

    return(

        <div>

            <input placeholder="Username"/>

            <input placeholder="Email"/>

            <input placeholder="First Name"/>

            <input placeholder="Last Name"/>

            <EnterpriseButton>

                Save User

            </EnterpriseButton>

        </div>

    );

}
