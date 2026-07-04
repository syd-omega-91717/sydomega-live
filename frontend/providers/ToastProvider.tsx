// ============================================================================
// FILE:
// /frontend/providers/ToastProvider.tsx
// ============================================================================

'use client';

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    ReactNode
} from "react";

import ToastContainer from "@/components/ui/toast/ToastContainer";

export type ToastType =
    | "success"
    | "error"
    | "warning"
    | "info";

export interface Toast {

    id:string;

    title:string;

    message:string;

    type:ToastType;

}

interface ToastContextValue{

    show:(toast:Omit<Toast,"id">)=>void;

    remove:(id:string)=>void;

}

const ToastContext =
createContext<ToastContextValue | null>(null);

interface Props{

    children:ReactNode;

}

export default function ToastProvider({

    children

}:Props){

    const [toasts,setToasts]=
        useState<Toast[]>([]);

    const remove=useCallback((id:string)=>{

        setToasts(

            previous=>

            previous.filter(

                toast=>toast.id!==id

            )

        );

    },[]);

    const show=useCallback(

        (toast:Omit<Toast,"id">)=>{

            const id=crypto.randomUUID();

            setToasts(

                previous=>[

                    ...previous,

                    {

                        id,

                        ...toast

                    }

                ]

            );

            setTimeout(

                ()=>remove(id),

                5000

            );

        },

        [remove]

    );

    const value=useMemo(

        ()=>({

            show,

            remove

        }),

        [

            show,

            remove

        ]

    );

    return(

        <ToastContext.Provider value={value}>

            {children}

            <ToastContainer

                toasts={toasts}

                remove={remove}

            />

        </ToastContext.Provider>

    );

}

export function useToast(){

    const context=
        useContext(ToastContext);

    if(!context){

        throw new Error(

            "ToastProvider missing."

        );

    }

    return context;

}
