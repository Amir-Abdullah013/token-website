# Admin Reserve Usage Report

## Executive Summary

The **Admin Reserve** is a controlled pool of tokens (80% of total supply) used exclusively for:
1. **Staking Rewards** - Daily reward payments to stakers
2. **Token Minting** - Receives 80% of newly minted tokens
3. **Supply Management** - Can be transferred to user supply by admin

**Important**: Admin reserve is NO LONGER used for storing staked principal tokens (this was changed in the recent refactoring).

---

## 1. Staking Rewards (PRIMARY USE)

### Purpose
Payment of daily staking rewards to users who have staked tokens.

### How It Works
- **Daily Rewards**: Admin reserve is debited daily for staking reward payouts
- **Reward Calculation**: Based on 365-day year system
  - Formula: `dailyReward = (amountStaked × rewardPercent / 100) / 365`
- **Payment Frequency**: Daily via cron job (`/api/cron/process-stakings`)

### Implementation Details

#### File: `src/app/api/cron/process-stakings/route.js`
```javascript
// Daily reward payment from admin reserve
await client.query(`
  UPDATE token_supply 
  SET "adminReserve" = "adminReserve" - $1, "updatedAt" = NOW()
  WHERE id = $2
`, [rewardIncrement, tokenSupply.id]);
```

**Process**:
1. Cron job runs daily
2. Calculates pending rewards for active stakings
3. Deducts reward amount from admin reserve
4. Adds reward to user's `VonBalance`

### File: `src/app/api/stake/[id]/claim/route.js`
```javascript
// Pay remaining rewards from admin reserve (if any)
await client.query(`
  UPDATE token_supply 
  SET "adminReserve" = "adminReserve" - $1, "updatedAt" = NOW()
  WHERE id = $2
`, [remainingReward, tokenSupply.id]);
```

**Process**:
- When user claims remaining rewards
- Deducts from admin reserve
- Adds to user wallet

### Key Points
- ✅ **ONLY rewards** are paid from admin reserve (not principal)
- ✅ Principal is stored in user's `stakingTokensAmount` field
- ✅ Principal is automatically released from user account on end date
- ✅ Rewards continue for up to 365 days regardless of staking period

---

## 2. Token Minting (GROWTH)

### Purpose
When new tokens are minted, 80% goes to admin reserve to support future staking rewards.

### How It Works
- **Distribution**: Newly minted tokens are split:
  - **20%** → `userSupplyRemaining` (for user activities)
  - **80%** → `adminReserve` (for staking rewards)

### Implementation Details

#### File: `src/lib/database.js` (minting.mintTokens)
```javascript
// Calculate distribution: 20% to user supply, 80% to admin reserve
const userSupplyAmount = Math.floor(amount * 0.20); // 20% to user supply
const adminReserveAmount = amount - userSupplyAmount; // 80% to admin reserve

const newAdminReserve = Number(supply.adminReserve) + adminReserveAmount;

await client.query(`
  UPDATE token_supply 
  SET 
    "totalSupply" = $1, 
    "remainingSupply" = $2, 
    "userSupplyRemaining" = $3,
    "adminReserve" = $4,
    "updatedAt" = NOW()
  WHERE id = $5
`, [newTotalSupply, newRemainingSupply, newUserSupplyRemaining, newAdminReserve, supply.id]);
```

### Key Points
- ✅ Admin reserve grows with each mint
- ✅ Ensures sustainable staking reward system
- ✅ 80/20 split maintains controlled economy

---

## 3. Admin Supply Transfers (MANAGEMENT)

### Purpose
Allows admins to transfer tokens from admin reserve to user supply when needed for:
- Increasing available tokens for user purchases
- Market liquidity
- Economic adjustments

### How It Works
- **Manual Transfer**: Admin-initiated via `/api/admin/supply/update`
- **Deduction**: Tokens deducted from `adminReserve`
- **Addition**: Tokens added to `userSupplyRemaining`

### Implementation Details

#### File: `src/lib/database.js` (adminSupplyTransfer.transferToUserSupply)
```javascript
await client.query(`
  UPDATE token_supply 
  SET 
    "adminReserve" = "adminReserve" - $1,
    "userSupplyRemaining" = "userSupplyRemaining" + $1,
    "updatedAt" = NOW()
  WHERE id = $2
`, [amount, tokenSupply.id]);
```

#### File: `src/app/api/admin/supply/update/route.js`
- Requires admin authentication
- Records transfer history
- Creates audit log

### Key Points
- ✅ Requires admin authorization
- ✅ Fully auditable (transfer history tracked)
- ✅ One-way transfer (admin reserve → user supply)
- ✅ Used to control token availability

---

## 4. Admin Reserve Adjustment (UTILITY)

### Purpose
Utility function for adjusting admin reserve manually (if needed for corrections).

### Implementation Details

#### File: `src/lib/database.js` (tokenSupply.adjustAdminReserve)
```javascript
async adjustAdminReserve(amountDelta) {
  // amountDelta can be positive (add) or negative (deduct)
  await pool.query(`
    UPDATE token_supply
    SET "adminReserve" = "adminReserve" + $1, "updatedAt" = NOW()
    WHERE id = $2
  `, [amountDelta, tokenSupply.id]);
}
```

### Key Points
- ⚠️ Utility function for system adjustments
- ⚠️ Not used in normal operations
- ⚠️ Should only be used for corrections/audits

---

## What Admin Reserve is NOT Used For

### ❌ Staking Principal Storage (REMOVED)
- **Previous**: Principal was stored in admin reserve
- **Current**: Principal stored in user's `stakingTokensAmount`
- **Reason**: Better user ownership and transparency

### ❌ Referral Bonuses
- Referral bonuses are paid directly from user supply or rewards
- Not deducted from admin reserve
- Paid immediately upon staking creation

### ❌ Token Purchases
- User purchases use `userSupplyRemaining`
- Not deducted from admin reserve

### ❌ Withdrawals
- Withdrawals use user's wallet balance
- Not from admin reserve

---

## Current Reserve Allocation

Based on schema and codebase:

```
Total Supply: 10,000,000 Von
├── User Supply: 2,000,000 Von (20%)
└── Admin Reserve: 8,000,000 Von (80%)
```

### Reserve Usage Priority:
1. **Primary**: Staking rewards (daily payments)
2. **Growth**: Token minting (receives 80% of new tokens)
3. **Management**: Admin transfers (to user supply when needed)

---

## Daily Operations Flow

### Morning: Staking Rewards Distribution
```
1. Cron job triggers: /api/cron/process-stakings
2. Calculates pending rewards for all active stakings
3. For each staking:
   - Calculate daily reward: (amount × reward% / 100) / 365
   - Deduct from adminReserve
   - Add to user's VonBalance
4. Update staking records (daysRewarded, rewardAccrued)
5. Auto-release principal on end date (from stakingTokensAmount)
```

### Throughout Day: Token Operations
```
- User purchases: Use userSupplyRemaining (not admin reserve)
- Token minting: 80% goes to admin reserve
- Admin transfers: Admin reserve → userSupplyRemaining
```

---

## Reserve Health Indicators

### Monitor These Metrics:

1. **Reserve Balance**
   ```sql
   SELECT "adminReserve" FROM token_supply;
   ```

2. **Daily Reward Obligations**
   ```sql
   SELECT 
     SUM((s."amountStaked" * s."rewardPercent" / 100) / 365) as daily_obligations
   FROM staking s
   WHERE s.status = 'ACTIVE';
   ```

3. **Remaining Reserve Days**
   ```
   Reserve Days = adminReserve / daily_obligations
   ```

### Warning Thresholds:
- ⚠️ **Warning**: Reserve < 1,000,000 Von
- 🔴 **Critical**: Reserve < 500,000 Von
- 🚨 **Emergency**: Reserve < daily_obligations × 30 (30 days buffer)

---

## Recommendations

### For Reserve Management:

1. **Monitor Daily**: Track reserve balance and daily obligations
2. **Mint Proactively**: Mint tokens before reserve runs low
3. **Transfer Strategically**: Only transfer to user supply when needed
4. **Calculate Buffer**: Maintain at least 30 days of reward obligations
5. **Audit Regularly**: Review transfer history and reserve usage

### Reserve Safety:

- ✅ Reserve should always exceed daily reward obligations
- ✅ Maintain buffer for unexpected staking activity
- ✅ Monitor reserve growth from minting
- ✅ Track transfer history for transparency

---

## Code Locations Summary

| Purpose | File | Function/Method |
|---------|------|----------------|
| Daily Staking Rewards | `src/app/api/cron/process-stakings/route.js` | Lines 114-127 |
| Claim Remaining Rewards | `src/app/api/stake/[id]/claim/route.js` | Lines 152-156 |
| Token Minting (80%) | `src/lib/database.js` | `minting.mintTokens()` Lines 2093-2174 |
| Admin Supply Transfer | `src/lib/database.js` | `adminSupplyTransfer.transferToUserSupply()` Lines 2320-2410 |
| Reserve Adjustment | `src/lib/database.js` | `tokenSupply.adjustAdminReserve()` Lines 1848-1882 |
| Admin Transfer API | `src/app/api/admin/supply/update/route.js` | POST endpoint |

---

## Transaction Flow Diagrams

### Staking Reward Payment
```
[Cron Job] → Calculate Rewards → [Admin Reserve] -X Von → [User Wallet] +X Von
                                                              ↓
                                                    Update Staking Record
```

### Token Minting
```
[Admin Mints] → [Total Supply] +X Von
                      ↓
               Split: 20% User / 80% Reserve
                      ↓
    [User Supply] +20%    [Admin Reserve] +80%
```

### Admin Transfer
```
[Admin Request] → Validate → [Admin Reserve] -X Von → [User Supply] +X Von
                                                              ↓
                                                    Record Transfer History
```

---

## Conclusion

The **Admin Reserve** is the **backbone of the staking reward system**. Its primary purpose is to ensure sustainable daily reward payments to stakers. With the recent refactoring, it no longer stores staked principal (which is now in user accounts), making it more efficient and transparent.

**Key Takeaways**:
1. ✅ Admin reserve is **ONLY** for staking rewards (not principal)
2. ✅ Grows through token minting (80% allocation)
3. ✅ Can be managed through admin transfers
4. ✅ Requires monitoring to ensure sustainability

