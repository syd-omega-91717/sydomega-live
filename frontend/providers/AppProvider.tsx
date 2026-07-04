// ============================================================================
// FILE:
// /frontend/providers/AppProvider.tsx
// ============================================================================

'use client';

import { ReactNode } from "react";

import QueryProvider from "./QueryProvider";
import { ThemeProvider } from "./ThemeProvider";
import { AuthProvider } from "./AuthProvider";
import { NotificationProvider } from "./NotificationProvider";
import { RealtimeProvider } from "./RealtimeProvider";

interface Props{

    children:ReactNode;

}

export default function AppProvider({

    children

}:Props){

    return(

        <ThemeProvider>

            <AuthProvider>

                <RealtimeProvider>

                    <NotificationProvider>

                        <QueryProvider>

                            {children}

                        </QueryProvider>

                    </NotificationProvider>

                </RealtimeProvider>

            </AuthProvider>

        </ThemeProvider>

    );

}
