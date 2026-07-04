// ============================================================================
// FILE:
// /frontend/components/ui/Skeleton.tsx
// ============================================================================

interface Props{

    width?:string;

    height?:number;

}

export default function Skeleton({

    width="100%",

    height=20

}:Props){

    return(

        <div

            style={{

                width,

                height,

                background:"#ececec",

                borderRadius:8

            }}

        />

    );

}
