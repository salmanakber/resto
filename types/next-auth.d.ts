import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      emailVerified: boolean;
      phoneVerified: boolean;
      otpEnabled: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    otpEnabled: boolean;
  }
} 