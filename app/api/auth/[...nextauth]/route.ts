import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { logUserLogin } from "@/lib/logUserLogin";

// Define a custom user type that includes the role property
interface CustomUser {
  id: string;
  email: string;
  name: string;
  role: string;
  otpEnabled: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  validationDone: number;
}

// Function to get provider credentials from settings or env
async function getProviderCredentials(provider: string) {
  // Try to get from settings table first - using lowercase with underscores
  const clientIdSetting = await prisma.setting.findUnique({
    where: { key: `${provider.toLowerCase()}_client_id` }
  });
  
  const clientSecretSetting = await prisma.setting.findUnique({
    where: { key: `${provider.toLowerCase()}_client_secret` }
  });
  
  // Use settings if available, otherwise fall back to env variables
  const clientId = clientIdSetting?.value || process.env[`${provider.toUpperCase()}_CLIENT_ID`];
  const clientSecret = clientSecretSetting?.value || process.env[`${provider.toUpperCase()}_CLIENT_SECRET`];
  
  return { clientId, clientSecret };
}

// Create a function to initialize providers with settings
async function getProviders() {
  const googleCredentials = await getProviderCredentials('google');
  const facebookCredentials = await getProviderCredentials('facebook');
  
  return [
    GoogleProvider({
      clientId: googleCredentials.clientId!,
      clientSecret: googleCredentials.clientSecret!,
    }),
    FacebookProvider({
      clientId: facebookCredentials.clientId!,
      clientSecret: facebookCredentials.clientSecret!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(credentials.email)) {
          throw new Error("Invalid email format");
        }

        // Password minimum requirements
        if (credentials.password.length < 6) {
          throw new Error("Password must be at least 6 characters long");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            role: true,
          },
        });

        if (!user || !user.password) {
          throw new Error("No account found with this email");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Incorrect password");
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role.name,
          otpEnabled: user.otpEnabled,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
        };
      },
    }),
  ];
}

// Create a function to get auth options with dynamic providers
export async function getAuthOptions(): Promise<NextAuthOptions> {
  const providers = await getProviders();
  
  return {
    adapter: PrismaAdapter(prisma) as any,
    session: {
      strategy: "jwt",
    },
    pages: {
      signIn: "/login",
      error: "/login", // Add this to handle errors
    },
    providers,
    callbacks: {
      async jwt({ token, user, trigger , session }) {
        if(trigger === "update") {
            return {...session, ...session.user}
        }
        if (user) {
          await prisma.session.update({
            where: { userId: user.id },
            data: {
              sessionToken: token.jti || token.sub,  // or generate your own unique token
              expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days expiry
              lastActiveAt: new Date(),
            }
          });
          // Cast user to our custom type
          const customUser = user as CustomUser;
          // Get OTP settings from database
          const [otpEmailEnabled, otpPhoneEnabled] = await Promise.all([
            prisma.setting.findUnique({
              where: { key: "OTP_EMAIL_ENABLED" }
            }),
            prisma.setting.findUnique({
              where: { key: "OTP_PHONE_ENABLED" }
            })
          ]);

          return {
            ...token,
            role: customUser.role,
            id: customUser.id,
            otpEnabled: customUser.otpEnabled,
            emailVerified: customUser.emailVerified,
            phoneVerified: customUser.phoneVerified,
            otpEmailEnabled: otpEmailEnabled?.value === "true",
            otpPhoneEnabled: otpPhoneEnabled?.value === "true"
          };
        }
        return token;
      },
      async session({ session, token }) {
        return {
          ...session,
          user: {
            ...session.user,
            id: token.id,
            role: token.role,
            otpEnabled: token.otpEnabled,
            emailVerified: token.emailVerified,
            phoneVerified: token.phoneVerified,
            otpEmailEnabled: token.otpEmailEnabled,
            otpPhoneEnabled: token.otpPhoneEnabled,
            validationDone: token.emailVerified && (token.otpEmailEnabled || token.otpPhoneEnabled) ? 1 : 0
          },
        };
      },
      async signIn({ user, account, profile, email, credentials  }) {
        try {
          // Confirm user exists in DB
          if (user.email) {
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email },
            });
            if (dbUser) {
              // Access request from globalThis
              const req = (globalThis as any).req;
              if (req) {
               const session = await logUserLogin({
                  userId: user.id,
                  req,
                  status: "SUCCESS",
                  sessionToken: '', //session.sessionToken,
                  expires: new Date() // session.expires,
                });
              }
              return true;
            }
          }
          return true;
        } catch (error) {
          console.error("Sign in error:", error);
          return false;
        }
      },
    },
  };
}

// Create the handler with dynamic auth options
const handler = async (req: NextRequest, res: NextResponse) => {
  (globalThis as any).req = req;
  const authOptions = await getAuthOptions();
  return NextAuth(authOptions)(req, res);
};

export { handler as GET, handler as POST }; 