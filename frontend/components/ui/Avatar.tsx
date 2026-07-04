// ============================================================================
// FILE:
// /frontend/components/ui/Avatar.tsx
// ============================================================================

interface Props{

    name:string;

    image?:string;

}

export default function Avatar({

    name,

    image

}:Props){

    if(image){

        return(

            <img

                src={image}

                width={40}

                height={40}

                alt={name}

            />

        );

    }

    return(

        <div

            style={{

                width:40,

                height:40,

                borderRadius:"50%",

                display:"flex",

                justifyContent:"center",

                alignItems:"center",

                background:"#ccc"

            }}

        >

            {name.substring(0,1)}

        </div>

    );

}
