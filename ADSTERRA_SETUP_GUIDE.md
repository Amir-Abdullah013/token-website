# Adsterra Ad Integration Guide

This document explains how to set up and configure Adsterra ads on the `/user/ads` page.

## 🎯 Ad Formats Integrated

We've integrated **4 types** of Adsterra ads on the ads page:

1. **Popunder** - Opens in background on user interaction
2. **Native Banner #1** - Between "Watch Ad" section and "Ad History"
3. **Native Banner #2** - After "Ad History" section
4. **Social Bar** - Fixed at the bottom of the page

## 📋 How to Get Your Adsterra Ad Keys

### Step 1: Create Adsterra Account
1. Go to [Adsterra.com](https://www.adsterra.com/)
2. Sign up for a publisher account
3. Verify your email and complete registration

### Step 2: Add Your Website
1. Log in to your Adsterra dashboard
2. Navigate to **"Websites"** → **"Add Website"**
3. Enter your website URL
4. Select your website category
5. Wait for approval (usually 24-48 hours)

### Step 3: Create Ad Zones

For each ad format, you need to create a separate ad zone:

#### **Popunder Ad**
1. Go to **"Ad Zones"** → **"Create Ad Zone"**
2. Select **"Popunder"** as the ad format
3. Give it a name (e.g., "Ads Page Popunder")
4. Configure settings:
   - Frequency: 1 per 24 hours recommended
   - Allow adult content: Your choice
5. Click **"Create"**
6. Copy the **Ad Key** (looks like: `a1b2c3d4e5f6g7h8i9j0`)

#### **Native Banner Ad #1**
1. Create new ad zone
2. Select **"Native Banner"** format
3. Name: "Ads Page Native Banner 1"
4. Configure size: 300x250 recommended
5. Copy the **Ad Key**

#### **Native Banner Ad #2**
1. Create another native banner zone
2. Name: "Ads Page Native Banner 2"
3. Same settings as Banner #1
4. Copy the **Ad Key**

#### **Social Bar**
1. Create new ad zone
2. Select **"Social Bar"** format
3. Name: "Ads Page Social Bar"
4. Position: Bottom
5. Size: 468x60 recommended
6. Copy the **Ad Key**

## 🔧 Configuring Your Ad Keys

### Option 1: Direct Replacement (Quick)

Open `/src/app/user/ads/page.js` and replace the placeholder keys:

```javascript
// Line ~60: Popunder
const popunderScript = document.createElement('script');
popunderScript.innerHTML = `
  atOptions = {
    'key' : 'PASTE_YOUR_POPUNDER_KEY_HERE',  // ← Replace this
    ...
  };
`;
```

```javascript
// Line ~640: Native Banner #1
<AdsterraAd 
  adKey="PASTE_YOUR_NATIVE_BANNER_KEY_1_HERE"  // ← Replace this
  format="iframe"
  height={250}
  width={300}
/>

// Line ~715: Native Banner #2
<AdsterraAd 
  adKey="PASTE_YOUR_NATIVE_BANNER_KEY_2_HERE"  // ← Replace this
  format="iframe"
  height={250}
  width={300}
/>

// Line ~735: Social Bar
<AdsterraAd 
  adKey="PASTE_YOUR_SOCIAL_BAR_KEY_HERE"  // ← Replace this
  format="iframe"
  height={60}
  width={468}
/>
```

### Option 2: Environment Variables (Recommended)

1. **Add keys to `.env.local`:**

```env
# Adsterra Ad Keys
NEXT_PUBLIC_ADSTERRA_POPUNDER_KEY=your_popunder_key_here
NEXT_PUBLIC_ADSTERRA_NATIVE_BANNER_1_KEY=your_native_banner_1_key_here
NEXT_PUBLIC_ADSTERRA_NATIVE_BANNER_2_KEY=your_native_banner_2_key_here
NEXT_PUBLIC_ADSTERRA_SOCIAL_BAR_KEY=your_social_bar_key_here
```

2. **Update the code to use environment variables:**

```javascript
// In /src/app/user/ads/page.js

// Line ~60: Popunder
'key' : process.env.NEXT_PUBLIC_ADSTERRA_POPUNDER_KEY,

// Line ~640: Native Banner #1
adKey={process.env.NEXT_PUBLIC_ADSTERRA_NATIVE_BANNER_1_KEY}

// Line ~715: Native Banner #2
adKey={process.env.NEXT_PUBLIC_ADSTERRA_NATIVE_BANNER_2_KEY}

// Line ~735: Social Bar
adKey={process.env.NEXT_PUBLIC_ADSTERRA_SOCIAL_BAR_KEY}
```

3. **Restart the dev server:**
```bash
npm run dev
```

## ✅ Testing Your Ads

After configuration:

1. **Clear browser cache**
2. **Navigate to** `/user/ads`
3. **Check each ad placement:**
   - Popunder should trigger on first click
   - Native banners should load between sections
   - Social bar should appear fixed at bottom
4. **Open browser console** to check for any errors

### Common Issues

**Ads not showing?**
- ✓ Verify ad keys are correct
- ✓ Check browser ad blocker is disabled
- ✓ Ensure website is approved by Adsterra
- ✓ Wait 5-10 minutes for propagation

**Script errors?**
- ✓ Check console for specific error messages
- ✓ Verify scripts are loading (Network tab)
- ✓ Try a different browser

## 📊 Monitoring Performance

1. Log into **Adsterra Dashboard**
2. Navigate to **"Statistics"**
3. Select your website
4. View impressions, clicks, and earnings per ad zone
5. Optimize based on performance data

## 🎨 Customization

You can customize ad appearance by modifying:

**Ad sizes:**
```javascript
<AdsterraAd 
  height={300}  // Change height
  width={400}   // Change width
/>
```

**Ad labels:**
```javascript
<AdsterraAd 
  label={true}  // Shows "Advertisement" label
/>
```

**Ad positioning:**
Move the `<Card>` or `<AdsterraAd>` components to different locations in the JSX.

## 🔒 Best Practices

1. **Don't overload the page** - We've balanced 4 ads strategically
2. **Test user experience** - Ensure ads don't disrupt functionality
3. **Monitor earnings vs. UX** - Balance revenue with user satisfaction
4. **Follow Adsterra policies** - No click fraud, invalid traffic, etc.
5. **Update keys securely** - Use environment variables for production

## 📞 Support

- **Adsterra Support:** support@adsterra.com
- **Dashboard:** https://publishers.adsterra.com/
- **Documentation:** https://adsterra.com/publishers/

---

**Note:** Ad revenue typically appears 24-48 hours after initial setup as Adsterra needs time to optimize ad delivery.
