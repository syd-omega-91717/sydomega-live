// ============================================================================
// FILE:
// /frontend/components/ui/TextArea.tsx
// ============================================================================

'use client';

interface Props{

    label:string;

    value:string;

    rows?:number;

    onChange:(value:string)=>void;

}

export default function TextArea({

    label,

    value,

    rows=5,

    onChange

}:Props){

    return(

        <div>

            <label>

                {label}

            </label>

            <textarea

                rows={rows}

                value={value}

                onChange={

                    e=>onChange(e.target.value)

                }

            />

        </div>

    );

}
