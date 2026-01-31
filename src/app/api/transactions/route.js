import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const filter = searchParams.get('filter') || 'all';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Fetch real transactions from database
    let transactions = [];
    let totalCount = 0;

    try {
      // Build query based on filter
      let query = `
        SELECT 
          id,
          "userId",
          type,
          amount,
          status,
          gateway,
          description,
          "createdAt"
        FROM transactions 
        WHERE "userId" = $1
      `;
      
      const params = [userId];
      
      // Add filter condition if specified
      if (filter !== 'all') {
        const lowerFilter = filter.toLowerCase();
        
        // Handle special gateway-based types
        if (['plan_purchase', 'referral_reward'].includes(lowerFilter)) {
             query += ` AND LOWER(gateway) = $2`; 
             params.push(lowerFilter);
        }
        // Handle standard types
        else if (['deposit', 'withdraw', 'buy', 'sell', 'transfer'].includes(lowerFilter)) {
          query += ` AND LOWER(type) = $2`;
          params.push(lowerFilter);
        } else {
          // Handle status
          query += ` AND LOWER(status) = $2`;
          params.push(lowerFilter);
        }
      }
      
      // Get total count BEFORE adding ORDER BY
      const countQuery = query.replace(/SELECT.*FROM/s, 'SELECT COUNT(*) as total FROM');
      const countResult = await databaseHelpers.pool.query(countQuery, params);
      totalCount = parseInt(countResult.rows[0]?.total || 0);
      
      // Order by most recent first
      query += ` ORDER BY "createdAt" DESC`;
      
      // Add pagination
      const offset = (page - 1) * limit;
      query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
      
      // Execute query
      const result = await databaseHelpers.pool.query(query, params);
      transactions = result.rows.map(tx => {
        // Determine effective type for UI
        let effectiveType = tx.type.toLowerCase();
        if (tx.gateway && (tx.gateway === 'PLAN_PURCHASE' || tx.gateway === 'REFERRAL_REWARD')) {
            effectiveType = tx.gateway.toLowerCase();
        }

        return {
            id: tx.id,
            $id: tx.id,
            userId: tx.userId,
            type: effectiveType,
            amount: parseFloat(tx.amount),
            currency: 'USD', // All amounts are in USD
            status: tx.status.toLowerCase(),
            gateway: tx.gateway || 'N/A',
            description: tx.description || '',
            createdAt: tx.createdAt
        };
      });
      
    } catch (dbError) {
      console.error('Database error fetching transactions:', dbError);
      // Return empty array if database error
      transactions = [];
      totalCount = 0;
    }

    return NextResponse.json({
      transactions,
      total: totalCount,
      page,
      limit,
      hasMore: (page * limit) < totalCount
    });

  } catch (error) {
    console.error('Transactions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, type, amount, gateway, description, status } = body;

    if (!userId || !type || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, amount' },
        { status: 400 }
      );
    }

    // Create transaction in database
    try {
      const transaction = await databaseHelpers.transaction.createTransaction({
        userId,
        type: type.toUpperCase(),
        amount: parseFloat(amount),
        gateway: gateway || 'default',
        description: description || `${type} transaction`,
        status: status || 'PENDING'
      });

      return NextResponse.json({
        success: true,
        transaction: {
          id: transaction.id,
          $id: transaction.id,
          userId: transaction.userId,
          type: transaction.type.toLowerCase(),
          amount: parseFloat(transaction.amount),
          currency: 'USD',
          status: transaction.status.toLowerCase(),
          gateway: transaction.gateway,
          description: transaction.description,
          createdAt: transaction.createdAt
        }
      });

    } catch (dbError) {
      console.error('Database error creating transaction:', dbError);
      return NextResponse.json(
        { error: 'Failed to create transaction in database' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Create transaction API error:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}














