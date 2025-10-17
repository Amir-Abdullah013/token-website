# 🔍 Token Supply System - Audit & Fix

**Date:** October 17, 2025  
**Issue:** Token supply tracking is inconsistent with actual distributed tokens

---

## 📊 Current State (BROKEN)

### Database State:
- **Total Supply:** 10,000,000 TIKI
- **Remaining Supply (legacy field):** 10,000,000 TIKI ❌ (WRONG!)
- **User Supply Remaining:** 1,196,757 TIKI (from 2M allocation)
- **Admin Reserve:** 8,000,000 TIKI

### Actual Distribution:
- **Total TIKI Distributed:** 4,596,501.91 TIKI
- **Used from User Supply:** 803,243 TIKI
- **Discrepancy:** 3,793,258.91 TIKI ❌ (UNACCOUNTED!)

### The Problem:
1. `remainingSupply` field is NEVER updated when tokens are bought/sold
2. Only `userSupplyRemaining` (2M allocation) is tracked
3. Actual distributed tokens (4.59M) exceed the tracked supply
4. Admin user has 4.48M TIKI, but system only tracks 803K as "used"

---

## 🎯 Root Causes

1. **Buy Route (`src/app/api/tiki/buy/route.js`):**
   - ✅ Updates `userSupplyRemaining` (line 167)
   - ❌ Does NOT update `remainingSupply`
   - Only deducts from the 2M user allocation

2. **Sell Route (`src/app/api/tiki/sell/route.js`):**
   - ✅ Increases `userSupplyRemaining` (line 52)
   - ❌ Does NOT update `remainingSupply`
   - Only returns to the 2M user allocation

3. **Token Supply API (`src/app/api/token-supply/route.js`):**
   - Shows database values directly without validation
   - Calculates usage only from `userSupplyRemaining`
   - Ignores actual distributed tokens

---

## ✅ Solution Design

### New Token Supply Model

```
totalSupply = 10,000,000 (can increase with minting)
├── distributedSupply = SUM(all user tikiBalance)
│   ├── User tokens (from user allocation)
│   └── Admin minted tokens (from admin reserve)
└── remainingSupply = totalSupply - distributedSupply
    ├── userSupplyRemaining (available for users)
    └── adminReserve (locked, can be released by admin)
```

### Key Principles:
1. **Single Source of Truth:** Total distributed = SUM(wallet balances)
2. **Dual Tracking:** 
   - Track total supply/remaining (for overall economy)
   - Track user supply/admin reserve (for allocation management)
3. **Always Update:** Every buy/sell updates BOTH systems
4. **Validation:** Regular audits to ensure consistency

---

## 🔧 Implementation Plan

### 1. Update Database Helpers
- Add `calculateDistributedSupply()` function
- Add `syncRemainingSupply()` function
- Modify `decrementUserSupply()` to also update `remainingSupply`
- Modify `incrementUserSupply()` to also update `remainingSupply`

### 2. Update Buy/Sell Routes
- Update `remainingSupply` on every transaction
- Add validation to prevent over-distribution
- Add proper error handling

### 3. Fix Token Supply API
- Calculate `distributedSupply` from actual wallets
- Show correct `remainingSupply`
- Add "health check" to detect discrepancies

### 4. Migration Script
- Calculate actual distributed supply from wallets
- Update `remainingSupply` to correct value
- Validate admin reserve vs user supply

---

## 📝 Correct Calculations

### Current Correct Values:
```javascript
totalSupply = 10,000,000
distributedSupply = 4,596,501.91 (from wallets)
remainingSupply = 10,000,000 - 4,596,501.91 = 5,403,498.09

// For allocation management:
totalUserSupply = 2,000,000
userSupplyRemaining = 1,196,757
usedUserSupply = 803,243
usagePercentage = 40.16%

// Problem: distributedSupply (4.59M) > usedUserSupply (803K)
// This means: 3.79M tokens came from somewhere else!
```

---

## 🚀 Next Steps

1. ✅ Create database helper functions for supply tracking
2. ✅ Update buy/sell routes to maintain both tracking systems
3. ✅ Create migration script to fix current data
4. ✅ Update token-supply API to show accurate data
5. ✅ Add validation and health checks
6. ✅ Test with sample transactions

