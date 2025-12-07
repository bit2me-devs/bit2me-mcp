# [3.2.0](https://github.com/bit2me-devs/bit2me-mcp/compare/v3.1.2...v3.2.0) (2025-12-07)

### Bug Fixes

- improve error messages for authentication and API failures ([9452ba5](https://github.com/bit2me-devs/bit2me-mcp/commit/9452ba522816c3ae128976106c6ba87f0fa0b3c7))
- resolve TypeScript error in auth test ([4d40d49](https://github.com/bit2me-devs/bit2me-mcp/commit/4d40d49531709fd6506f57d45080a410a9b90ff6))

### Features

- add JWT session authentication support ([d2bbae1](https://github.com/bit2me-devs/bit2me-mcp/commit/d2bbae189eefd66b186fee0445c74950acc35436))

## [3.1.2](https://github.com/bit2me-devs/bit2me-mcp/compare/v3.1.1...v3.1.2) (2025-12-06)

### Bug Fixes

- **ci:** add TOOLS_DOCUMENTATION.md to release doc regeneration ([895d70e](https://github.com/bit2me-devs/bit2me-mcp/commit/895d70ef1650fdd79bf2968118f93bab1c14e3ba))

## [3.1.1](https://github.com/bit2me-devs/bit2me-mcp/compare/v3.1.0...v3.1.1) (2025-12-06)

### Bug Fixes

- **ci:** fix shell quoting in release workflow ([077fdb6](https://github.com/bit2me-devs/bit2me-mcp/commit/077fdb6769bc165872fbe1ff0114e0fc6a79283d))

# [3.1.0](https://github.com/bit2me-devs/bit2me-mcp/compare/v3.0.3...v3.1.0) (2025-12-06)

### Features

- **config:** add configurable BIT2ME_GATEWAY_URL for QA/staging ([30a0408](https://github.com/bit2me-devs/bit2me-mcp/commit/30a0408542bd1bcd8ac28c7ab69e09c9d824ba3f))

## [3.0.3](https://github.com/bit2me-devs/bit2me-mcp/compare/v3.0.2...v3.0.3) (2025-12-06)

### Bug Fixes

- **docs:** add missing table header in Pro Trading Operations section ([91cec60](https://github.com/bit2me-devs/bit2me-mcp/commit/91cec606d87a274c2ef4c164ca6ce82feab5b2dc))

## [3.0.2](https://github.com/bit2me-devs/bit2me-mcp/compare/v3.0.1...v3.0.2) (2025-12-06)

### Bug Fixes

- remove unused imports (CodeQL alert [#84](https://github.com/bit2me-devs/bit2me-mcp/issues/84)) ([274a34b](https://github.com/bit2me-devs/bit2me-mcp/commit/274a34b9c36102a581494ed30ae42d50432361b4))

## [3.0.1](https://github.com/bit2me-devs/bit2me-mcp/compare/v3.0.0...v3.0.1) (2025-12-06)

### Bug Fixes

- resolve CodeQL warnings for unused variables and imports ([b1b2d20](https://github.com/bit2me-devs/bit2me-mcp/commit/b1b2d2046dc9d055adf0a3edaed6af6946ad64f2))

# [3.0.0](https://github.com/bit2me-devs/bit2me-mcp/compare/v2.0.0...v3.0.0) (2025-12-06)

- feat!: release v3.0 with major API restructuring ([0d32844](https://github.com/bit2me-devs/bit2me-mcp/commit/0d32844e8beb7ac1f33fe78425cb6fdc06d3366b))

### Bug Fixes

- **broker:** round fiat values to 2 decimals in broker_get_asset_data ([e254397](https://github.com/bit2me-devs/bit2me-mcp/commit/e25439753f25ab06d4660e454c6ccbf6bc6d877d))
- **loan:** handle data wrapper in loan_get_movements response ([8a2a601](https://github.com/bit2me-devs/bit2me-mcp/commit/8a2a601bae737499ff925bc836fd9a3482b7a2f5))
- **mappers:** round all fiat-converted values to 2 decimals ([5850e41](https://github.com/bit2me-devs/bit2me-mcp/commit/5850e41314b994dc846a09e0fa99a143d50092c4))
- **pro:** correct symbol format for pro_get_public_trades API call ([c9da828](https://github.com/bit2me-devs/bit2me-mcp/commit/c9da8280d0d2f5229aad82d9a93f3e5e352ef6e0))
- **pro:** update order book symbol format and response mapping ([04fa6b6](https://github.com/bit2me-devs/bit2me-mcp/commit/04fa6b6e86682a661e7e0d0954e7db24a5c7d119))

### Code Refactoring

- **tools:** consolidate list and detail tools into unified tools with ID filters ([7c4b772](https://github.com/bit2me-devs/bit2me-mcp/commit/7c4b772ae4869685a7b0eba720c253e9fe56ade0))

### Features

- update tools, landing page and code improvements ([643516f](https://github.com/bit2me-devs/bit2me-mcp/commit/643516f61ab6c136a0d4348ec3f830cff89b0993))
- add new features (health, circuit-breaker, rate-limiter) ([71cbbe5](https://github.com/bit2me-devs/bit2me-mcp/commit/71cbbe5df84a8c75809dea731c6f57a1cfd6ab8c))
- **earn:** enrich earn_get_assets with full asset details ([9394e99](https://github.com/bit2me-devs/bit2me-mcp/commit/9394e993008f8c76295264655741b83f63eb206f))
- **landing:** improve interactive examples ([29e573a](https://github.com/bit2me-devs/bit2me-mcp/commit/29e573aaf0a2f89eab074c348fe34dd3d328f6d0))
- **landing:** improve sidebar UI and dark mode ([c3514b1](https://github.com/bit2me-devs/bit2me-mcp/commit/c3514b168f7d47e2e77ba73ca4316584e7b41a49))
- **loan:** completely rewrite loan_get_movements mapper ([a57541a](https://github.com/bit2me-devs/bit2me-mcp/commit/a57541aea341310214707c2b503845a8d8d7d93c))
- **loan:** enrich loan_get_orders with full loan details ([bfdbe1e](https://github.com/bit2me-devs/bit2me-mcp/commit/bfdbe1ebbbbdc538759cbe34f5c35ebcf623711f))
- **pro:** enrich pro_get_market_config with full trading parameters ([49a003a](https://github.com/bit2me-devs/bit2me-mcp/commit/49a003a4294a26f47349249874adf8bf0cc6fcf0))
- **schema:** comprehensive improvements to tools.json schema ([535edc6](https://github.com/bit2me-devs/bit2me-mcp/commit/535edc6f4d1f7016100155ffff726da16a342a07))

### BREAKING CHANGES

- This release contains multiple breaking changes:

## Tool Renaming

- All market*\* tools renamed to broker*\* tools for consistency
- broker_get_asset_data replaces market_get_asset_data
- broker_get_chart replaces market_get_chart
- broker_get_info replaces market_get_info
- broker_get_price replaces market_get_price

## Removed Modules

- account.ts module removed (consolidated into wallet)
- market.ts module removed (replaced by broker.ts)

## Tool Consolidation

- List and detail tools unified with optional ID filters
- wallet_get_cards now supports optional card_id filter
- earn_get_assets returns comprehensive asset information
- pro_get_market_config includes full trading parameters

## Response Format Changes

- All fiat values now rounded to 2 decimals
- loan_get_movements completely rewritten with correct field mapping
- loan_get_orders enriched with LTV, APR, and interest details
- earn_get_positions includes lock_period and converted_balance

## New Features

- Circuit breaker pattern for API resilience
- Health check endpoint (server_health_check)
- Rate limiter configuration
- Enhanced metrics collection

* **tools:** Detail tools removed, use list tools with ID filter instead.

## [Unreleased]

### Breaking Changes

- **reorganization:** Major reorganization of tool categories to improve semantic clarity for AI models:
    - **New category `broker` (Simple Trading):** Created new category consolidating broker market data and trading operations:
        - `market_get_ticker` → `broker_get_assets_price`
        - `market_get_data` → `broker_get_asset_data` (previously renamed to `broker_get_price_info`)
        - `market_get_chart` → `broker_get_asset_chart`
        - `wallet_buy_crypto` → `broker_quote_buy`
        - `wallet_sell_crypto` → `broker_quote_sell`
        - `wallet_swap_crypto` → `broker_quote_swap`
        - `wallet_confirm_operation` → `broker_confirm_quote`
    - **Category `general`:** Contains `general_get_assets_config` (asset information, previously `get_assets_details`)
    - **Category `wallet`:** Now only contains storage/balance tools (pockets, movements, addresses, cards)

    This reorganization provides clearer semantic separation: "Wallet" for storage/balances, "Broker" for simple trading and broker prices, and "Pro" for advanced trading. This prevents AI models from confusing Broker prices (which include spread) with Pro Trading prices when making trading decisions.

- **earn:** Rename Earn tools to use "position" terminology instead of "wallet" for better clarity:
    - `earn_get_wallets` → `earn_get_positions`
    - `earn_get_wallet_details` → `earn_get_position_details`
    - `earn_get_wallet_movements` → `earn_get_position_movements`
    - `earn_get_wallet_rewards_config` → `earn_get_position_rewards_config`
    - `earn_get_wallet_rewards_summary` → `earn_get_position_rewards_summary`
    - Parameter `wallet_id` → `position_id` in all Earn tools
    - Response fields `wallet_id` → `position_id` (backward compatibility: `wallet_id` still included in responses)

    This change clarifies that Earn "positions" represent money that is locked or generating yield (invested money), different from Wallet "pockets" which represent liquid available funds.

- **timeframes:** Standardize timeframe notation to trading standard and migrate validations to strict enums:
    - **Unified notation:** Changed `broker_get_asset_chart` timeframe from natural language ("one-hour", "one-day", "one-week", "one-month", "one-year") to trading notation ("1h", "1d", "1w", "1M", "1y") to match `pro_get_candles` and industry standards (TradingView, CCXT)
    - **Strict validation:** Added `enum` arrays to `inputSchema` for `broker_get_asset_chart` and `pro_get_candles` timeframe parameters, preventing LLM hallucinations and ensuring server-side validation
    - **Internal conversion:** Added `convertBrokerTimeframe()` function to map trading notation to API format internally, maintaining backward compatibility with API expectations

    This improvement reduces ambiguity for LLMs, saves tokens, unifies logic between Broker and Pro Trading tools, and provides robust validation at the schema level.

## [1.8.4](https://github.com/bit2me-devs/bit2me-mcp/compare/v1.8.3...v1.8.4) (2025-12-04)

### Bug Fixes

- **tests:** require explicit RUN_E2E=true to run E2E tests ([1eeda55](https://github.com/bit2me-devs/bit2me-mcp/commit/1eeda5573742a7f680e3013667e2f04ce40512d4))

## [1.8.3](https://github.com/bit2me-devs/bit2me-mcp/compare/v1.8.2...v1.8.3) (2025-12-04)

### Bug Fixes

- **tests:** read version dynamically from package.json ([61e0603](https://github.com/bit2me-devs/bit2me-mcp/commit/61e0603c462f07d879063ef31a711848cf40d438))

## [1.8.2](https://github.com/bit2me-devs/bit2me-mcp/compare/v1.8.1...v1.8.2) (2025-12-04)

### Bug Fixes

- **ci:** correct github/codeql-action SHA to valid v4 commit ([1cbc342](https://github.com/bit2me-devs/bit2me-mcp/commit/1cbc34296dfc93f96895c2a2488d16f47e39ad97))
- **tests:** update expected version to 1.8.1 in index.test.ts ([d778298](https://github.com/bit2me-devs/bit2me-mcp/commit/d778298d537844e1bdeb31f9088537e6fadb37a3))

## [1.8.1](https://github.com/bit2me-devs/bit2me-mcp/compare/v1.8.0...v1.8.1) (2025-12-04)

### Bug Fixes

- **ci:** correct ossf/scorecard-action SHA to valid v2.4.0 commit ([234d06e](https://github.com/bit2me-devs/bit2me-mcp/commit/234d06ea494868e5638d3f466813d62403e5836a))
- **tests:** update expected version to 1.8.0 in index.test.ts ([d6f1d8c](https://github.com/bit2me-devs/bit2me-mcp/commit/d6f1d8c92ba99d3c5d3a614ce914f3096293adb0))

# [1.8.0](https://github.com/bit2me-devs/bit2me-mcp/compare/v1.7.0...v1.8.0) (2025-12-04)

### Bug Fixes

- **ci:** update codecov action to valid version ([6b6d4e5](https://github.com/bit2me-devs/bit2me-mcp/commit/6b6d4e5c374d5445fa51ae16efad84eb0d9b8731))
- correct API endpoints for wallet and earn tools ([ef1f892](https://github.com/bit2me-devs/bit2me-mcp/commit/ef1f892e1f9d920dbba5f2272329098cb4a4d0b5))
- correct mapCurrencyRateResponse for actual API structure ([262e376](https://github.com/bit2me-devs/bit2me-mcp/commit/262e37655f39264adb45c7057f67a1d3068ab155))
- earn_get_summary response format and remove apy ([75ab614](https://github.com/bit2me-devs/bit2me-mcp/commit/75ab614578909961a7d631d13a31ba852da832a8))
- extract transactions array from v2 API response ([8454b89](https://github.com/bit2me-devs/bit2me-mcp/commit/8454b8955b3b108a568d3cab565e7a8a0cb87567))
- handle nested array response in earn_get_summary ([5f95bd9](https://github.com/bit2me-devs/bit2me-mcp/commit/5f95bd91744e285c4c74661af051f2fe2f32a567))
- handle nested data structure in earn_get_wallets and ignore docs/ ([b75cbad](https://github.com/bit2me-devs/bit2me-mcp/commit/b75cbad56d7f38c4814357bb1003c1073bb837f8))
- **market:** remove chart data limit and rename ticker parameter to pair ([b58308b](https://github.com/bit2me-devs/bit2me-mcp/commit/b58308b0c3ab42af5f958e56eead4c7bfbbb0675))
- pin all GitHub Actions to specific commit SHAs ([b2c9db4](https://github.com/bit2me-devs/bit2me-mcp/commit/b2c9db42bb9e0eb3f786e8a5642774fd4b5341fa))
- remove redundant null check in mapEarnSummaryResponse ([2ca291e](https://github.com/bit2me-devs/bit2me-mcp/commit/2ca291e76edd657250594f9ef869ea718befe700))
- remove unused imports and improve type checking ([f11b881](https://github.com/bit2me-devs/bit2me-mcp/commit/f11b881763b497ba36ffbfae53b7ada6445aab1b))
- remove unused type imports from market.ts ([f87d39c](https://github.com/bit2me-devs/bit2me-mcp/commit/f87d39c5ebc4258d757322e1f3064565ee684dd5))
- resolve CodeQL warnings ([b155ee8](https://github.com/bit2me-devs/bit2me-mcp/commit/b155ee87bd80b71623e88eb9084ccdd0ea9eb8dc)), closes [#59](https://github.com/bit2me-devs/bit2me-mcp/issues/59) [#70](https://github.com/bit2me-devs/bit2me-mcp/issues/70) [#77](https://github.com/bit2me-devs/bit2me-mcp/issues/77)
- resolve security and code quality issues ([9346c46](https://github.com/bit2me-devs/bit2me-mcp/commit/9346c46a3c39b48c199d0ec269bb4ec773711d85))
- **tests:** add config mock to edge-cases and portfolio tests ([ff406a4](https://github.com/bit2me-devs/bit2me-mcp/commit/ff406a41a04a672981c3835fc533dda63a4d6589))
- update codeql-action SHA in gitleaks workflow for consistency ([e94075d](https://github.com/bit2me-devs/bit2me-mcp/commit/e94075dad7165e2a24dc2bd00377cae4d7ed8a27))
- update portfolio_get_valuation to use v2 earn endpoint and fix pro balance calculation ([acab884](https://github.com/bit2me-devs/bit2me-mcp/commit/acab884c154f7960973974d953c37a8934e412f5))
- update wallet_get_transactions to match correct API schema ([25ec140](https://github.com/bit2me-devs/bit2me-mcp/commit/25ec1401b84923bb39092af51f7e4254655a6a04))

### Features

- add CurrencyRateResponse schema interface ([44df338](https://github.com/bit2me-devs/bit2me-mcp/commit/44df338a0cff53fc5156521b9ce1d58b6b8729d8))
- apply smartRound formatting to all price-returning tools ([32162bd](https://github.com/bit2me-devs/bit2me-mcp/commit/32162bdc004edaeebc101d9d993869bc88f3796e))
- implement market_get_currency_rate tool ([bce4955](https://github.com/bit2me-devs/bit2me-mcp/commit/bce4955034a835c8c8db79d0c9eca8eef6de2aae))
- **loan:** revamp loan tools and terminology ([aa3b48e](https://github.com/bit2me-devs/bit2me-mcp/commit/aa3b48efb623810d5b3e9d2d1feeb30158b0ce61))
- **wallet/earn:** add cards support and improve rewards ([f9fd3a9](https://github.com/bit2me-devs/bit2me-mcp/commit/f9fd3a9bde3bc643d32580d08e05e2793197f232))

# [1.7.0](https://github.com/bit2me-devs/bit2me-mcp/compare/v1.6.3...v1.7.0) (2025-11-29)

### Bug Fixes

- add attestations write permission for build provenance ([b9dc332](https://github.com/bit2me-devs/bit2me-mcp/commit/b9dc33261707f21a71b892b8fc2f5c7eee00f0ce))
- **build:** use html-minifier-terser for robust minification ([4bb1ac3](https://github.com/bit2me-devs/bit2me-mcp/commit/4bb1ac36c5fdeb7e654853117021fb2096fdc742))
- correct wallet transaction confirmation and add currency filter to pockets ([0d2cf82](https://github.com/bit2me-devs/bit2me-mcp/commit/0d2cf8277b94b121a189afdeafd5a61967ee46a2))
- pin upload-pages-artifact action by commit hash to resolve security alert ([70ea476](https://github.com/bit2me-devs/bit2me-mcp/commit/70ea476cc175f32a46be525371b14b358e298c11))
- return full ISO date time in market_get_chart tool instead of date only ([7c13998](https://github.com/bit2me-devs/bit2me-mcp/commit/7c13998e4f9a41611513e9b3b6144a4844442d33))
- **tests:** remove unused import expect from vitest ([2aba1bf](https://github.com/bit2me-devs/bit2me-mcp/commit/2aba1bf4ea378b2a7f23afbecae38bcd3af6f51f))
- update attest-build-provenance action to v2 ([673a9af](https://github.com/bit2me-devs/bit2me-mcp/commit/673a9afeb84bdc1bdee26ba4b406933837f90408))

### Features

- **build:** add HTML minification for production only ([5fe4559](https://github.com/bit2me-devs/bit2me-mcp/commit/5fe45591ff154796e138f30837dabc8b4f4b5e14))
- **landing:** improve usage examples with all parameters and responses ([14dcac3](https://github.com/bit2me-devs/bit2me-mcp/commit/14dcac36b6a37bff56f6cf84672495ed8175828d))

## [1.6.3](https://github.com/bit2me-devs/bit2me-mcp/compare/v1.6.2...v1.6.3) (2025-11-28)

### Bug Fixes

- address incomplete sanitization alert using replacement loop ([f020b6e](https://github.com/bit2me-devs/bit2me-mcp/commit/f020b6e75446778416dc6705c2d0b8b45f002b08))

## [1.6.2](https://github.com/bit2me-devs/bit2me-mcp/compare/v1.6.1...v1.6.2) (2025-11-28)

### Bug Fixes

- address remaining security scanning alerts ([730dab4](https://github.com/bit2me-devs/bit2me-mcp/commit/730dab4b3c66d2bc416c20f000dac444a606da71))

## [1.6.1](https://github.com/bit2me-devs/bit2me-mcp/compare/v1.6.0...v1.6.1) (2025-11-28)

### Bug Fixes

- resolve high severity security alerts ([fcaa6f0](https://github.com/bit2me-devs/bit2me-mcp/commit/fcaa6f07ae0d4535c79ddf3b730055ca47c4f0f5))

# [1.6.0](https://github.com/bit2me-devs/bit2me-mcp/compare/v1.5.0...v1.6.0) (2025-11-28)

### Features

- add robots.txt to landing page ([f13294b](https://github.com/bit2me-devs/bit2me-mcp/commit/f13294bb0a6182bff892d7e763b721a787dd43e1))

# [1.5.0](https://github.com/bit2me-devs/bit2me-mcp/compare/v1.4.1...v1.5.0) (2025-11-28)

### Features

- implement automatic generation of llms.txt and llms-full.txt ([9b95992](https://github.com/bit2me-devs/bit2me-mcp/commit/9b959924d235ef440c11704be4286c782f015fa8))

## [1.4.1](https://github.com/bit2me-devs/bit2me-mcp/compare/v1.4.0...v1.4.1) (2025-11-27)

### Bug Fixes

- resolve CodeQL security scanning alerts ([dc432e7](https://github.com/bit2me-devs/bit2me-mcp/commit/dc432e769c7373e3981b6b541b734717bf7d1b31))

# [1.4.0](https://github.com/bit2me-devs/bit2me-mcp/compare/v1.3.1...v1.4.0) (2025-11-27)

### Features

- add Google Analytics to landing page ([ec61650](https://github.com/bit2me-devs/bit2me-mcp/commit/ec616502fcf21206b45f2b2becd4c8e416353af4))

## [1.3.1](https://github.com/bit2me-devs/bit2me-mcp/compare/v1.3.0...v1.3.1) (2025-11-27)

### Bug Fixes

- reorganize imports in wallet.ts to match export order ([969cf5b](https://github.com/bit2me-devs/bit2me-mcp/commit/969cf5b9562a84753c516f0ddf627b3e12b1b7f3))

# [1.3.0](https://github.com/bit2me-devs/bit2me-mcp/compare/v1.2.0...v1.3.0) (2025-11-27)

### Bug Fixes

- remove deprecated husky lines ([545c3eb](https://github.com/bit2me-devs/bit2me-mcp/commit/545c3eba36fbe3d2bf4577b66479f083961f2730))
- remove currency parameter from wallet_get_pockets ([0c74d73](https://github.com/bit2me-devs/bit2me-mcp/commit/0c74d73b6b967e14bf7375ae46fb83ca5e515585))

### Features

- update tools, mappers and documentation ([34af228](https://github.com/bit2me-devs/bit2me-mcp/commit/34af228ca9acfeb0f6b33c77b7c26f23aaccbe02))

# [1.2.0](https://github.com/bit2me-devs/bit2me-mcp/compare/v1.1.1...v1.2.0) (2025-11-27)

### Bug Fixes

- add config mock to wallet tests ([84048b4](https://github.com/bit2me-devs/bit2me-mcp/commit/84048b49d24e74200803429edfb254372445b707))
- configure npm registry authentication before semantic-release ([15fe81f](https://github.com/bit2me-devs/bit2me-mcp/commit/15fe81f8bebe146c5bbec932333b36694bf4adb0))
- configure semantic-release workflow with proper credentials ([235d49c](https://github.com/bit2me-devs/bit2me-mcp/commit/235d49c0bda41e08b5c7bb1ea651f6502e8e1e6d))
- correct wallet address mapper and add pocket details mapper ([b392a69](https://github.com/bit2me-devs/bit2me-mcp/commit/b392a6968a80d6f59c76e0e3936088a2bf2fd016))
- improve npm token verification in release workflow ([1e89869](https://github.com/bit2me-devs/bit2me-mcp/commit/1e89869d850c8e2c307102c624a53e5e9e0a2071))
- improve semantic-release configuration ([88ea71c](https://github.com/bit2me-devs/bit2me-mcp/commit/88ea71c4ff0b0e753f6806ded20a9532097af6f0))
- **landing:** update github link in sidebar ([d11afe1](https://github.com/bit2me-devs/bit2me-mcp/commit/d11afe1d52e5cc66d5c18151726c45fe7ef7cae2))
- remove workaround from semantic-release workflow ([0043544](https://github.com/bit2me-devs/bit2me-mcp/commit/00435447f72dd6986215b175f078de4c6e256a5c))
- resolve all eslint warnings and improve type safety ([823d262](https://github.com/bit2me-devs/bit2me-mcp/commit/823d26293d5dda49a2f5b3eb8ef7351aed5005a0))
- update Node.js version to 22 for semantic-release compatibility ([f78f88f](https://github.com/bit2me-devs/bit2me-mcp/commit/f78f88f2b292290abc5910dfdfeffc5e013e0e56))

### Features

- add optional raw_response support in mapped responses ([623413b](https://github.com/bit2me-devs/bit2me-mcp/commit/623413b5b69cbd7629ea96e1f3aae381d5bfb871))
- improve landing page and git hooks management ([bbb1364](https://github.com/bit2me-devs/bit2me-mcp/commit/bbb1364b5d3bff5ca8ad8809dedb8da30493787c))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.2] - 2025-11-26

### Added

- **Landing Page Improvements**:
    - New "Prerequisites" section explaining how to obtain API Keys.
    - Tabbed installation instructions for **Claude Desktop**, **Cursor IDE**, **Windsurf**, **Gemini CLI**, and **VS Code**.
    - Detailed `mcp_config.json` examples for each platform.
    - Explicit warning about Cursor's environment variable limitations (requires `.env` file).

### Fixed

- **Documentation Accuracy**:
    - Corrected total tool count from 48 to **47** in both `landing/index.html` and `README.md`.
    - Updated tool breakdown list in `README.md` to match the actual implementation (8 Market, 7 Wallet, 11 Earn, 9 Loan, 10 Pro, 1 Account, 1 Aggregation).

## [1.1.1] - 2025-11-26

### Fixed

- Added missing `repository` field to `package.json` for NPM metadata.

## [1.1.0] - 2025-11-26

### Added

- **Landing Page Enhancements**:
    - Predictive search with suggestions and auto-scroll.
    - New "Tools Reference" section name (previously API Reference).
    - Added "Parameters & Validation" and "Server & Maintenance" troubleshooting guides.
    - Improved JSON example indentation and visualization.
    - Updated footer links (GitHub, Bit2Me Website, API Docs).
- **Documentation**:
    - Added GitHub repository button with logo in Hero section.
    - Updated all repository references to `bit2me-devs/bit2me-mcp`.

### Changed

- **Code Refactoring**:
    - Flattened `src/tools` directory structure (removed `assets`, `market`, `aggregation` subfolders).
    - Moved `schemas.ts` from `src/types/` to `src/utils/`.
    - Updated import paths across the project to reflect new structure.
- **Tool Logic**:
    - Unified return types in tool handlers (replaced `null` returns with explicit Errors for MCP SDK compatibility).

### Fixed

- Corrected argument definitions in landing page examples for `wallet_create_proforma`, `earn_create_transaction`, `loan_get_ltv`, and others.
- Fixed build errors related to strict type checking in tool handlers.
- Resolved test import path issues after directory restructuring.

### Added (Previous)

- Complete mapper coverage (47/47 tools with optimized responses)
- TypeScript strict mode enforcement
- ESLint configuration with TypeScript rules
- Prettier code formatting
- Pre-commit hooks with Husky
- Comprehensive CI/CD workflows
- Code quality badges in README
- Barrel exports for utilities
- Pull request template
- Dependabot configuration
- Semantic release automation
- Code coverage reporting

### Changed

- Consolidated API service layer (merged `api.ts` and `auth.ts` into `services/bit2me.ts`)
- Internationalized all code comments and documentation to English
- Enhanced error handling with custom error classes
- Improved logging with structured logger and data sanitization
- Updated deployment workflow with pre-deployment validation

### Fixed

- Missing mapper for `pro_get_order_details` tool
- Exponential backoff implementation with configurable limits
- Rate limit handling with proper retry logic

### Security

- Sanitized sensitive data in logs (API keys, signatures)
- Strict TypeScript type checking
- Input validation with type guards on all mappers

---

## [1.0.0] - 2025-11-25

### Added

- Initial release of Bit2Me MCP Server
- 47 tools across 8 categories:
    - 8 Market tools (public data)
    - 7 Wallet tools (private)
    - 12 Earn/Staking tools
    - 11 Loan tools
    - 8 Pro Trading tools
    - 1 Account tool
    - 1 Portfolio aggregation tool
    - 11 Operation tools (write actions)
- Automatic retry mechanism for rate-limited requests
- Exponential backoff with jitter
- Comprehensive test suite (31 tests)
- Documentation:
    - README quick-start guide
    - TOOLS_DOCUMENTATION.md with descriptions, endpoints and response schemas
    - TypeScript schema coverage documentation
    - Product marketing documentation
- Landing page with GitHub Pages deployment
- Environment-based configuration
- MCP SDK integration

### Security

- Secure API authentication with signature generation
- Environment variable validation with Zod
- No hardcoded credentials

---

## Release Notes

### Version Numbering

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality in a backwards compatible manner
- **PATCH** version for backwards compatible bug fixes

### Automated Releases

Releases are automated using [semantic-release](https://github.com/semantic-release/semantic-release).
Version bumps are determined by commit message conventions.

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features (minor version bump)
- `fix:` - Bug fixes (patch version bump)
- `docs:` - Documentation changes (no version bump)
- `style:` - Code style changes (no version bump)
- `refactor:` - Code refactoring (no version bump)
- `perf:` - Performance improvements (patch version bump)
- `test:` - Test changes (no version bump)
- `chore:` - Build/dependency changes (no version bump)
- `ci:` - CI/CD changes (no version bump)

Add `BREAKING CHANGE:` in commit body for major version bumps.

---

## [Links]

- [Repository](https://github.com/bit2me-devs/bit2me-mcp)
- [Issues](https://github.com/bit2me-devs/bit2me-mcp/issues)
- [Pull Requests](https://github.com/bit2me-devs/bit2me-mcp/pulls)
- [Releases](https://github.com/bit2me-devs/bit2me-mcp/releases)
