import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'


interface Token {
  role?: string;
  user?: {
    role?: string;
  };
}


type Role = 'Admin' | 'Customer' | 'Restaurant' | 'Kitchen_boy' | 'Restaurant_supervisor' | 'Restaurant_manager' | 'it_access';

interface RoleAccessRules {
  [key: string]: string[];
}

// Define public routes that don't require authentication
const publicRoutes = [
  '/upload',
  '/api/dine-in/orders',
  '/api/tables/check',
  '/verify',
  '/api/settings',
  '/dashboard',
  '/login',
  '/api/auth/',
  '/api/feedback',
  '/register',
  '/forgot-password',
  '/api/auth',
  '/api/auth/reset-password-otp-verify',
  '/api/public',
  '/api/auth/get-ip',
  '/api/orders',
  '/api/upload',
  '/_next',
  '/static',
  '/favicon.ico',
  '/images',
  '/styles',
  '/scripts',
  '/fonts',
  '/manifest.json',
  '/robots.txt',
  '/sitemap.xml',
  '/api/restaurants/employee',
  '/api/restaurants/employee/:path*',
  '/api/restaurants/employee/:path*',
  '/api/restaurants/employee/:path*',
  '/api/restaurants/employee/:path*',
  '/api/restaurants/employee/:path*',
  '/api/customer_api/',
  '/api/socket/io',
  '/api/notifications',
  '/reset-password',
  
  '/order-confirmation',
    '/cart',
  '/api/user/loyalty-points',
  '/feedback',
]

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  
  

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route))
  
  
  // If it's a public route or has a file extension, allow access
  if (isPublicRoute || path.includes('.')) {
    
    return NextResponse.next()
  }

  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET  }) as Token | null

    // If user is not logged in and trying to access a protected route, redirect to login
    if (!token ) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', path)
      return NextResponse.redirect(loginUrl)
    }

    const verify = await fetch(`${request.nextUrl.origin}/api/auth/sessions/${token.sub}`, {
      cache: 'no-store',
    });
    const dbSession = await verify.json();
      if (!dbSession) {
        await fetch(`${request.nextUrl.origin}/api/admin/sessions/logout-all`, {
          method: 'POST',
        })
        return NextResponse.redirect(new URL('/login', request.url));
      }
      else{
        await fetch(`${request.nextUrl.origin}/api/auth/sessions/${dbSession.id}`, {
          cache: 'no-store',
          method: 'POST',
          body: JSON.stringify({
            session_id: dbSession.id,
          }),
        });
      }
    

    // Get the role from the token - handle both direct and nested role
    const userRole = (token.role || token.user?.role) as string
    
    // If no role is found, redirect to login
    if (!userRole) {
      
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const authPages = ['/login', '/register', '/forgot-password', '/reset-password'];


    // Convert role to lowercase for case-insensitive comparison
    const normalizedRole = userRole as Role
    
    // Define role-based access rules
    const roleAccessRules: RoleAccessRules = {
      Admin: ['/admin', '/restaurant', '/api/admin', '/api/', '/pages/api/notifications'],
      Kitchen_boy: [
        '/openpho-kitchen/v1', 
        '/api/', 
        '/pos', 
        '/restaurant/orders' , 
        '/pages/api/notifications'],
      Customer: [
        '/account', 
        '/cart', 
        '/orders', 
        '/pages/api/notifications', 
        '/dashboard', 
        '/checkout',
        '/order-confirmation',
        '/api/customer_api/',
        '/api/pickup/order',
        '/api/payment',
        '/api/customer_api/orders',
        '/api/payment-methods',
        '/api/profile',
        '/api/addresses',
        '/api/profile/payment-methods',
        '/api/loyalty',
        '/api/notifications',
        '/api/customers/by-user',
        '/api/users/me',
        '/api/profile/otp',
        '/api/notifications'
      ],
      Restaurant:
       [
        '/restaurant/dashboard',
         '/restaurant', 
         '/pos', 
         '/api/menu-categories',
         '/dashboard',
         '/api/restaurant/',
         '/api/restaurant/menu',
         '/api/',
         '/openpho-kitchen/v1',
         '/admin',
         '/pages/api/notifications',
        ],
        It_access: [
          '/api',
          '/restaurant',
          '/pages/api/notifications',
          '/pos',
          '/openpho-kitchen/v1',
        ],
        Restaurant_supervisor: [
          '/restaurant/dashboard',
          '/restaurant/orders',
          '/api',
          '/pages/api/notifications',
          '/pos',
          '/openpho-kitchen/v1',
        ],
        Restaurant_manager: [
          '/restaurant/dashboard',
          '/api',
          '/pages/api/notifications',
          '/pos',
          '/openpho-kitchen/v1',
        ],
   
      
    }
    
    
    

    // Check if the current path is allowed for the user's role
    // const normalizedPath = path.toLowerCase()
    const isAllowedPath = roleAccessRules[normalizedRole]?.some((prefix: string) => path.startsWith(prefix))
    
    if (!isAllowedPath) {
      
      // Redirect to the default route for the user's role
      const defaultRoute = roleAccessRules[normalizedRole]?.[0] || '/dashboard'
      return NextResponse.redirect(new URL(defaultRoute, request.url))
    }

    
    return NextResponse.next()
  } catch (error) {
    
    // In case of error, redirect to login
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - api/upload (upload route)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api/auth|api/upload|_next/static|_next/image|favicon.ico|public).*)',
  ],
}

