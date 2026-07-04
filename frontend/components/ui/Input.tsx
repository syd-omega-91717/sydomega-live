// ============================================================================
// FILE:
// /frontend/components/ui/Input.tsx
// ============================================================================

'use client';

interface Props{

    label:string;

    value:string;

    placeholder?:string;

    type?:string;

    onChange:(value:string)=>void;

}

export default function Input({

    label,

    value,

    placeholder,

    type="text",

    onChange

}:Props){

    return(

        <div

            style={{

                display:"flex",

                flexDirection:"column",

                gap:8

            }}

        >

            <label>

                {label}

            </label>

            <input

                value={value}

                type={type}

                placeholder={placeholder}

                onChange={

                    e=>onChange(e.target.value)

                }

            />

        </div>

    );

}
