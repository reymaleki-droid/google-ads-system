/**
 * Authentication Utilities for Multi-Tenant SaaS
 * 
 * Provides helpers for:
 * - Server-side session validation
 * - User role checking (customer vs admin)
 * - Authenticated Supabase client creation
 * 
 * Usage:
 * - In Server Components: await getServerUser()
 * - In API Routes: await requireAuth(request)
 * - For admin routes: await requireAdmin(request)
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from './database.types';

export interface AuthUser {
  id: string;
  email: string | undefined;
  role: 'customer' | 'admin';
}

/**
 * Get authenticated user from server-side context
 * Returns null if not authenticated
 * 
 * @example
 * const user = await getServerUser();
 * if (!user) redirect('/login');
 */
export async function getServerUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  // Fetch user role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!roleData) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: roleData.role as 'customer' | 'admin',
  };
}

/**
 * Create authenticated Supabase client for server-side use
 * Automatically uses user's JWT token (respects RLS policies)
 * 
 * @example
 * const supabase = createAuthenticatedClient();
 * const { data: leads } = await supabase.from('leads').select('*');
 * // Returns only leads where customer_id = auth.uid()
 */
export async function createAuthenticatedClient() {
  const cookieStore = await cookies();
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle error in middleware where cookies are read-only
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handle error in middleware
          }
        },
      },
    }
  );
}

/**
 * Require authentication in API routes
 * Returns AuthUser or throws 401 error
 * 
 * @example
 * export async function GET(request: NextRequest) {
 *   const user = await requireAuth();
 *   // user is guaranteed to exist here
 * }
 */
export async function requireAuth(request?: NextRequest): Promise<AuthUser> {
  const user = await getServerUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

/**
 * Require admin role in API routes
 * Returns AuthUser or throws 403 error
 * 
 * @example
 * export async function GET(request: NextRequest) {
 *   const admin = await requireAdmin();
 *   // admin role is guaranteed
 * }
 */
export async function requireAdmin(request?: NextRequest): Promise<AuthUser> {
  const user = await requireAuth();
  
  if (user.role !== 'admin') {
    throw new Error('Forbidden - Admin access required');
  }
  
  return user;
}

/**
 * Check if current user is admin (boolean helper)
 * 
 * @example
 * const isAdmin = await checkIsAdmin();
 * if (isAdmin) {
 *   // Show admin-only features
 * }
 */
export async function checkIsAdmin(): Promise<boolean> {
  const user = await getServerUser();
  return user?.role === 'admin';
}

/**
 * Check if current user is customer (boolean helper)
 */
export async function checkIsCustomer(): Promise<boolean> {
  const user = await getServerUser();
  return user?.role === 'customer';
}
