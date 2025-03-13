declare module 'passport-jwt' {
  import { Strategy as PassportStrategy } from 'passport';

  export interface StrategyOptions {
    secretOrKey?: string;
    jwtFromRequest: (req: any) => string | null;
    issuer?: string;
    audience?: string;
    algorithms?: string[];
    ignoreExpiration?: boolean;
    passReqToCallback?: boolean;
  }

  export interface VerifiedCallback {
    (error: any, user?: any, info?: any): void;
  }

  export interface VerifyCallback {
    (payload: any, done: VerifiedCallback): void;
  }

  export class Strategy extends PassportStrategy {
    constructor(options: StrategyOptions, verify: VerifyCallback);
    constructor(options: StrategyOptions, verify: (payload: any, done: VerifiedCallback) => void);
  }

  export namespace ExtractJwt {
    export function fromAuthHeaderAsBearerToken(): (request: any) => string | null;
    export function fromHeader(header_name: string): (request: any) => string | null;
    export function fromBodyField(field_name: string): (request: any) => string | null;
    export function fromUrlQueryParameter(param_name: string): (request: any) => string | null;
    export function fromExtractors(extractors: Array<(request: any) => string | null>): (request: any) => string | null;
  }
}
