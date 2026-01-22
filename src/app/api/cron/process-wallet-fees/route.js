export async function GET(request) {
  const startTime = Date.now();
  const TIMEOUT_MS = 50_000;

  try {
    const authError = requireCronAuth(request);
    if (authError) return authError;

    console.log('🔄 Wallet fee cron started');

    const result = await Promise.race([
      walletFeeService.processAllDueWalletFees(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Wallet fee cron timeout')), TIMEOUT_MS)
      ),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Wallet fee processing completed',
      result,
      executionTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Wallet fee cron failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
