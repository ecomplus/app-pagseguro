# app-pagseguro
 E-Com Plus app to integrate PagSeguro


Environment variables

Env | Value
---------|--------
PS_APP_ID  | Pagseguro Application ID
PS_APP_KEY  | Pagseguro Application Key
PS_APP_SANDBOX  | Pagseguro env [default false]
PS_APP_REDIRECT_URI | Pagseguro Oauth callback url
PS_APP_NOTIFICATION_URL | Pagseguro webhooks url

## Production server

Published at https://pagseguro.ecomplus.biz

### Continuous deployment

When app version is **production ready**,
[create a new release](https://github.com/ecomclub/app-pagseguro/releases)
to run automatic deploy from `master` branch.
