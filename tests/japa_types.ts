import type { ApiClient } from '@japa/api-client'

declare module '@japa/runner' {
  interface TestContext {
    client: ApiClient
  }
}

declare module '@japa/api-client' {
  interface ApiRequest {
    loginAs(user: any, authenticator?: any): this
  }
}
