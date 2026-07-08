// ============================================================================
// FILE:
// /enterprise/finance/PaymentOrchestrator.ts
// ============================================================================

import { PaymentInstruction } from "./PaymentInstruction";

export class PaymentOrchestrator{

    execute(

        payment:PaymentInstruction

    ){

        payment.status="COMPLETED";

        return payment;

    }

}
