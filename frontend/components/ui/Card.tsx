// ============================================================================
// FILE:
// /frontend/components/ui/Card.tsx
// ============================================================================

interface Props{

    title:string;

    children:any;

}

export default function EnterpriseCard({

    title,

    children

}:Props){

    return(

        <section className="omega-card">

            <header>

                <h3>{title}</h3>

            </header>

            <div>

                {children}

            </div>

        </section>

    );

}
