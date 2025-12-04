# TypeScript Schema Coverage

Este documento mapea cada uno de los 47 tools con su interfaz TypeScript correspondiente en `src/types/schemas.ts`.

## Resumen

- **Total de tools**: 48
- **Total de interfaces TypeScript**: 50
- **Cobertura**: 100% ✅

---

## Market Tools (8 tools)

| Tool | Interface TypeScript |
|------|---------------------|
| `market_get_ticker` | `MarketTickerResponse` |
| `market_get_chart` | `ChartDataPoint[]` |
| `market_get_assets` | `MarketAssetResponse[]` |
| `market_get_asset_details` | `MarketAssetResponse` |
| `market_get_config` | `MarketConfigResponse` |
| `market_get_order_book` | `MarketOrderBookResponse` |
| `market_get_public_trades` | `PublicTradeResponse[]` |
| `market_get_candles` | `CandleResponse[]` |

---

## Wallet Tools (5 tools)

| Tool | Interface TypeScript |
|------|---------------------|
| `wallet_get_pockets` | `WalletPocketResponse[]` |
| `wallet_get_pocket_details` | `WalletPocketDetailsResponse` |
| `wallet_get_pocket_addresses` | `WalletAddressDetailsResponse[]` |
| `wallet_get_transactions` | `{ metadata: object, transactions: WalletTransactionResponse[] }` |
| `wallet_get_transaction_details` | `WalletTransactionDetailsResponse` |

---

## Earn Tools (11 tools)

| Tool | Interface TypeScript |
|------|---------------------|
| `earn_get_summary` | `EarnSummaryResponse[]` |
| `earn_get_wallets` | `EarnWalletResponse[]` |
| `earn_get_wallet_details` | `EarnWalletDetailsResponse` |
| `earn_get_wallet_movements` | `{ metadata: object, movements: EarnWalletMovementResponse[] }` |
| `earn_get_movements` | `{ metadata: object, movements: EarnMovementResponse[] }` |
| `earn_get_movements_summary` | `EarnMovementsSummaryResponse` |
| `earn_get_assets` | `string[]` (o `EarnAssetsResponse`) |
| `earn_get_apy` | `Record<string, EarnAPYResponse>` |
| `earn_get_rewards_config` | `EarnRewardsConfigResponse` |
| `earn_get_wallet_rewards_config` | `EarnWalletRewardsConfigResponse` |
| `earn_get_wallet_rewards_summary` | `EarnWalletRewardsSummaryResponse` |

---

## Loan Tools (6 tools)

| Tool | Interface TypeScript |
|------|---------------------|
| `loan_get_active` | `LoanOrderResponse[]` |
| `loan_get_ltv` | `LoanLTVResponse` |
| `loan_get_config` | `LoanConfigResponse[]` |
| `loan_get_transactions` | `LoanTransactionResponse[]` |
| `loan_get_orders` | `LoanOrderResponse[]` |
| `loan_get_order_details` | `LoanOrderDetailsResponse` |

---

## Pro Trading Tools (5 tools)

| Tool | Interface TypeScript |
|------|---------------------|
| `pro_get_balance` | `ProBalanceResponse[]` |
| `pro_get_transactions` | `ProTradeResponse[]` |
| `pro_get_order_trades` | `ProTradeResponse[]` |
| `pro_get_order_details` | `ProOrderResponse` |
| `pro_get_open_orders` | `ProOrderResponse[]` |

---

## Account Tools (1 tool)

| Tool | Interface TypeScript |
|------|---------------------|
| `account_get_info` | `AccountInfoResponse` |

---

## Aggregation Tools (1 tool)

| Tool | Interface TypeScript |
|------|---------------------|
| `portfolio_get_valuation` | `PortfolioValuationResponse` |

---

## Operation Tools (12 tools)

| Tool | Interface TypeScript |
|------|---------------------|
| `wallet_create_proforma` | `ProformaResponse` |
| `wallet_confirm_transaction` | `TransactionConfirmationResponse` |
| `pro_get_open_orders` | `ProOrderResponse[]` |
| `pro_create_order` | `OrderCreationResponse` |
| `pro_cancel_order` | `ProCancelOrderResponse` |
| `pro_cancel_all_orders` | `ProCancelAllOrdersResponse` |
| `pro_deposit` | `ProDepositResponse` |
| `pro_withdraw` | `ProWithdrawResponse` |
| `earn_create_transaction` | `EarnCreateTransactionResponse` |
| `loan_create` | `LoanCreateResponse` |
| `loan_increase_guarantee` | `LoanIncreaseGuaranteeResponse` |
| `loan_payback` | `LoanPaybackResponse` |

---

## Lista Completa de Interfaces (49)

### Market (8)
1. `MarketTickerResponse`
2. `MarketAssetResponse`
3. `MarketConfigResponse`
4. `OrderBookEntry`
5. `MarketOrderBookResponse`
6. `PublicTradeResponse`
7. `CandleResponse`
8. `ChartDataPoint`

### Wallet (6)
9. `WalletPocketResponse`
10. `WalletTransactionResponse`
11. `WalletAddressResponse`
12. `WalletPocketDetailsResponse`
13. `WalletAddressDetailsResponse`
14. `WalletTransactionDetailsResponse`

### Earn (12)
15. `EarnSummaryResponse`
16. `EarnWalletResponse`
17. `EarnAPYResponse`
18. `EarnWalletMovementResponse`
19. `EarnMovementResponse`
20. `EarnWalletDetailsResponse`
21. `EarnMovementsSummaryResponse`
22. `EarnAssetsResponse`
23. `EarnRewardsConfigResponse`
24. `EarnWalletRewardsConfigResponse`
25. `EarnWalletRewardsSummaryResponse`

### Loan (5)
25. `LoanOrderResponse`
26. `LoanLTVResponse`
27. `LoanConfigResponse`
28. `LoanTransactionResponse`
29. `LoanOrderDetailsResponse`

### Pro Trading (6)
30. `ProBalanceResponse`
31. `ProOrderResponse`
32. `ProTradeResponse`
33. `ProOpenOrdersResponse`
34. `ProTransactionsResponse`
35. `ProOrderTradesResponse`

### Account (1)
36. `AccountInfoResponse`

### Aggregation (2)
37. `PortfolioAssetDetail`
38. `PortfolioValuationResponse`

### Operations (11)
39. `ProformaResponse`
40. `TransactionConfirmationResponse`
41. `OrderCreationResponse`
42. `ProCancelOrderResponse`
43. `ProCancelAllOrdersResponse`
44. `ProDepositResponse`
45. `ProWithdrawResponse`
46. `EarnCreateTransactionResponse`
47. `LoanCreateResponse`
48. `LoanIncreaseGuaranteeResponse`
49. `LoanPaybackResponse`

---

## Notas

- Algunas interfaces se reutilizan entre múltiples tools (ej: `LoanOrderResponse` se usa en `loan_get_active` y `loan_get_orders`)
- Las interfaces están organizadas por categorías en `src/types/schemas.ts`
- Todas las interfaces usan `snake_case` para los nombres de campos, siguiendo las mejores prácticas para LLMs
- El total de 49 interfaces cubre los 47 tools, con algunas interfaces auxiliares adicionales
