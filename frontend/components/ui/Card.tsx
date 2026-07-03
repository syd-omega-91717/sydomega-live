// ============================================================================
// FILE:
// /frontend/components/ui/Card.tsx
// ============================================================================

import { ReactNode } from "react";

interface Props{

    title:string;

    children:ReactNode;

}

export default function Card({

    title,

    children

}:Props){

    return(

        <section

            style={{

                border:"1px solid #ddd",

                borderRadius:12,

                padding:24,

                marginBottom:20

            }}

        >

            <h2>

                {title}

            </h2>

            {children}

        </section>

    );

}
