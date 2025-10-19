# 🚀 TIKI Trading System - Quick Start Guide

## ✅ What's Been Implemented

Your TIKI trading system now supports **two types of orders**:

### 1. **Market Orders** (Instant Execution)
- Execute immediately at current market price
- Perfect for quick trades
- No waiting required

### 2. **Limit Orders** (Conditional Execution)
- Set your desired price
- Order waits until price reaches your target
- Automatically executes when price matches

---

## 🎮 How to Test

### Option 1: Test via Browser (Recommended)

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to the trade page**:
   ```
   http://localhost:3000/user/trade
   ```

3. **Test Market Order**:
   - Select "Market Order" from dropdown
   - Enter amount to trade
   - Click "Buy Tiki Tokens" or "Sell Tiki Tokens"
   - ✅ Order executes instantly!

4. **Test Limit Order**:
   - Select "Limit Order" from dropdown
   - Enter amount to trade
   - Enter your desired price (limit price)
   - Click "Buy Tiki Tokens" or "Sell Tiki Tokens"
   - ✅ Order appears in "Open Orders" section below
   - ✅ Order will execute when price reaches your limit

5. **Manage Your Orders**:
   - View all open orders in the "Open Orders" section
   - Click "Cancel" on any order to cancel it
   - Orders automatically disappear when filled

### Option 2: Test via Scripts

#### Test Trading System
```bash
node scripts/test-trading-system.js
```
This will create test orders and verify all functionality.

#### Test Order Matching
```bash
node scripts/match-limit-orders.js
```
This will check for pending limit orders and execute any that match current price.

---

## 📋 Features Checklist

### Core Trading
- ✅ Market Buy Orders
- ✅ Market Sell Orders  
- ✅ Limit Buy Orders
- ✅ Limit Sell Orders
- ✅ Order Cancellation
- ✅ Order History
- ✅ Balance Validation

### User Interface
- ✅ Order Type Selector (Market/Limit)
- ✅ Buy/Sell Toggle
- ✅ Amount Input
- ✅ Price Input (for limit orders)
- ✅ Open Orders Display
- ✅ Cancel Order Button
- ✅ Real-time Balance Display
- ✅ Success/Error Messages

### Backend
- ✅ Orders Database Table
- ✅ Create Order API
- ✅ Get Orders API
- ✅ Cancel Order API
- ✅ Order Matching System
- ✅ Transaction Recording
- ✅ Balance Updates

### Security
- ✅ User Authentication
- ✅ Balance Validation
- ✅ User Authorization
- ✅ SQL Injection Prevention
- ✅ Transaction Atomicity

---

## 🔧 Production Setup

### Automated Order Matching

To enable automatic limit order execution, set up a cron job:

**Option 1: System Cron (Linux/Mac)**
```bash
crontab -e

# Add this line to run every 5 minutes:
*/5 * * * * cd /path/to/token-website && node scripts/match-limit-orders.js
```

**Option 2: Create API Endpoint**
Create `/api/cron/match-orders/route.js` and call it from your scheduler.

**Option 3: PM2 (Node.js Process Manager)**
```bash
pm2 start scripts/match-limit-orders.js --cron "*/5 * * * *"
```

---

## 📊 Order Matching Logic

### BUY Limit Orders
- **Condition**: Current Price ≤ Limit Price
- **Example**: 
  - You want to buy at $0.0035 or less
  - Current price drops to $0.0034
  - ✅ Order executes automatically!

### SELL Limit Orders
- **Condition**: Current Price ≥ Limit Price
- **Example**:
  - You want to sell at $0.0040 or more
  - Current price rises to $0.0041
  - ✅ Order executes automatically!

---

## 🎯 Example Scenarios

### Scenario 1: Quick Buy (Market Order)
```
1. Current price: $0.0036
2. You select "Market Order"
3. Enter $100
4. Click "Buy Tiki Tokens"
5. ✅ Instantly receive ~27,777 TIKI
```

### Scenario 2: Buy the Dip (Limit Order)
```
1. Current price: $0.0036
2. You select "Limit Order"
3. Enter $100
4. Set limit price: $0.0030 (waiting for price to drop)
5. Click "Buy Tiki Tokens"
6. Order stays PENDING until price drops to $0.0030
7. ✅ Automatically executes when price hits $0.0030
```

### Scenario 3: Sell High (Limit Order)
```
1. Current price: $0.0036
2. You select "Limit Order"
3. Enter 10,000 TIKI
4. Set limit price: $0.0040 (waiting for price to rise)
5. Click "Sell Tiki Tokens"
6. Order stays PENDING until price rises to $0.0040
7. ✅ Automatically executes when price hits $0.0040
```

---

## 📱 UI Components

### Trading Panel Location
- **Page**: `/user/trade`
- **Component**: `src/app/user/trade/page.js`
- **Section**: Left column (desktop) or top (mobile)

### Open Orders Location
- **Display**: Below trading panel
- **Visibility**: Only shows when you have open orders
- **Features**: Cancel button, order details

---

## 🐛 Troubleshooting

### Orders Not Executing?
1. Check if order matching script is running
2. Run manually: `node scripts/match-limit-orders.js`
3. Set up automated cron job

### Can't Create Orders?
1. Check your balance is sufficient
2. Verify you're logged in
3. Check browser console for errors

### Orders Not Appearing?
1. Refresh the page
2. Check if order was created (check database)
3. Look in browser console for API errors

---

## 📞 Support Commands

### Check Order Stats
```bash
node -e "require('dotenv').config(); const {Pool}=require('pg'); const pool=new Pool({connectionString:process.env.DATABASE_URL}); pool.query('SELECT status, COUNT(*) FROM orders GROUP BY status').then(r=>console.table(r.rows)).finally(()=>pool.end());"
```

### View All Orders
```bash
node -e "require('dotenv').config(); const {Pool}=require('pg'); const pool=new Pool({connectionString:process.env.DATABASE_URL}); pool.query('SELECT * FROM orders ORDER BY \"createdAt\" DESC LIMIT 10').then(r=>console.table(r.rows)).finally(()=>pool.end());"
```

---

## 🎉 Success!

Your trading system is now fully functional with both market and limit orders. Users can:

1. ✅ Trade instantly with market orders
2. ✅ Set price targets with limit orders  
3. ✅ View all open orders
4. ✅ Cancel orders anytime
5. ✅ Automatic execution when price matches

**Start Trading Now! 🚀**

Visit `/user/trade` in your browser and try it out!


