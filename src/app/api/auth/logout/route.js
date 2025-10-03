import { NextResponse } from 'next/server';

export async function POST(request) {
    // Dynamic import helper
    const loadModules = async () => {
      const modules = {};
      try {
        if (content.includes('databaseHelpers.')) {
          const dbModule = await import('@/lib/database');
          modules.databaseHelpers = dbModule.databaseHelpers;
        }
        if (content.includes('authHelpers.')) {
          const authModule = await import('@/lib/supabase');
          modules.authHelpers = authModule.authHelpers;
        }
        if (content.includes('prisma.')) {
          const prismaModule = await import('@/lib/prisma');
          modules.prisma = prismaModule.prisma;
        }
        if (content.includes('supabase.')) {
          const supabaseModule = await import('@/lib/supabase');
          modules.supabase = supabaseModule.supabase;
        }
      } catch (error) {
        console.warn('Modules not available:', error.message);
        throw new Error('Required modules not available');
      }
      return modules;
    };
    
    const { databaseHelpers, authHelpers, prisma, supabase } = await loadModules();

  try {
    // Try to load supabase dynamically
    let supabase;
    try {
      const supabaseModule = await import('@/lib/supabase');
      supabase = supabaseModule.supabase;
    } catch (error) {
      console.warn('Supabase not available:', error.message);
      // Continue with logout even if supabase is not available
    }

    // Sign out from Supabase if available
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase logout error:', error);
      }
    }

    // Create response
    const response = NextResponse.json({ success: true });
    
    // Clear any session cookies (Supabase handles its own cookies)
    response.cookies.set('sb-access-token', '', {
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    response.cookies.set('sb-refresh-token', '', {
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to logout' },
      { status: 500 }
    );
  }
}








