declare module 'jwt-decode' {
  export interface JwtPayload {
    exp?: number;
    [key: string]: any;
  }

  export default function jwtDecode<T = JwtPayload>(token: string): T;
}
