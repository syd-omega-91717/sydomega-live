// ============================================================================
// FILE:
// /frontend/components/ui/FormField.tsx
// ============================================================================

import { ReactNode } from "react";

interface Props{

    label:string;

    required?:boolean;

    children:ReactNode;

}

export default function FormField({

    label,

    required,

    children

}:Props){

    return(

        <div

            style={{

                display:"flex",

                flexDirection:"column",

                gap:8,

                marginBottom:20

            }}

        >

            <label>

                {label}

                {

                    required &&

                    <span>

                        *

                    </span>

                }

            </label>

            {children}

        </div>

    );

}
