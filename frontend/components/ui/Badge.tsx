// ============================================================================
// FILE:
// /frontend/components/ui/Badge.tsx
// ============================================================================

interface Props{

    value:string;

}

export default function Badge({

    value

}:Props){

    return(

        <span

            style={{

                padding:"4px 12px",

                borderRadius:20,

                background:"#e6eefc"

            }}

        >

            {value}

        </span>

    );

}
