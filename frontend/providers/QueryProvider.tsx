// ============================================================================
// FILE:
// /frontend/providers/QueryProvider.tsx
// ============================================================================

'use client';

import { ReactNode, useState } from "react";

import {

    QueryClient,

    QueryClientProvider,

    QueryCache,

    MutationCache

} from "@tanstack/react-query";

interface Props{

    children:ReactNode;

}

export default function QueryProvider({

    children

}:Props){

    const [client] = useState(

        ()=>new QueryClient({

            defaultOptions:{

                queries:{

                    retry:2,

                    staleTime:60000,

                    refetchOnWindowFocus:false,

                    refetchOnReconnect:true

                },

                mutations:{

                    retry:1

                }

            },

            queryCache:new QueryCache(),

            mutationCache:new MutationCache()

        })

    );

    return(

        <QueryClientProvider client={client}>

            {children}

        </QueryClientProvider>

    );

}
