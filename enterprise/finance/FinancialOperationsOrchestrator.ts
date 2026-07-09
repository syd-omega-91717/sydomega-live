// ============================================================================
// FILE:
// /enterprise/finance/FinancialOperationsOrchestrator.ts
// ============================================================================

import { AMLKYCEngine } from "./AMLKYCEngine";
import { CapitalMarketsEngine } from "./CapitalMarketsEngine";
import { CoreBankingEngine } from "./CoreBankingEngine";
import { DigitalWalletEngine } from "./DigitalWalletEngine";
import { ForeignExchangeEngine } from "./ForeignExchangeEngine";
import { OpenBankingEngine } from "./OpenBankingEngine";
import { PaymentProcessingEngine } from "./PaymentProcessingEngine";
import { RiskPortfolioEngine } from "./RiskPortfolioEngine";
import { TreasuryManagementEngine } from "./TreasuryManagementEngine";

export class FinancialOperationsOrchestrator{

    readonly banking=new CoreBankingEngine();

    readonly wallets=new DigitalWalletEngine();

    readonly treasury=new TreasuryManagementEngine();

    readonly openBanking=new OpenBankingEngine();

    readonly capitalMarkets=new CapitalMarketsEngine();

    readonly foreignExchange=new ForeignExchangeEngine();

    readonly risk=new RiskPortfolioEngine();

    readonly amlKyc=new AMLKYCEngine();

    readonly payments=new PaymentProcessingEngine();

}
