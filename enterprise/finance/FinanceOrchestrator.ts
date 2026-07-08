// ============================================================================
// FILE:
// /enterprise/finance/FinanceOrchestrator.ts
// ============================================================================

import { BudgetEngine } from "./BudgetEngine";
import { DigitalAssetAccountingEngine } from "./DigitalAssetAccountingEngine";
import { FinancialForecastEngine } from "./FinancialForecastEngine";
import { LiquidityEngine } from "./LiquidityEngine";
import { MultiCurrencyLedger } from "./MultiCurrencyLedger";
import { PaymentOrchestrator } from "./PaymentOrchestrator";
import { RevenueAnalyticsEngine } from "./RevenueAnalyticsEngine";
import { TaxEngine } from "./TaxEngine";
import { TreasuryEngine } from "./TreasuryEngine";

export class FinanceOrchestrator{

    readonly treasury=

    new TreasuryEngine();

    readonly ledger=

    new MultiCurrencyLedger();

    readonly payments=

    new PaymentOrchestrator();

    readonly assets=

    new DigitalAssetAccountingEngine();

    readonly forecasting=

    new FinancialForecastEngine();

    readonly budgeting=

    new BudgetEngine();

    readonly liquidity=

    new LiquidityEngine();

    readonly revenue=

    new RevenueAnalyticsEngine();

    readonly tax=

    new TaxEngine();

}
