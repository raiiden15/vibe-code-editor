// array of routes which do not require authentication
export const publicRoutes: string[] = [];

// array of routes that are protected, and require authentication
export const protectedRoutes: string[] = [];

// array of routes accessible to the public
export const authRoutes: string[] = [
  "/auth/sign-in", // routes that start with this prefix do not require authentication
];

export const apiAuthPrefix: string = "/api/auth";

export const DEFAULT_LOGIN_REDIRECT = "/";
