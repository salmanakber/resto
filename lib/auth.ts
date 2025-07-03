import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// Define the token type
interface Token {
  role?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  otpEnabled?: boolean;
  restaurantId?: string;
}

// Define the user type
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  otpEnabled: boolean;
  restaurantId?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password are required")
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              role: true // Include role information
            }
          })

          if (!user) {
            console.error("User not found:", credentials.email)
            throw new Error("Invalid email or password")
          }

          if (!user.password) {
            console.error("User has no password set:", credentials.email)
            throw new Error("Invalid login method")
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.error("Invalid password for user:", credentials.email)
            throw new Error("Invalid email or password")
          }

          // Check if email verification is required
          const emailVerificationSetting = await prisma.setting.findFirst({
            where: { key: 'email_verification_required' }
          })

          const requireEmailVerification = emailVerificationSetting?.value === 'true'

          if (requireEmailVerification && !user.emailVerified) {
            // Instead of throwing an error, return a special object indicating verification needed
            return {
              id: user.id,
              email: user.email,
              name: `${user.firstName} ${user.lastName}`,
              role: user.roleId,
              emailVerified: false,
              phoneVerified: user.phoneVerified,
              otpEnabled: user.otpEnabled,
              requiresVerification: true,
              verificationType: 'email',
              restaurantId: user.restaurantId
            }
          }

          // Check if phone verification is required
          if (!user.phoneVerified) {
            return {
              id: user.id,
              email: user.email,
              name: `${user.firstName} ${user.lastName}`,
              role: user.roleId,
              emailVerified: user.emailVerified,
              phoneVerified: false,
              otpEnabled: user.otpEnabled,
              restaurantId: user.restaurantId
            }
          }

          // Check if OTP is enabled for this user
          if (user.otpEnabled) {
            return {
              id: user.id,
              email: user.email,
              name: `${user.firstName} ${user.lastName}`,
              role: user.roleId,
              emailVerified: user.emailVerified,
              phoneVerified: user.phoneVerified,
              otpEnabled: true,
              requiresOTP: true
            }
          }

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.roleId,
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified,
            otpEnabled: user.otpEnabled,
            restaurantId: user.restaurantId
          }
        } catch (error) {
          console.error("Auth error:", error)
          throw error
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.emailVerified = user.emailVerified;
        token.phoneVerified = user.phoneVerified;
        token.otpEnabled = user.otpEnabled;
        token.restaurantId = (user as any).restaurantId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.emailVerified = token.emailVerified as boolean;
        session.user.phoneVerified = token.phoneVerified as boolean;
        session.user.otpEnabled = token.otpEnabled as boolean;
        session.user.restaurantId = token.restaurantId as string;
      }
      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      try {
        // If this is a credentials login, check for OTP requirement
        if (account?.provider === "credentials") {
          // For credentials login, we'll handle the verification in the authorize callback
          return true
        }
        
        // For social logins, check if the user exists and has OTP enabled
        if (user.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          })
          
          if (dbUser) {
            // Check if email or phone verification is required but not completed
            if (!dbUser.emailVerified || !dbUser.phoneVerified) {
              // Return true to allow sign in, but the client will handle verification
              return true
            }
            
            // If OTP is enabled, we need to handle this differently
            if (dbUser.otpEnabled) {
              // Return true to allow sign in, but the client will handle OTP
              return true
            }
          }
        }
        
        return true
      } catch (error) {
        console.error("Sign in error:", error)
        return false
      }
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? `__Secure-next-auth.session-token`
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.callback-url`
        : 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? `__Host-next-auth.csrf-token`
        : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
} 