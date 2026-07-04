// ============================================================================
// FILE:
// /frontend/components/ui/toast/ToastItem.tsx
// ============================================================================

'use client';

import {

    Toast

} from "@/providers/ToastProvider";

interface Props{

    toast:Toast;

    remove:(id:string)=>void;

}

export default function ToastItem({

    toast,

    remove

}:Props){

    return(

        <div

            style={{

                width:320,

                padding:16,

                borderRadius:8,

                background:"#ffffff",

                border:"1px solid #d9d9d9",

                boxShadow:

                "0 10px 25px rgba(0,0,0,.08)"

            }}

        >

            <strong>

                {toast.title}

            </strong>

            <p>

                {toast.message}

            </p>

            <button

                onClick={

                    ()=>remove(

                        toast.id

                    )

                }

            >

                Close

            </button>

        </div>

    );

}
