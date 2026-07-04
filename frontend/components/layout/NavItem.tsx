// ============================================================================
// FILE:
// /frontend/components/layout/NavItem.tsx
// ============================================================================

'use client';

import Link from "next/link";

import { NavigationItem }

from "@/types/navigation";

export default function NavItem({

    item

}:{

    item:NavigationItem

}){

    return(

        <Link

            href={item.path}

            className="omega-nav-item"

        >

            {item.title}

        </Link>

    );

}
