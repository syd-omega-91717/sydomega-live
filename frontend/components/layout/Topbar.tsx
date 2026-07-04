// ============================================================================
// FILE:
// /frontend/components/layout/Topbar.tsx
// UPDATED
// ============================================================================

import UserProfileMenu
from "./UserProfileMenu";

export default function Topbar(){

    return(

        <header className="omega-topbar">

            <div>

                Ω SYD OMEGA 91717

            </div>

            <UserProfileMenu/>

        </header>

    );

}
