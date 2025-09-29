export interface DevAuthConfig {
    enabled: boolean;
    username: string;
    passwordSha256: string;
  }
  export interface Environment {
    production: boolean;
    apiBaseUrl: string;
    devAuth: DevAuthConfig;
  }
  