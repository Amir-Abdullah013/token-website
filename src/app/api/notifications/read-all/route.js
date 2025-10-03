import { NextResponse } from 'next/server';
// PUT /api/notifications/read-all - Mark all user notifications as read
export async function PUT(request) {
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
    // Get current user
    const user = await authHelpers.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mark all notifications as read
    const result = await databaseHelpers.notifications.markAllAsRead(user.id);

    return NextResponse.json({
      success: true,
      updated: result.updated
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}



