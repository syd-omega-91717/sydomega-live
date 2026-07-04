// ============================================================================
// FILE:
// /frontend/components/ui/Progress.tsx
// ============================================================================

interface Props{

    value:number;

}

export default function Progress({

    value

}:Props){

    return(

        <div

            style={{

                width:"100%",

                height:8,

                background:"#e5e5e5",

                borderRadius:12

            }}

        >

            <div

                style={{

                    width:`${value}%`,

                    height:8,

                    borderRadius:12,

                    background:"#1976d2"

                }}

            />

        </div>

    );

}
