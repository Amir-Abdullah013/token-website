const { databaseHelpers } = require('./src/lib/database.js');

async function checkSupply() {
  try {
    const supply = await databaseHelpers.tokenSupply.getTokenSupply();
    console.log('📊 Database Token Supply:');
    console.log('Total Supply:', Number(supply.totalSupply));
    console.log('Remaining Supply (legacy):', Number(supply.remainingSupply));
    console.log('User Supply Remaining:', Number(supply.userSupplyRemaining));
    console.log('Admin Reserve:', Number(supply.adminReserve));
    
    console.log('\n🔍 Analysis:');
    console.log('Total Supply should be 10,000,000');
    console.log('Remaining Supply should be 10,000,000 (legacy field)');
    console.log('User Supply Remaining should be 1,196,757 (for user activities)');
    console.log('Admin Reserve should be 8,000,000 (admin controlled)');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSupply();




