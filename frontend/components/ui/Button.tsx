// ============================================================================
// FILE:
// /frontend/components/ui/Button.tsx
// ============================================================================

'use client';

import { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement>{

    loading?:boolean;

}

export default function EnterpriseButton({

    loading,

    children,

    ...props

}:Props){

    return(

        <button
            {...props}
            disabled={loading || props.disabled}
            className="omega-button">

            {

                loading

                ? "Loading..."

                : children

            }

        </button>

    );

}
