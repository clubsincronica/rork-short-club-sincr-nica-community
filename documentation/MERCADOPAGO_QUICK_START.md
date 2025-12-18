# MercadoPago Quick Start Guide - Argentina

## Phase 1: Simple Integration (No Backend)

### 1. Create MercadoPago Account
1. Go to: https://www.mercadopago.com.ar/
2. Sign up as **Vendedor** (Seller)
3. Complete identity verification (DNI or passport)
4. No CIF/business registration needed initially (can use personal account)

### 2. Get Your Credentials
1. Go to: https://www.mercadopago.com.ar/developers/panel
2. Navigate to "Tus integraciones" → "Credenciales"
3. Copy your credentials:
   - **Public Key (TEST):** `TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - **Access Token (TEST):** `TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### 3. Install MercadoPago SDK

```bash
npm install react-native-mercadopago-checkout-pro
# or
npm install mercadopago
```

### 4. Simple Implementation (No Backend Required)

```tsx
// app/payment.tsx - Add MercadoPago checkout

import { Linking } from 'react-native';

const createMercadoPagoCheckout = async (amount: number, description: string) => {
  // This creates a simple payment link
  const preference = {
    items: [{
      title: description,
      quantity: 1,
      unit_price: amount,
      currency_id: 'ARS' // Argentine Peso
    }],
    back_urls: {
      success: 'clubsincronica://payment-success',
      failure: 'clubsincronica://payment-failed',
      pending: 'clubsincronica://payment-pending'
    },
    auto_return: 'approved',
    // Your commission: 2.5%
    marketplace_fee: amount * 0.025,
    notification_url: 'https://yourwebhook.com/mercadopago' // Future backend
  };

  // For now, use MercadoPago's hosted checkout
  const checkoutUrl = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${preferenceId}`;
  
  // Open in browser
  await Linking.openURL(checkoutUrl);
};
```

### 5. Commission Structure

**Your App Commission: 2.5%**
**MercadoPago Fees (Argentina):**
- Digital goods/services: 3.99% + ARS $8
- Physical goods: 3.49% + ARS $8

**Example Calculation:**
```
Service Price: ARS 10,000
Your Commission: ARS 250 (2.5%)
Service Provider Gets: ARS 9,750
MercadoPago Fee: ARS 399 + ARS 8 = ARS 407
Net to Provider: ARS 9,343
```

**Who Pays Fees:**
- Option A: Service provider pays all fees (you + MercadoPago)
- Option B: Split fees between buyer and provider
- Option C: Buyer pays transaction fees

### 6. Multi-Currency Support

```typescript
const CURRENCY_BY_COUNTRY = {
  'AR': 'ARS', // Argentina - Peso
  'UY': 'UYU', // Uruguay - Peso Uruguayo  
  'BR': 'BRL', // Brazil - Real
  'ES': 'EUR', // Spain - Euro
  'US': 'USD', // United States - Dollar
};

const MERCADOPAGO_BY_COUNTRY = {
  'AR': 'https://www.mercadopago.com.ar',
  'BR': 'https://www.mercadopago.com.br',
  'UY': 'https://www.mercadopago.com.uy',
  'MX': 'https://www.mercadopago.com.mx',
  'CL': 'https://www.mercadopago.cl',
};
```

### 7. Language Support Needed

**Priority Order:**
1. ✅ Spanish (ES) - Already implemented
2. 🔧 Portuguese (PT-BR) - For Brazil
3. 🔧 English (EN) - For US/International

**Implementation:**
```typescript
// constants/localization.ts - Add Portuguese

export const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'Español', nativeName: 'Español' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' }, // NEW
  { code: 'en', name: 'English', nativeName: 'English' }, // NEW
];
```

### 8. Testing MercadoPago

**Test Cards (Argentina):**
```
APPROVED:
Card: 5031 7557 3453 0604
CVV: 123
Expiry: 11/25

REJECTED:
Card: 5031 4332 1540 6351
CVV: 123
Expiry: 11/25
```

### 9. Without Backend - Limitations

**What Works:**
- ✅ Accept payments
- ✅ Take your 2.5% commission
- ✅ Redirect users to MercadoPago checkout
- ✅ Receive payment confirmations

**What Doesn't Work:**
- ❌ Save payment methods for later
- ❌ Automatic payment status updates
- ❌ Refunds (must be manual)
- ❌ Subscription/recurring payments
- ❌ Advanced fraud detection

### 10. Migration Path to Full Integration

**When you get backend:**

**Step 1: Create preference via backend**
```javascript
// Backend: Node.js
const mercadopago = require('mercadopago');

mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
});

app.post('/create-payment', async (req, res) => {
  const preference = {
    items: [{
      title: req.body.description,
      quantity: 1,
      currency_id: 'ARS',
      unit_price: parseFloat(req.body.amount)
    }],
    back_urls: {
      success: 'clubsincronica://payment-success',
      failure: 'clubsincronica://payment-failed',
    },
    marketplace_fee: req.body.amount * 0.025, // Your 2.5%
    notification_url: `${process.env.SERVER_URL}/mercadopago/webhook`
  };

  const response = await mercadopago.preferences.create(preference);
  res.json({ id: response.body.id, init_point: response.body.init_point });
});
```

**Step 2: Handle webhooks**
```javascript
app.post('/mercadopago/webhook', async (req, res) => {
  const { type, data } = req.body;
  
  if (type === 'payment') {
    const payment = await mercadopago.payment.get(data.id);
    
    if (payment.status === 'approved') {
      // Update booking status
      await updateBooking(payment.external_reference, 'confirmed');
    }
  }
  
  res.sendStatus(200);
});
```

---

## Phase 2: Uruguay Expansion

**Requirements:**
- Same MercadoPago account can work in Uruguay
- Currency: UYU (Peso Uruguayo)
- Fees: 3.99% + fixed fee
- Same integration as Argentina

---

## Phase 3: Brazil Expansion

**Requirements:**
- Create separate MercadoPago Brazil account
- Requires CPF (Brazilian tax ID) or CNPJ (business)
- Currency: BRL (Brazilian Real)
- Fees: 4.99% + fixed fee
- **Language: Portuguese required** 🚨

**Portuguese Implementation Needed:**
```typescript
// All UI text must be translated
const translations = {
  es: { /* Spanish */ },
  pt: { /* Portuguese - NEW */ },
  en: { /* English - NEW */ }
};
```

---

## Phase 4: Spain & International

**For Spain:**
- Stripe or Bizum
- Requires CIF (business registration)
- Currency: EUR
- Fees: Lower than MercadoPago

**For US:**
- Stripe (preferred)
- No special requirements
- Currency: USD
- Fees: 2.9% + $0.30

---

## Business Registration Timeline

**You'll need business registration when:**
1. ❌ NOW: Not required for MercadoPago Argentina (personal account works)
2. ⚠️ BRAZIL: CPF/CNPJ required (can use CPF initially)
3. 🔴 SPAIN: CIF required for Bizum and business accounts
4. ⚠️ US: EIN helpful but not required for Stripe

**Recommendation:**
- Start with personal MercadoPago account in Argentina
- Register business when monthly revenue > $5,000 USD
- Or when expanding to Spain/Europe (CIF needed)

---

## Commission & Pricing Strategy

### Your 2.5% Commission Structure

**Option 1: Transparent (Recommended)**
```
Service Price: $100
Your Commission (2.5%): $2.50
Service Provider Receives: $97.50
Buyer Pays: $100
```

**Option 2: Hidden Fee**
```
Service Price: $100
Total Charge: $102.63 (includes your 2.5%)
Service Provider Receives: $100
Buyer Pays: $102.63
```

**Option 3: Split**
```
Service Price: $100
Provider Fee: 1.25% ($1.25)
Buyer Fee: 1.25% ($1.25)
Service Provider Receives: $98.75
Buyer Pays: $101.25
```

### MercadoPago Marketplace Implementation

```typescript
// MercadoPago supports marketplace fees natively!
const preference = {
  items: [{ /*...*/ }],
  marketplace: 'CLUBSINCRONICA',
  marketplace_fee: amount * 0.025, // Your 2.5% automatically deducted
  collector_id: serviceProviderId, // Payment goes to provider
};
```

---

## Action Items - Start Today

1. **✅ Create MercadoPago Argentina Account** (30 minutes)
   - https://www.mercadopago.com.ar/registration-mp
   - Use personal ID initially

2. **✅ Add Portuguese & English Support** (2 hours)
   - Update localization files
   - Translate all UI text

3. **✅ Implement MercadoPago Checkout** (4 hours)
   - Add to payment screen
   - Test with sandbox

4. **✅ Configure Commission** (1 hour)
   - Set marketplace_fee to 2.5%
   - Test commission calculation

5. **⏳ Backend Development** (Later - when needed)
   - Set up when revenue > $5k/month
   - Or when you need advanced features

---

## Estimated Costs

**Immediate (No Backend):**
- MercadoPago Account: FREE
- Transaction Fees: 3.99% + ARS $8 per transaction
- Your Commission: 2.5% (automatically deducted)
- **Total Cost to Provider: ~6.5% per transaction**

**With Backend (Future):**
- Hosting: $5-20/month
- Domain: $10/year
- SSL: FREE
- Development: One-time cost or hire developer

---

**Next Steps:**
1. Create MercadoPago account now (takes 30 min)
2. I'll implement Portuguese/English language support
3. I'll add MercadoPago integration to payment screen
4. Test with sandbox before launch

Should I proceed with steps 2-4?
