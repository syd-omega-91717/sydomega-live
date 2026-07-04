// ============================================================================
// FILE:
// /frontend/components/ui/toast/ToastContainer.tsx
// ============================================================================

'use client';

import ToastItem from "./ToastItem";

import { Toast } from "@/providers/ToastProvider";

interface Props{

    toasts:Toast[];

    remove:(id:string)=>void;

}

export default function ToastContainer({

    toasts,

    remove

}:Props){

    return(

        <div

            style={{

                position:"fixed",

                top:20,

                right:20,

                display:"flex",

                flexDirection:"column",

                gap:12,

                zIndex:9999

            }}

        >

            {

                toasts.map(

                    toast=>

                    <ToastItem

                        key={toast.id}

                        toast={toast}

                        remove={remove}

                    />

                )

            }

        </div>

    );

}
