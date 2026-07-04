// ============================================================================
// FILE:
// /frontend/features/blockchain/components/WalletTable.tsx
// ============================================================================

import EnterpriseTable
from "@/components/ui/Table";

export default function WalletTable(){

    return(

        <EnterpriseTable

            columns={[

                "Wallet",

                "Network",

                "Balance"

            ]}

            rows={[

                {

                    Wallet:"Main",

                    Network:"Ethereum",

                    Balance:"100"

                }

            ]}

        />

    );

}
