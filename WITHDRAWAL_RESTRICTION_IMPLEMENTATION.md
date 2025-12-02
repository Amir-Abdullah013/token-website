# Withdrawal Restriction Rule - Complete Implementation Guide

## ✅ Backend Implementation (COMPLETE)

### 1. Prisma Schema Updates ✅
**File**: `prisma/schema.prisma`

Added fields to User model:
```prisma
referralCode       String?  @unique
hasReferredOne     Boolean  @default(false)
firstDepositAmount Float?
```

### 2. Database Migration ✅
**File**: `prisma/migrations/20250218000000_add_withdrawal_restriction_fields/migration.sql`

- Adds `firstDepositAmount` (FLOAT)
- Adds `hasReferredOne` (BOOLEAN, default false)
- Adds `referralCode` (TEXT, unique)
- Generates referral codes for existing users

**To Apply Migration:**
```bash
psql $DATABASE_URL -f prisma/migrations/20250218000000_add_withdrawal_restriction_fields/migration.sql
npx prisma generate
```

### 3. Deposit Logic ✅
**File**: `src/app/api/admin/deposits/[id]/route.js`

**Updated**: When admin approves first deposit:
- Sets `firstDepositAmount = depositAmount` if null/undefined
- Only sets on first approved deposit

### 4. Referral Logic ✅
**File**: `src/app/api/auth/verify-signup-otp/route.js`

**Updated**: When new user signs up with referral code:
- Sets `referralCode = userId` for new user
- Sets `hasReferredOne = true` for referrer
- Creates referral record

### 5. Withdrawal Restriction ✅
**File**: `src/app/api/withdraw/route.js`

**Updated**: Before allowing withdrawal:
- Checks `firstDepositAmount < 10 AND hasReferredOne = false`
- Blocks withdrawal with error message if condition met
- Returns 403 with detailed message

**Error Response:**
```json
{
  "success": false,
  "error": "Withdrawal Restricted",
  "message": "You must refer 1 user before withdrawing because your first deposit was below $10.",
  "restrictionType": "REFERRAL_REQUIRED",
  "firstDepositAmount": 5.0,
  "hasReferredOne": false
}
```

### 6. Withdrawal Status API ✅
**File**: `src/app/api/user/withdrawal-status/route.js`

**New Endpoint**: GET `/api/user/withdrawal-status`

Returns user's withdrawal eligibility:
```json
{
  "success": true,
  "withdrawalStatus": {
    "isAllowed": false,
    "requiresReferral": true,
    "firstDepositAmount": 5.0,
    "hasReferredOne": false,
    "referralCode": "user-id-here",
    "message": "You must refer 1 user before withdrawing..."
  }
}
```

## 🎨 Frontend Implementation (IN PROGRESS)

### Files to Update:

1. **Deposit Page** - `src/app/user/deposit/page.js`
   - Show warning if first deposit < $10
   - Show success message if ≥ $10

2. **Withdrawal Page** - `src/app/user/withdraw/page.js`
   - Fetch withdrawal status on load
   - Show restriction message if applicable
   - Disable withdrawal button if restricted
   - Show referral requirement completion status

3. **Dashboard** - `src/app/user/dashboard/page.js`
   - Show withdrawal restriction status in wallet summary

4. **Referral Page** - `src/app/user/referrals/page.js`
   - Show "Referral requirement completed ✔️" if met

## 📋 Frontend Code Snippets

### Withdrawal Page - Add Status Check

Add this to `src/app/user/withdraw/page.js`:

```javascript
// Add state
const [withdrawalStatus, setWithdrawalStatus] = useState(null);
const [loadingStatus, setLoadingStatus] = useState(true);

// Add useEffect to fetch status
useEffect(() => {
  const fetchWithdrawalStatus = async () => {
    try {
      const response = await fetch('/api/user/withdrawal-status');
      if (response.ok) {
        const data = await response.json();
        setWithdrawalStatus(data.withdrawalStatus);
      }
    } catch (err) {
      console.error('Error fetching withdrawal status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  if (mounted && isAuthenticated) {
    fetchWithdrawalStatus();
  }
}, [mounted, isAuthenticated]);

// Add restriction message component before form
{withdrawalStatus?.requiresReferral && (
  <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
    <h3 className="text-yellow-400 font-semibold mb-2">⚠️ Withdrawal Locked</h3>
    <p className="text-slate-300 text-sm mb-2">
      Your first deposit was less than $10.
    </p>
    <p className="text-slate-300 text-sm">
      You must refer at least one user before you can withdraw.
    </p>
    <Link href="/user/referrals" className="text-cyan-400 hover:text-cyan-300 text-sm underline mt-2 inline-block">
      Go to Referrals →
    </Link>
  </div>
)}

// Update submit button
<Button
  type="submit"
  disabled={isSubmitting || withdrawalStatus?.requiresReferral}
  className={withdrawalStatus?.requiresReferral ? 'opacity-50 cursor-not-allowed' : ''}
>
  {withdrawalStatus?.requiresReferral ? 'Withdraw (Referral Required)' : 'Withdraw'}
</Button>
```

### Deposit Page - Add Warning Message

Add this to `src/app/user/deposit/page.js` after form loads:

```javascript
// Add state
const [firstDepositWarning, setFirstDepositWarning] = useState(null);

// In handleSubmit, after successful submission:
if (amount < 10) {
  setFirstDepositWarning({
    type: 'warning',
    message: 'Note: Since your first deposit is below $10, you must refer 1 user before you can withdraw funds.'
  });
} else {
  setFirstDepositWarning({
    type: 'success',
    message: 'No referral is required to withdraw your funds.'
  });
}

// Display warning in JSX
{firstDepositWarning && (
  <div className={`mt-4 p-3 rounded-lg ${
    firstDepositWarning.type === 'warning' 
      ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400' 
      : 'bg-green-500/10 border border-green-500/30 text-green-400'
  }`}>
    {firstDepositWarning.type === 'warning' ? '⚠️' : '✅'} {firstDepositWarning.message}
  </div>
)}
```

## 🧪 Testing Checklist

### Backend Tests:
- [ ] First deposit < $10 blocks withdrawal
- [ ] First deposit ≥ $10 allows withdrawal
- [ ] After referral, withdrawal is allowed
- [ ] `firstDepositAmount` is set on first approved deposit
- [ ] `hasReferredOne` is set when referral signs up
- [ ] `referralCode` is set for all users

### Frontend Tests:
- [ ] Deposit page shows warning for < $10
- [ ] Withdrawal page shows restriction message
- [ ] Withdrawal button is disabled when restricted
- [ ] Referral page shows completion status
- [ ] Dashboard shows restriction status

## 🚀 Deployment Steps

1. **Run Migration:**
   ```bash
   psql $DATABASE_URL -f prisma/migrations/20250218000000_add_withdrawal_restriction_fields/migration.sql
   npx prisma generate
   ```

2. **Deploy Backend Changes:**
   - All backend API changes are complete
   - Test withdrawal restriction logic

3. **Deploy Frontend Changes:**
   - Update deposit page
   - Update withdrawal page
   - Update dashboard and referral pages

4. **Verify:**
   - Test first deposit < $10 scenario
   - Test first deposit ≥ $10 scenario
   - Test referral requirement completion

## 📝 Summary

### Logic Flow:
1. **First Deposit < $10:**
   - Admin approves → `firstDepositAmount` set
   - User tries to withdraw → **BLOCKED**
   - User refers someone → `hasReferredOne = true`
   - User tries to withdraw → **ALLOWED**

2. **First Deposit ≥ $10:**
   - Admin approves → `firstDepositAmount` set
   - User tries to withdraw → **ALLOWED** (no referral needed)

### Database Fields:
- `firstDepositAmount`: Set on first approved deposit
- `hasReferredOne`: Set to true when referral signs up
- `referralCode`: User's unique referral code (user ID)

### API Endpoints:
- `GET /api/user/withdrawal-status` - Check withdrawal eligibility
- `POST /api/withdraw` - Now includes restriction check
- `PATCH /api/admin/deposits/[id]` - Sets firstDepositAmount
- `POST /api/auth/verify-signup-otp` - Sets hasReferredOne

## ✅ Status

- ✅ Backend complete
- ✅ Database migration ready
- 🔄 Frontend updates needed (templates provided above)


