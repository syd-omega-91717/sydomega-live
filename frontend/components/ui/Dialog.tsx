// ============================================================================
// FILE:
// /frontend/components/ui/Dialog.tsx
// ============================================================================

'use client';

import { ReactNode } from "react";

interface Props{

    open:boolean;

    title:string;

    children:ReactNode;

    onClose:()=>void;

}

export default function Dialog({

    open,

    title,

    children,

    onClose

}:Props){

    if(!open){

        return null;

    }

    return(

        <div

            style={{

                position:"fixed",

                inset:0,

                background:"rgba(0,0,0,.5)",

                display:"flex",

                justifyContent:"center",

                alignItems:"center",

                zIndex:999

            }}

        >

            <div

                style={{

                    width:700,

                    background:"#fff",

                    borderRadius:12,

                    padding:24

                }}

            >

                <h2>{title}</h2>

                {children}

                <button onClick={onClose}>

                    Close

                </button>

            </div>

        </div>

    );

}
