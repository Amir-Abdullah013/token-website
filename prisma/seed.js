const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create default system settings
  const defaultSettings = [
    {
      key: 'token_price',
      value: '1.00',
      description: 'Current token price in USD'
    },
    {
      key: 'token_supply',
      value: '1000000',
      description: 'Total token supply'
    },
    {
      key: 'payment_gateways',
      value: JSON.stringify([
        { name: 'Stripe', active: true },
        { name: 'PayPal', active: true },
        { name: 'Bank Transfer', active: false }
      ]),
      description: 'Available payment gateways'
    }
  ]

  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting
    })
  }

  console.log('✅ System settings created')

  // Create sample price data
  const samplePrices = [
    { symbol: 'TOKEN', price: 1.00, volume: 1000, marketCap: 1000000, source: 'system' },
    { symbol: 'TOKEN', price: 1.05, volume: 1200, marketCap: 1050000, source: 'system' },
    { symbol: 'TOKEN', price: 0.98, volume: 800, marketCap: 980000, source: 'system' },
    { symbol: 'TOKEN', price: 1.02, volume: 1500, marketCap: 1020000, source: 'system' },
    { symbol: 'TOKEN', price: 1.08, volume: 2000, marketCap: 1080000, source: 'system' }
  ]

  for (const price of samplePrices) {
    await prisma.price.create({
      data: {
        ...price,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      }
    })
  }

  console.log('✅ Sample price data created')

  console.log('🎉 Database seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })



