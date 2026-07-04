// ============================================================================
// FILE:
// /frontend/components/layout/Sidebar.tsx
// UPDATED
// ============================================================================

'use client';

import NavItem

from "./NavItem";

import {

    navigation

}

from "@/config/navigation";

export default function Sidebar(){

    return(

        <aside
            className="omega-sidebar"
        >

            <h2>

                Ω SYD

            </h2>

            {

                navigation.map(

                    item=>

                    <NavItem

                        key={item.id}

                        item={item}

                    />

                )

            }

        </aside>

    );

}
