// ============================================================================
// FILE:
// /frontend/components/ui/Table.tsx
// ============================================================================

interface Props{

    columns:string[];

    rows:any[][];

}

export default function Table({

    columns,

    rows

}:Props){

    return(

        <table>

            <thead>

                <tr>

                    {

                        columns.map(

                            c=><th key={c}>{c}</th>

                        )

                    }

                </tr>

            </thead>

            <tbody>

                {

                    rows.map(

                        (row,index)=>(

                            <tr key={index}>

                                {

                                    row.map(

                                        (cell,i)=>

                                        <td key={i}>{cell}</td>

                                    )

                                }

                            </tr>

                        )

                    )

                }

            </tbody>

        </table>

    );

}
