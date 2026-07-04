// ============================================================================
// FILE:
// /frontend/components/ui/Table.tsx
// ============================================================================

interface Props{

    columns:string[];

    rows:any[];

}

export default function EnterpriseTable({

    columns,

    rows

}:Props){

    return(

        <table>

            <thead>

                <tr>

                    {

                        columns.map(

                            c=>

                            <th key={c}>{c}</th>

                        )

                    }

                </tr>

            </thead>

            <tbody>

                {

                    rows.map(

                        (row,index)=>

                        <tr key={index}>

                            {

                                Object.values(row).map(

                                    (v:any,i)=>

                                    <td key={i}>{v}</td>

                                )

                            }

                        </tr>

                    )

                }

            </tbody>

        </table>

    );

}
