# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.5.65](https://github.com/ecomplus/app-pagseguro/compare/v0.5.64...v0.5.65) (2023-09-25)


### Features

* add config option to enable pagseguro checkout redirect ([#28](https://github.com/ecomplus/app-pagseguro/issues/28)) ([a26d930](https://github.com/ecomplus/app-pagseguro/commit/a26d9301ec91758ec98d08f0786056db5e6f8b6d))

### [0.5.64](https://github.com/ecomplus/app-pagseguro/compare/v0.5.62...v0.5.64) (2021-10-21)


### Bug Fixes

* **deps:** update @ecomplus/application-sdk to v1.15.5 sqlite ([687b1bc](https://github.com/ecomplus/app-pagseguro/commit/687b1bc526b5a77b04b5d3c6a19dca5177f48b45))

### [0.5.63](https://github.com/ecomplus/app-pagseguro/compare/v0.5.62...v0.5.63) (2021-10-21)


### Bug Fixes

* **deps:** update @ecomplus/application-sdk to v1.15.5 sqlite ([687b1bc](https://github.com/ecomplus/app-pagseguro/commit/687b1bc526b5a77b04b5d3c6a19dca5177f48b45))

### [0.5.62](https://github.com/ecomplus/app-pagseguro/compare/v0.5.61...v0.5.62) (2021-03-10)


### Bug Fixes

* **create-transaction:** prevent errors with address chars lenght limits ([a74a16c](https://github.com/ecomplus/app-pagseguro/commit/a74a16ce2d9e87a0a5c0dc9bee4238a1e059dd37))

### [0.5.61](https://github.com/ecomclub/app-pagseguro/compare/v0.5.60...v0.5.61) (2020-10-30)


### Bug Fixes

* **create-transactions:** returning error for status 400 [#14](https://github.com/ecomclub/app-pagseguro/issues/14) ([e0fd7c7](https://github.com/ecomclub/app-pagseguro/commit/e0fd7c7d6284cf0af64c3232f3e7ec5ad8ed0112))
* **new-transaction:** ignoring gift product and respecting maxLength ([452f0ed](https://github.com/ecomclub/app-pagseguro/commit/452f0ed7673895d34826e39e30a63f0f2436ffc4))

### [0.5.60](https://github.com/ecomclub/app-pagseguro/compare/v0.5.59...v0.5.60) (2020-10-28)

### [0.5.59](https://github.com/ecomclub/app-pagseguro/compare/v0.5.58...v0.5.59) (2020-08-19)


### Bug Fixes

* **create-transaction.js:** returning intermediator obj for payment with online_debit ([67a2f1a](https://github.com/ecomclub/app-pagseguro/commit/67a2f1a231856b4698c0d5096e48112d20b5f72d))

### [0.5.58](https://github.com/ecomclub/app-pagseguro/compare/v0.5.57...v0.5.58) (2020-08-19)


### Bug Fixes

* **create-transaction.js:** returning intermediator obj for payment with baking_billet ([9efe080](https://github.com/ecomclub/app-pagseguro/commit/9efe080b5ebe3bbe9d98d81b1b5340adddcf7d0c))

### [0.5.57](https://github.com/ecomclub/app-pagseguro/compare/v0.5.56...v0.5.57) (2020-07-27)


### Bug Fixes

* **transactions-updater:** setup interval to call function again ([2ff00da](https://github.com/ecomclub/app-pagseguro/commit/2ff00da8524e96d2c894b182e06b93cb675a7fd1))

### [0.5.56](https://github.com/ecomclub/app-pagseguro/compare/v0.5.55...v0.5.56) (2020-07-22)


### Bug Fixes

* **list-payments.js:** using installments_options configured in the application ([2cb54d1](https://github.com/ecomclub/app-pagseguro/commit/2cb54d1906069d6d286b5f3c1fb8d620bb8f134e))

### [0.5.55](https://github.com/ecomclub/app-pagseguro/compare/v0.5.54...v0.5.55) (2020-07-20)


### Bug Fixes

* **create-transaction.js:** making post in session on create_transactuon ([f280a94](https://github.com/ecomclub/app-pagseguro/commit/f280a9432a1e227988fc4423def2ff2bac013c8e))

### [0.5.54](https://github.com/ecomclub/app-pagseguro/compare/v0.5.53...v0.5.54) (2020-07-19)

### [0.5.53](https://github.com/ecomclub/app-pagseguro/compare/v0.5.51...v0.5.53) (2020-07-19)


### Bug Fixes

* checkout confirmation ([3198d3b](https://github.com/ecomclub/app-pagseguro/commit/3198d3b68b68a03fb47983a3c205d744242cbf58))

### [1.1.2](https://github.com/ecomclub/app-pagseguro/compare/v1.1.1...v1.1.2) (2020-06-17)

### [1.1.1](https://github.com/ecomclub/app-pagseguro/compare/v1.1.0...v1.1.1) (2020-06-17)

## [1.1.0](https://github.com/ecomclub/app-pagseguro/compare/v1.0.0...v1.1.0) (2020-06-17)


### Features

* **installments:** handle 'max_interest_free' for default installments option ([5d1cf7d](https://github.com/ecomclub/app-pagseguro/commit/5d1cf7dc07692105831ab0f0b35f2a4c00a70183))


### Bug Fixes

* **deps:** bump @ecomplus/application-sdk to sqlite version ([dfd8072](https://github.com/ecomclub/app-pagseguro/commit/dfd8072e7a293ff8a00263600b743f0070af4ffc))

## [1.0.0](https://github.com/ecomclub/app-pagseguro/compare/v0.5.52...v1.0.0) (2020-06-17)


### Features

* **admin-settings:** installments config (max number, min installment) ([e4f192a](https://github.com/ecomclub/app-pagseguro/commit/e4f192a9a501a3941a3d68ccd5944698f4b0b173))


### Bug Fixes

* **debug:** fix objects to log and error response ([9ed36d7](https://github.com/ecomclub/app-pagseguro/commit/9ed36d7399684bc2baad264e85260710cb932190))
* **list-payments:** fix handling installments, with config options ([565c2ee](https://github.com/ecomclub/app-pagseguro/commit/565c2ee7ae496f12aecec3441a476bff32254c55))

### [0.5.52](https://github.com/ecomclub/app-pagseguro/compare/v0.5.50...v0.5.52) (2020-05-22)


### Bug Fixes

* **list-payments:** check if `installmentsOption` is defined ([603ff09](https://github.com/ecomclub/app-pagseguro/commit/603ff0983d84315255bc6d32f6d99564e43fb95b))
* **pagseguro-webhook:** fix checking duplicated status notification ([657fc39](https://github.com/ecomclub/app-pagseguro/commit/657fc391b0eb89668e22b70bbb884a8ad0d72da0))

### [0.5.52](https://github.com/ecomclub/app-pagseguro/compare/v0.5.51...v0.5.52) (2020-07-19)


### Bug Fixes

* checkout confirmation ([3198d3b](https://github.com/ecomclub/app-pagseguro/commit/3198d3b68b68a03fb47983a3c205d744242cbf58))

### [1.1.2](https://github.com/ecomclub/app-pagseguro/compare/v1.1.1...v1.1.2) (2020-06-17)

### [1.1.1](https://github.com/ecomclub/app-pagseguro/compare/v1.1.0...v1.1.1) (2020-06-17)

## [1.1.0](https://github.com/ecomclub/app-pagseguro/compare/v1.0.0...v1.1.0) (2020-06-17)


### Features

* **installments:** handle 'max_interest_free' for default installments option ([5d1cf7d](https://github.com/ecomclub/app-pagseguro/commit/5d1cf7dc07692105831ab0f0b35f2a4c00a70183))


### Bug Fixes

* **deps:** bump @ecomplus/application-sdk to sqlite version ([dfd8072](https://github.com/ecomclub/app-pagseguro/commit/dfd8072e7a293ff8a00263600b743f0070af4ffc))

## [1.0.0](https://github.com/ecomclub/app-pagseguro/compare/v0.5.52...v1.0.0) (2020-06-17)


### Features

* **admin-settings:** installments config (max number, min installment) ([e4f192a](https://github.com/ecomclub/app-pagseguro/commit/e4f192a9a501a3941a3d68ccd5944698f4b0b173))


### Bug Fixes

* **debug:** fix objects to log and error response ([9ed36d7](https://github.com/ecomclub/app-pagseguro/commit/9ed36d7399684bc2baad264e85260710cb932190))
* **list-payments:** fix handling installments, with config options ([565c2ee](https://github.com/ecomclub/app-pagseguro/commit/565c2ee7ae496f12aecec3441a476bff32254c55))

### [0.5.52](https://github.com/ecomclub/app-pagseguro/compare/v0.5.50...v0.5.52) (2020-05-22)


### Bug Fixes

* **list-payments:** check if `installmentsOption` is defined ([603ff09](https://github.com/ecomclub/app-pagseguro/commit/603ff0983d84315255bc6d32f6d99564e43fb95b))
* **pagseguro-webhook:** fix checking duplicated status notification ([657fc39](https://github.com/ecomclub/app-pagseguro/commit/657fc391b0eb89668e22b70bbb884a8ad0d72da0))

### [0.5.51](https://github.com/ecomclub/app-pagseguro/compare/v0.5.50...v0.5.51) (2020-07-19)


### Features

* **application.json:** enabled installments_option ([51f2c68](https://github.com/ecomclub/app-pagseguro/commit/51f2c685ab054dc0af4002cd40020c079d611478))

### [0.5.50](https://github.com/ecomclub/app-pagseguro/compare/v0.5.48...v0.5.50) (2020-05-19)


### Bug Fixes

* **list-payments:** preventing errors with discount ([0f50b3a](https://github.com/ecomclub/app-pagseguro/commit/0f50b3aa925aef7af6d58747d541ec1bedb1a3b3))
* **pagseguro-client:** fix 'trimString' internal function (check string) ([b4db9c6](https://github.com/ecomclub/app-pagseguro/commit/b4db9c676971ac114c423db8215239992cef3361))

### [0.5.49](https://github.com/ecomplus/app-pagseguro/compare/v0.5.48...v0.5.49) (2020-05-15)


### Bug Fixes

* **pagseguro-client:** fix 'trimString' internal function (check string) ([b4db9c6](https://github.com/ecomplus/app-pagseguro/commit/b4db9c676971ac114c423db8215239992cef3361))

### [0.5.48](https://github.com/ecomclub/app-pagseguro/compare/v0.5.47...v0.5.48) (2020-05-12)


### Bug Fixes

* **pagseguro-orders-update:** fix startup, filter by order creation date and limit results ([5c79467](https://github.com/ecomclub/app-pagseguro/commit/5c7946704ace2522c3674b1bd7a37231b7849703))

### [0.5.47](https://github.com/ecomclub/app-pagseguro/compare/v0.5.44...v0.5.47) (2020-05-12)


### Features

* pagseguro orders background status updater ([c57c600](https://github.com/ecomclub/app-pagseguro/commit/c57c600ed421a65bdcc51b1e762a351410038854))
* **pagseguro:** fetch transaction by transactionCode ([5b9eebe](https://github.com/ecomclub/app-pagseguro/commit/5b9eebe11a65c97e7a7a8713d7ee75f371dafc86))


### Bug Fixes

* **webhook:** debug failed webhooks with notification code/type ([1ed2d5d](https://github.com/ecomclub/app-pagseguro/commit/1ed2d5dc93721634c75da38880b79d17209c63d2))
* **webhook:** prevent skipping transaction status 4 ("disponível") ([ae97103](https://github.com/ecomclub/app-pagseguro/commit/ae97103a9bf99987eae4241bbdbf6318d745abd2))
* **webhook:** resolve promise and return 200 if status should be skiped ([58af2e2](https://github.com/ecomclub/app-pagseguro/commit/58af2e272e301fa5920af5d33e2f11400b173e04))

### [0.5.46](https://github.com/ecomplus/app-pagseguro/compare/v0.5.45...v0.5.46) (2020-05-11)


### Bug Fixes

* **webhook:** debug failed webhooks with notification code/type ([1ed2d5d](https://github.com/ecomplus/app-pagseguro/commit/1ed2d5dc93721634c75da38880b79d17209c63d2))

### [0.5.45](https://github.com/ecomplus/app-pagseguro/compare/v0.5.44...v0.5.45) (2020-05-09)


### Bug Fixes

* **webhook:** prevent skipping transaction status 4 ("disponível") ([ae97103](https://github.com/ecomplus/app-pagseguro/commit/ae97103a9bf99987eae4241bbdbf6318d745abd2))
* **webhook:** resolve promise and return 200 if status should be skiped ([58af2e2](https://github.com/ecomplus/app-pagseguro/commit/58af2e272e301fa5920af5d33e2f11400b173e04))

### [0.5.44](https://github.com/ecomclub/app-pagseguro/compare/v0.5.43...v0.5.44) (2020-05-09)


### Bug Fixes

* **webhook:** returning status 500 when no order is found ([2d66061](https://github.com/ecomclub/app-pagseguro/commit/2d66061ac096712400921560d1a87de605e016d7))

### [0.5.43](https://github.com/ecomclub/app-pagseguro/compare/v0.5.42...v0.5.43) (2020-05-06)


### Bug Fixes

* app_id ([ea15c3e](https://github.com/ecomclub/app-pagseguro/commit/ea15c3e86bb8b7e1bc5a7e31af2bf4e8cf6321a7))
* close window after callback ([4b09c52](https://github.com/ecomclub/app-pagseguro/commit/4b09c52b4ea904504a0dd2de8fa0df96f415a656))
* market:publish script ([6465a56](https://github.com/ecomclub/app-pagseguro/commit/6465a56d0db3065d5a928607e3ade3f16389375b))

### [0.5.42](https://github.com/ecomclub/app-pagseguro/compare/v0.5.41...v0.5.42) (2020-04-16)


### Bug Fixes

* **list-payments:** url secure for icons ([43e9050](https://github.com/ecomclub/app-pagseguro/commit/43e905074c8cf58f514ae8564e0c0610547e7961))

### [0.5.41](https://github.com/ecomclub/app-pagseguro/compare/v0.5.40...v0.5.41) (2020-04-16)


### Bug Fixes

* **list-payments:** disabled credit_card ([35513f6](https://github.com/ecomclub/app-pagseguro/commit/35513f6c36c7c2f9c1edd06824bfbe80805c51f8))

### 0.5.40 (2020-04-16)


### Features

* application database ([259bc78](https://github.com/ecomclub/app-pagseguro/commit/259bc785e3878ee6d91bf8241ca270c56a43ba44))
* application default config ([da54ce3](https://github.com/ecomclub/app-pagseguro/commit/da54ce313742a986a40fe44c24f755573a20af45))
* create_transaction module responses ([6388cba](https://github.com/ecomclub/app-pagseguro/commit/6388cba8698fb6a4c0e6d75dc7f7459fe0229d20))
* **client:** generate session ([60fd599](https://github.com/ecomclub/app-pagseguro/commit/60fd599bcbb181e9f530abd60a7f89cff2f3fc5b))
* list_payment ([589bcb9](https://github.com/ecomclub/app-pagseguro/commit/589bcb9ed1e88a7cd32c66da1a342c3e4de35e1e))
* module create-transaction ([c797f5a](https://github.com/ecomclub/app-pagseguro/commit/c797f5a62aa153a5ed424dc4d6d463e09cf17d51))
* Pagseguro client for E-Com Plus apps ([458e5b1](https://github.com/ecomclub/app-pagseguro/commit/458e5b1ed212257a6b44d0ff14de6a8088638020))
* **notifications:** pagseguro handler ([fb13710](https://github.com/ecomclub/app-pagseguro/commit/fb13710acb42d28a652c42620dc61008debd0751))
* pagseguro fallback script ([0597754](https://github.com/ecomclub/app-pagseguro/commit/059775411736dbcae237d09da821b5d4fcd436be))
* **api:** get notifications ([b371b12](https://github.com/ecomclub/app-pagseguro/commit/b371b12dd08189d45f1f3b5b95b520721ae665ca))
* **assets:** load pagseguro-direct-payment from local ([6b92377](https://github.com/ecomclub/app-pagseguro/commit/6b92377ebc663c51bb60e043eb120579ee0210a1))
* **create_transaction:** uses installment options available in PagSeguro ([b39adb0](https://github.com/ecomclub/app-pagseguro/commit/b39adb008e9257e6e892f98503f603a056968d8c))
* **list_payment:** shows installment options available in PagSeguro ([c276132](https://github.com/ecomclub/app-pagseguro/commit/c276132092f644275c47945caffaeacaf17dc51a))
* **list_payment:** shows installment options available in PagSeguro ([d1c2fd7](https://github.com/ecomclub/app-pagseguro/commit/d1c2fd7813d9de9ec9721732789cf29897c9545a))
* **module:** create-transaction credit card response ([0ad262f](https://github.com/ecomclub/app-pagseguro/commit/0ad262fb67ec92e10d0fdd04c30d05cd27ca4e16))
* **module:** save transaction code after checkout ([a353751](https://github.com/ecomclub/app-pagseguro/commit/a3537517ebcbdb4124ea5a7d6a6cc0f35959d066))
* **notifications:** pagseguro handler ([ac69530](https://github.com/ecomclub/app-pagseguro/commit/ac69530f90a39670eb6686f92ebacc150e9065ce))
* **pagseguro:** card getHash, getBrand ([4f6cfe0](https://github.com/ecomclub/app-pagseguro/commit/4f6cfe015f86c02784c7625a905872351998ae79))
* **pagseguro-client.js:** accept discount coupon ([7d31929](https://github.com/ecomclub/app-pagseguro/commit/7d31929e721e1fe22785edccaa94f51fa4849845))
* **pagseguro-transactions.js:** save notification_code ([37bda3b](https://github.com/ecomclub/app-pagseguro/commit/37bda3b7e4ae8f484eb819bc0eb7bd03ba887cc7))
* **pagseguro-transactions.js:** save notification_code ([c3bcbbd](https://github.com/ecomclub/app-pagseguro/commit/c3bcbbd8a6a429c3897cf4e0f94bc4b4c284314f))
* **pay:** process checkout with credit card ([d93d030](https://github.com/ecomclub/app-pagseguro/commit/d93d030eeac7e38a48f343fa0764bd40314ed852))
* pagseguro oauth ([e8623bf](https://github.com/ecomclub/app-pagseguro/commit/e8623bfb8a2d751b3a82080cd861d8f2ec9f7e89))
* pagseguro oauth callback handler ([d4106fa](https://github.com/ecomclub/app-pagseguro/commit/d4106fafbe577e47e2da428c12bb16929baf76f3))
* pagseguro routes ([6ed6a23](https://github.com/ecomclub/app-pagseguro/commit/6ed6a2317fb81381bd3ad74c5dd22e6731290394))
* PagSeguroDirectPayment ([bc08170](https://github.com/ecomclub/app-pagseguro/commit/bc081708652305c65f29a2dccb83c1ca32b6bc95))
* return discount_option and installments_option ([97f15fc](https://github.com/ecomclub/app-pagseguro/commit/97f15fc9e1fb08931300bd9b9712d50d09c6514a))
* returning intermediator_buyer_id to checkout ([b1818e3](https://github.com/ecomclub/app-pagseguro/commit/b1818e31eaba433a5d73c16f3449a818c7ef2949))
* using sender.hash for payment with banking_billet ([85b619e](https://github.com/ecomclub/app-pagseguro/commit/85b619e8566aea89afd5e50b0b0f920252bdfa4a))
* **route:** pagseguro/webhook ([c173475](https://github.com/ecomclub/app-pagseguro/commit/c173475e4bd3b8fadd6af6f1d2308be32ce2cb43))


### Bug Fixes

* **card-transaction:** fallbacks to session/installments before creating payment ([ad56118](https://github.com/ecomclub/app-pagseguro/commit/ad5611858d13773e6c928d7a45b82bf763197ece))
* **card-transaction:** fix checking fetch installment before fallbacks ([c198e25](https://github.com/ecomclub/app-pagseguro/commit/c198e25f30d1fb985f9ffc629473095c905eb44a))
* **create_transaction:** parse item.price to float ([fbc996d](https://github.com/ecomclub/app-pagseguro/commit/fbc996de60c7b301c002cd439607425e21852209))
* **list_payment:** sessionId like a string ([02abc30](https://github.com/ecomclub/app-pagseguro/commit/02abc30b51abc4fb36e49b184ede64257b684d9e))
* pagseguro response validation ([f9c21e1](https://github.com/ecomclub/app-pagseguro/commit/f9c21e12e70df9488d05257abfa6f3892a1b6e70))
* **list_payment:** show installment_options only when installment.number > 1 ([da2d80d](https://github.com/ecomclub/app-pagseguro/commit/da2d80dfc44b03a3448c650a0a73319eeac47451))
* **list-payment:** check amount before trying installments list ([dc44063](https://github.com/ecomclub/app-pagseguro/commit/dc44063ea71b90e2a59a262c2addf6738ddd4902))
* **list-payments:** preventing errors ECONNRESET && ENOTFOUND ([4a7d84e](https://github.com/ecomclub/app-pagseguro/commit/4a7d84e655c08053c5c9419cfc7a70df77ec7c5d))
* **list-payments:** replace async/await with promises correctly, fallback for get installments ([70d629d](https://github.com/ecomclub/app-pagseguro/commit/70d629d3cdbd172b5a30cf94ce088b5636e4f762))
* **list-payments:** skip creating new session and installments on checkout confirmation ([b108415](https://github.com/ecomclub/app-pagseguro/commit/b108415fd37a78013044e023401e5411c1158236))
* **list-payments:** trying to set ps installments on client and pass to hash ([87bfa81](https://github.com/ecomclub/app-pagseguro/commit/87bfa81e12a0a36c9a4f1cbea14a1a6da8fca317))
* **map-items:** try final price, fallback to price ([6740a61](https://github.com/ecomclub/app-pagseguro/commit/6740a618382d42e182d3e5babbef0f2ce3a073e7))
* payment_icon ([8ffbfbe](https://github.com/ecomclub/app-pagseguro/commit/8ffbfbeaad0f08a7b0768fba240dce44f75612f3))
* **pagseguro-client:** preventing errors with addresses without number ([79c340a](https://github.com/ecomclub/app-pagseguro/commit/79c340a91282ea4bdf8c37839a8029cd97df9316))
* parseFloat for installment.value ([82d8f76](https://github.com/ecomclub/app-pagseguro/commit/82d8f76680753d0417868e109f0f852f0592673c))
* **pagseguro-client:** skip installment value calulation when not needed ([8c7884d](https://github.com/ecomclub/app-pagseguro/commit/8c7884ddb92aefe811fd69ab5b3d965c55645986))
* cleartimeout after 5 attempts ([81cb9dc](https://github.com/ecomclub/app-pagseguro/commit/81cb9dceff031b9d3789d7276d923bfb2dc5e470))
* close window when oauth is finish ([dc081c6](https://github.com/ecomclub/app-pagseguro/commit/dc081c6c2c434b5e47bd8addca11a702028ef553))
* get body from request ([02ad4de](https://github.com/ecomclub/app-pagseguro/commit/02ad4de0ee91781cf18ee8b9baa9f6ae644da126))
* get card brand name with fallback ([8a9e08f](https://github.com/ecomclub/app-pagseguro/commit/8a9e08fb94d26dce1a92ee2a2e4605c9a4186e03))
* parse string ([edc39b8](https://github.com/ecomclub/app-pagseguro/commit/edc39b8645256b2f93e964a92a79c4c2e6b9d514))
* preventing error if the order does not have the transactions property ([048331d](https://github.com/ecomclub/app-pagseguro/commit/048331d691d3bc04551550609eae1216bbc07b42))
* preventing errors when there is no number in the address ([f2a0455](https://github.com/ecomclub/app-pagseguro/commit/f2a0455b9e928f741b69dcf27676e606979e30fe))
* preventing finalizing the purchase when credit card is chosen ([cc1d5fa](https://github.com/ecomclub/app-pagseguro/commit/cc1d5fae15d4d76a5a117085db1310453c052348))
* prevents sending invalid number to pagseguro ([2f139d3](https://github.com/ecomclub/app-pagseguro/commit/2f139d31879a6df0e48bf5b5f1a094867280e9b5))
* put the transaction in a queue if there is no payment_history in the order ([b29bb32](https://github.com/ecomclub/app-pagseguro/commit/b29bb326b24d98b048ea08c3edb515dd7f2853eb))
* response module with valid schema ([0a4b46c](https://github.com/ecomclub/app-pagseguro/commit/0a4b46cce2e2c5d3cf5a3236c84fa038ca978990))
* save error message ([bba51a2](https://github.com/ecomclub/app-pagseguro/commit/bba51a21c8e04aa75efd328e1525c77fa4e5f799))
* update onload function ([aaa87b5](https://github.com/ecomclub/app-pagseguro/commit/aaa87b5ff76cf9cf8d936bfc7e1a646dd0ca83f1))
* update onload functions ([99b4fea](https://github.com/ecomclub/app-pagseguro/commit/99b4fea9b96e2c9dab565aa87868ed11cd5bb75e))
* **pagseguro-lib:** fix rounding amount total ([8a14fe9](https://github.com/ecomclub/app-pagseguro/commit/8a14fe9e6fc65f9cdc2ec0086057d7c951755398))
* **pagseguro-webhook:** handling retry correctly ([1001fdb](https://github.com/ecomclub/app-pagseguro/commit/1001fdb865792ba04872cd4ce44246fdacba4fb4))
* **payment-default.js:** fix icon links ([dfe936c](https://github.com/ecomclub/app-pagseguro/commit/dfe936cd4d17d67308ac5837c2a397f895eda9b2))
* **routes:** code refactor, async function where needed only ([7519632](https://github.com/ecomclub/app-pagseguro/commit/7519632c23c387d8864b9a8cb94795cfd3b194e2))
* **typo:** "Cartão Crédito" ([3c56dbb](https://github.com/ecomclub/app-pagseguro/commit/3c56dbb4f36991618b63ee915c1a8d54a068774f))
* **typo:** edit payment method labels, fix "Cartão de crédito" ([5bc8723](https://github.com/ecomclub/app-pagseguro/commit/5bc8723904d7121a4a43db8d2afda2323dd2cc3d))
