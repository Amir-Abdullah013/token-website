import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test the price calculation formula
    const testCases = [
      {
        name: 'Initial State',
        totalTokens: 100000000,
        totalInvestment: 350000,
        expectedPrice: 0.0035
      },
      {
        name: 'After $10,000 Buy',
        totalTokens: 100000000,
        totalInvestment: 360000,
        expectedPrice: 0.0036
      },
      {
        name: 'After $50,000 Buy',
        totalTokens: 100000000,
        totalInvestment: 400000,
        expectedPrice: 0.004
      },
      {
        name: 'After $100,000 Buy',
        totalTokens: 100000000,
        totalInvestment: 450000,
        expectedPrice: 0.0045
      }
    ];

    const results = testCases.map(testCase => {
      const calculatedPrice = testCase.totalInvestment / testCase.totalTokens;
      const isCorrect = Math.abs(calculatedPrice - testCase.expectedPrice) < 0.000001;
      
      return {
        ...testCase,
        calculatedPrice,
        isCorrect,
        formula: `${testCase.totalInvestment} ÷ ${testCase.totalTokens} = ${calculatedPrice.toFixed(6)}`
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Price calculation formula test',
      formula: 'Price = Total Investment ÷ Total Tokens',
      results,
      allCorrect: results.every(r => r.isCorrect)
    });

  } catch (error) {
    console.error('Price calculation test error:', error);
    return NextResponse.json(
      { success: false, error: 'Test failed' },
      { status: 500 }
    );
  }
}












