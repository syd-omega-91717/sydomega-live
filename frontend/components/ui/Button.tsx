// ============================================================================
// FILE:
// /frontend/components/ui/Button.tsx
// ============================================================================

'use client';

interface Props{

    label:string;

    onClick:()=>void;

    disabled?:boolean;

}

export default function Button({

    label,

    onClick,

    disabled

}:Props){

    return(

        <button

            disabled={disabled}

            onClick={onClick}

            style={{

                padding:"12px 20px",

                borderRadius:8,

                cursor:"pointer"

            }}

        >

            {label}

        </button>

    );

}
