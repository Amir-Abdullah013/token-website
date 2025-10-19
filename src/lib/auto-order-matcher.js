/**
 * Automatic Order Matching Service
 * This service runs in the background to automatically execute limit orders
 */

let isRunning = false;
let intervalId = null;

export const autoOrderMatcher = {
  /**
   * Start the automatic order matching service
   * @param {number} intervalMs - Interval in milliseconds (default: 30 seconds)
   */
  async start(intervalMs = 30000) {
    if (isRunning) {
      console.log('⚠️ Auto order matcher is already running');
      return;
    }

    console.log(`🤖 Starting Auto Order Matcher (every ${intervalMs / 1000} seconds)...`);
    isRunning = true;

    // Run immediately on start
    await this.run();

    // Then run at intervals
    intervalId = setInterval(async () => {
      await this.run();
    }, intervalMs);
  },

  /**
   * Stop the automatic order matching service
   */
  stop() {
    if (!isRunning) {
      console.log('⚠️ Auto order matcher is not running');
      return;
    }

    console.log('🛑 Stopping Auto Order Matcher...');
    isRunning = false;
    
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  },

  /**
   * Check if the service is running
   */
  isRunning() {
    return isRunning;
  },

  /**
   * Run the order matching process once
   */
  async run() {
    if (!isRunning) return;

    try {
      console.log('🔄 Auto Order Matcher: Checking for orders to execute...');
      
      // Call the auto-match API endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/cron/auto-match-orders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        console.error('❌ Auto Order Matcher: API call failed:', response.status);
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        if (data.executedCount > 0) {
          console.log(`✅ Auto Order Matcher: Executed ${data.executedCount} orders`);
        } else if (data.skippedCount > 0) {
          console.log(`⏸️ Auto Order Matcher: ${data.skippedCount} orders still waiting`);
        } else {
          console.log('✅ Auto Order Matcher: No pending orders');
        }
      } else {
        console.error('❌ Auto Order Matcher: API error:', data.error);
      }

    } catch (error) {
      console.error('❌ Auto Order Matcher: Error:', error.message);
    }
  }
};

// Auto-start in production
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  // Only start in server environment
  autoOrderMatcher.start(30000); // Run every 30 seconds
}

