// ============================================================================
// FILE: /frontend/app/layout.tsx
// ============================================================================

export default function RootLayout(){

    return(

        <html>

            <body>

                <ThemeProvider>

                    <AuthProvider>

                        <RealtimeProvider>

                            <NotificationProvider>

                                <Sidebar/>

                                <MainLayout/>

                            </NotificationProvider>

                        </RealtimeProvider>

                    </AuthProvider>

                </ThemeProvider>

            </body>

        </html>

    );

}
