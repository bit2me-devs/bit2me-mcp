/**
 * Tool argument interfaces — barrel. Implementations live in args-*.ts
 */
export type { WriteToolArgs } from "./args-write.js";
export type {
    MarketTickerArgs,
    MarketChartArgs,
    MarketAssetsDetailsArgs,
    MarketCurrencyRateArgs,
    PortfolioValuationArgs,
} from "./args-market.js";
export type {
    WalletGetPocketsArgs,
    WalletPocketAddressesArgs,
    WalletNetworksArgs,
    WalletCardsArgs,
    WalletMovementsArgs,
    WalletBuyCryptoArgs,
    WalletSellCryptoArgs,
    WalletSwapCryptoArgs,
    WalletBuyCryptoWithCardArgs,
    WalletConfirmOperationArgs,
} from "./args-wallet.js";
export type {
    EarnMovementsArgs,
    EarnPositionMovementsArgs,
    EarnMovementsSummaryArgs,
    EarnDepositArgs,
    EarnWithdrawArgs,
    EarnPositionRewardsConfigArgs,
    EarnPositionRewardsSummaryArgs,
} from "./args-earn.js";
export type {
    LoanSimulationArgs,
    LoanMovementsArgs,
    LoanOrdersArgs,
    LoanCreateArgs,
    LoanIncreaseGuaranteeArgs,
    LoanPaybackArgs,
} from "./args-loan.js";
export type {
    ProTradesArgs,
    ProOrderTradesArgs,
    ProOpenOrdersArgs,
    ProCreateOrderArgs,
    ProCancelOrderArgs,
    ProCancelAllOrdersArgs,
    ProDepositArgs,
    ProWithdrawArgs,
    ProMarketConfigArgs,
    ProOrderBookArgs,
    ProPublicTradesArgs,
    ProCandlesArgs,
    ProTickerArgs,
} from "./args-pro.js";
