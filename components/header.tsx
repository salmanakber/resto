"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, User, Settings, LogOut, HelpCircle, History, CreditCard, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSession, signOut } from "next-auth/react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface HeaderProps {
  showBackButton?: boolean
  title?: string
  requireAuth?: boolean
  brandAssets?: any
}

export function Header({ showBackButton = true, title, requireAuth = false, brandAssets }: HeaderProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [userData, setUserData] = useState<{
    emailVerified: boolean;
    phoneVerified: boolean;
    profileImage: string;
  } | null>(null);

  


  // Fetch user data when session changes
  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch(`/api/users/me`);
          if (response.ok) {
            const data = await response.json();
            setUserData(data);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [session]);

  // Check authentication and email verification for protected routes
  useEffect(() => {
    if (requireAuth && status === "unauthenticated") {
      toast.error("Please sign in to access this page")
      // Get the current path for the callback URL
      const currentPath = window.location.pathname;
      router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
    }

    // Check email verification status
    if (status === "authenticated" && session?.user && userData) {
      // Skip verification check for these paths
      const skipVerificationPaths = ['/verify-email', '/login', '/signup'];
      const currentPath = window.location.pathname;
      
      // Redirect only if both email AND phone are not verified
      if (!skipVerificationPaths.includes(currentPath) && 
          !userData.emailVerified && 
          !userData.phoneVerified) {
            toast.error("Please verify your email or phone number to access this page")
        // router.push(`/verify?callbackUrl=${encodeURIComponent(currentPath)}`);
      }

    }
 
  }, [requireAuth, status, router, toast, session, userData])

  // If authentication is required and user is not authenticated, show loading state
  if (requireAuth && status === "loading") {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-2"
                  onClick={() => router.back()}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}
            </div>
            <div className="flex items-center justify-center">
              {title ? (
                <h1 className="text-lg font-semibold">{title}</h1>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="bg-[#e41e3f] text-white p-2 rounded-md">
                    {brandAssets?.logo ? (
                      <Image
                        src={brandAssets.logo}
                        alt="Logo"
                        width={32}
                        height={32}
                        className="object-contain"
                      />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                        <path
                          d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
                          fill="currentColor"
                        />
                        <path
                          d="M15.88 8.29L10.29 13.88C10.2 13.97 10.1 14 10 14C9.9 14 9.8 13.97 9.71 13.88L8.12 12.29C7.93 12.1 7.93 11.8 8.12 11.61C8.31 11.42 8.61 11.42 8.8 11.61L10 12.81L15.2 7.61C15.39 7.42 15.69 7.42 15.88 7.61C16.07 7.8 16.07 8.09 15.88 8.29Z"
                          fill="currentColor"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end">
              <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full overflow-hidden border border-border hover:border-primary">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
              </Button>
            </div>
          </div>
        </div>
      </header>
    )
  }

  // If authentication is required and user is not authenticated, don't render the full header
  if (requireAuth && status === "unauthenticated") {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex flex-1 items-center justify-between">
          {/* Left side - Back button */}
          <div className="flex items-center">
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon"
                className="mr-2"
                onClick={() => router.back()}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Center - Logo/Title */}
          <div className="flex items-center justify-center">
            {title ? (
              <h1 className="text-lg font-semibold">{title}</h1>
            ) : (
              <Link href="/" className="flex items-center space-x-2">
                
                  {brandAssets?.logo ? (
                    <Image
                      src={brandAssets.logo}
                      alt="Logo"
                      width={150}
                      height={32}
                      className="object-contain"
                    />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                      <path
                        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
                        fill="currentColor"
                      />
                      <path
                        d="M15.88 8.29L10.29 13.88C10.2 13.97 10.1 14 10 14C9.9 14 9.8 13.97 9.71 13.88L8.12 12.29C7.93 12.1 7.93 11.8 8.12 11.61C8.31 11.42 8.61 11.42 8.8 11.61L10 12.81L15.2 7.61C15.39 7.42 15.69 7.42 15.88 7.61C16.07 7.8 16.07 8.09 15.88 8.29Z"
                        fill="currentColor"
                      />
                    </svg>
                  )}  
                
              </Link>
            )}
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center justify-end">
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full overflow-hidden border border-border hover:border-primary">
                    {userData?.profileImage ? (
                      <Image
                        src={userData?.profileImage}
                        alt={session.user.name || "User"}
                        fill
                        sizes="36px"
                        className="object-cover"
                        priority
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session?.user?.name || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session?.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account#profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account#orders" className="flex items-center">
                      <History className="mr-2 h-4 w-4" />
                      <span>Order History</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account#payment" className="flex items-center">
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Payment Methods</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account#preferences" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/help" className="flex items-center">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>Help & Support</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center text-red-600 focus:text-red-600"
                    onClick={async () => {
                      try {
                        await signOut({ redirect: false });
                   
                        console.log('singout');
                        router.push("/login");
                      } catch (error) {
           
                      }
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/cart">
                    <ShoppingCart className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/help">
                    <HelpCircle className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/login">
                    <User className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 