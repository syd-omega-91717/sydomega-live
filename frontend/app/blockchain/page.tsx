// ============================================================================
// FILE:
// /frontend/app/blockchain/page.tsx
// ============================================================================

'use client';

import WalletTable from "@/features/blockchain/components/WalletTable";

export default function BlockchainPage(){

    return(

        <main>

            <h1>Blockchain Platform</h1>

            <WalletTable/>

        </main>

    );

}
