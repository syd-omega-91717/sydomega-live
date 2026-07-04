// ============================================================================
// FILE:
// /frontend/components/layout/Breadcrumb.tsx
// ============================================================================

'use client';

import Link from "next/link";

interface Props{

    items:{

        title:string;

        href:string;

    }[];

}

export default function Breadcrumb({

    items

}:Props){

    return(

        <nav>

            {

                items.map(

                    (item,index)=>

                    <span key={item.href}>

                        <Link href={item.href}>

                            {item.title}

                        </Link>

                        {

                            index!==items.length-1

                            &&

                            " / "

                        }

                    </span>

                )

            }

        </nav>

    );

}
