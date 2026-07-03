// ============================================================================
// FILE:
// /frontend/app/layout.tsx
// ============================================================================

import "./globals.css";

import { ReactNode } from "react";

import { AuthProvider } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { RealtimeProvider } from "@/providers/RealtimeProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function RootLayout({

    children

}:{

    children:ReactNode;

}){

    return(

        <html lang="en">

            <body>

                <ThemeProvider>

                    <AuthProvider>

                        <RealtimeProvider>

                            <NotificationProvider>

                                <div style={{display:"flex"}}>

                                    <Sidebar/>

                                    <div style={{flex:1}}>

                                        <Topbar/>

                                        <main style={{padding:20}}>

                                            {children}

                                        </main>

                                    </div>

                                </div>

                            </NotificationProvider>

                        </RealtimeProvider>

                    </AuthProvider>

                </ThemeProvider>

            </body>

        </html>

    );

}
