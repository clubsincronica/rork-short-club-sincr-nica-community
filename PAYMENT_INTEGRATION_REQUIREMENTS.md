# Payment Integration Requirements

## Overview
This document outlines the requirements and implementation details for integrating real payment processors into the Club Sincrónica app.

---

## 1. MercadoPago Integration

### Required Information
- **Merchant Account:**
  - [ ] Business/Personal MercadoPago account
  - [ ] Public Key (pk_live_... or pk_test_...)
  - [ ] Access Token (access_token)
  - [ ] Country of operation (Argentina, Brazil, Mexico, etc.)

### Technical Requirements
- **SDK:** MercadoPago SDK for React Native
  - Package: `react-native-mercadopago-px` or `mercadopago`
  - npm: `npm install mercadopago`

- **API Endpoints:**
  - Create Preference: `POST /checkout/preferences`
  - Process Payment: `POST /v1/payments`
  - Webhook URL for payment notifications

### Implementation Steps
1. **Backend Setup Required:**
   - Node.js/Express server to handle payment creation
   - Store Access Token securely (environment variables)
   - Endpoint: `POST /api/create-mercadopago-payment`
   - Webhook endpoint: `POST /api/mercadopago/webhook`

2. **Frontend Integration:**
   ```typescript
   // Install SDK
   npm install react-native-mercadopago-px
   
   // Configuration
   import MercadoPago from 'react-native-mercadopago-px';
   
   MercadoPago.setPublishableKey('YOUR_PUBLIC_KEY');
   
   // Create payment
   const payment = await MercadoPago.createPayment({
     amount: 100.00,
     description: 'Service booking',
     currency: 'EUR', // or ARS, BRL, MXN depending on country
   });
   ```

3. **Payment Flow:**
   - User selects MercadoPago
   - App calls backend to create preference
   - Backend returns preference ID
   - App opens MercadoPago checkout
   - User completes payment
   - Webhook notifies backend of payment status
   - Backend updates booking/order status
   - App shows confirmation

### Required Credentials
```env
# .env file (backend)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxx-xxxxxxxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxxxxx-xxxxxxxx
MERCADOPAGO_WEBHOOK_SECRET=your_webhook_secret
```

### Testing
- **Sandbox Mode:**
  - Test cards: 4509 9535 6623 3704 (approved)
  - CVV: 123
  - Expiry: Any future date

### Fees
- Argentina: 3.99% + fixed fee
- Brazil: 4.99% + fixed fee
- Mexico: 3.99% + fixed fee
- Chile: 3.49% + fixed fee

### Documentation
- Docs: https://www.mercadopago.com/developers/en/docs
- API Reference: https://www.mercadopago.com/developers/en/reference

---

## 2. Credit/Debit Card Processing (Stripe)

### Required Information
- **Stripe Account:**
  - [ ] Stripe account (business or individual)
  - [ ] Publishable Key (pk_live_... or pk_test_...)
  - [ ] Secret Key (sk_live_... or sk_test_...)
  - [ ] Webhook Secret (whsec_...)
  - [ ] Business verification completed

### Technical Requirements
- **SDK:** Stripe React Native SDK
  - Package: `@stripe/stripe-react-native`
  - npm: `npm install @stripe/stripe-react-native`

- **Required Backend:**
  - Create Payment Intent endpoint
  - Handle webhooks for payment events
  - 3D Secure (SCA) support required for European cards

### Implementation Steps
1. **Install Dependencies:**
   ```bash
   npm install @stripe/stripe-react-native
   ```

2. **Setup Provider:**
   ```tsx
   import { StripeProvider } from '@stripe/stripe-react-native';
   
   <StripeProvider publishableKey="pk_test_...">
     <App />
   </StripeProvider>
   ```

3. **Create Payment Intent (Backend):**
   ```javascript
   // Backend: Node.js/Express
   const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
   
   app.post('/create-payment-intent', async (req, res) => {
     const { amount, currency } = req.body;
     
     const paymentIntent = await stripe.paymentIntents.create({
       amount: amount * 100, // cents
       currency: currency || 'eur',
       payment_method_types: ['card'],
       metadata: {
         userId: req.body.userId,
         bookingId: req.body.bookingId
       }
     });
     
     res.json({ clientSecret: paymentIntent.client_secret });
   });
   ```

4. **Process Payment (Frontend):**
   ```tsx
   import { useStripe, CardField } from '@stripe/stripe-react-native';
   
   const { confirmPayment } = useStripe();
   
   const handlePayment = async () => {
     // Get client secret from backend
     const { clientSecret } = await fetch('/create-payment-intent', {
       method: 'POST',
       body: JSON.stringify({ amount: 100, currency: 'eur' })
     }).then(r => r.json());
     
     // Confirm payment
     const { error, paymentIntent } = await confirmPayment(clientSecret, {
       paymentMethodType: 'Card',
     });
     
     if (error) {
       Alert.alert('Payment failed', error.message);
     } else {
       Alert.alert('Success', 'Payment confirmed!');
     }
   };
   ```

### Required Credentials
```env
# .env file (backend)
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxx
```

### Testing
- **Test Cards:**
  - Success: 4242 4242 4242 4242
  - 3D Secure: 4000 0027 6000 3184
  - Declined: 4000 0000 0000 0002
  - CVV: Any 3 digits
  - Expiry: Any future date

### Fees
- European cards: 1.5% + €0.25
- Non-European cards: 2.9% + €0.25
- Additional fees for currency conversion

### Documentation
- Docs: https://stripe.com/docs
- React Native: https://stripe.com/docs/payments/accept-a-payment?platform=react-native

---

## 3. Bizum Integration (Spain)

### Required Information
- **Bank Partnership Required:**
  - [ ] Partnership with Spanish bank that offers Bizum for businesses
  - [ ] Bizum Business account
  - [ ] API credentials from bank
  - [ ] CIF (Company Tax ID in Spain)

### Important Notes
- **Bizum is NOT a standalone payment processor**
- Bizum must be integrated through a banking partner or payment gateway
- Options:
  1. **Redsys** (Spanish payment gateway with Bizum)
  2. **BBVA API** (if you bank with BBVA)
  3. **Santander** (if you bank with Santander)
  4. **CaixaBank** (if you bank with CaixaBank)

### Recommended: Redsys Integration

#### Required Information
- [ ] Redsys merchant account
- [ ] Merchant Code (FUC)
- [ ] Terminal Number
- [ ] Secret Key (Clave secreta)
- [ ] Bizum enabled on account

#### Technical Requirements
- **No official React Native SDK**
- Custom implementation required
- HTTP POST to Redsys endpoints
- HMAC-SHA256 signature required

#### Implementation Steps
1. **Backend Setup (Required):**
   ```javascript
   // Backend: Create Bizum payment request
   const crypto = require('crypto');
   
   function createRedsysSignature(params, secretKey) {
     const merchant3DS = Buffer.from(JSON.stringify(params)).toString('base64');
     const key = Buffer.from(secretKey, 'base64');
     const cipher = crypto.createCipheriv('des-ede3-cbc', key, Buffer.alloc(8, 0));
     const encrypted = Buffer.concat([cipher.update(merchant3DS), cipher.final()]);
     return crypto.createHmac('sha256', encrypted)
       .update(merchant3DS)
       .digest('base64');
   }
   
   app.post('/create-bizum-payment', async (req, res) => {
     const params = {
       DS_MERCHANT_AMOUNT: req.body.amount * 100, // cents
       DS_MERCHANT_ORDER: generateOrderNumber(),
       DS_MERCHANT_MERCHANTCODE: process.env.REDSYS_MERCHANT_CODE,
       DS_MERCHANT_CURRENCY: '978', // EUR
       DS_MERCHANT_TRANSACTIONTYPE: '0', // Authorization
       DS_MERCHANT_TERMINAL: process.env.REDSYS_TERMINAL,
       DS_MERCHANT_MERCHANTURL: 'https://yourserver.com/redsys/webhook',
       DS_MERCHANT_URLOK: 'https://yourapp.com/payment-success',
       DS_MERCHANT_URLKO: 'https://yourapp.com/payment-failed',
       DS_MERCHANT_PAYMETHODS: 'z' // Bizum
     };
     
     const signature = createRedsysSignature(params, process.env.REDSYS_SECRET_KEY);
     
     res.json({
       Ds_MerchantParameters: Buffer.from(JSON.stringify(params)).toString('base64'),
       Ds_Signature: signature,
       Ds_SignatureVersion: 'HMAC_SHA256_V1'
     });
   });
   ```

2. **Frontend Integration:**
   ```tsx
   import { Linking } from 'react-native';
   
   const handleBizumPayment = async () => {
     // Get payment params from backend
     const paymentData = await fetch('/create-bizum-payment', {
       method: 'POST',
       body: JSON.stringify({ amount: 100 })
     }).then(r => r.json());
     
     // Open Redsys payment page in browser or WebView
     const redsysUrl = `https://sis.redsys.es/sis/realizarPago`;
     const formHtml = `
       <form action="${redsysUrl}" method="POST" id="bizumForm">
         <input type="hidden" name="Ds_SignatureVersion" value="${paymentData.Ds_SignatureVersion}" />
         <input type="hidden" name="Ds_MerchantParameters" value="${paymentData.Ds_MerchantParameters}" />
         <input type="hidden" name="Ds_Signature" value="${paymentData.Ds_Signature}" />
       </form>
       <script>document.getElementById('bizumForm').submit();</script>
     `;
     
     // Open in WebView or external browser
     // User completes payment in Bizum app
     // Webhook notifies backend of result
   };
   ```

### Alternative: Stripe with Bizum (Beta)
Stripe now supports Bizum in Spain:
```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000, // €100.00
  currency: 'eur',
  payment_method_types: ['card', 'bizum'],
});
```

### Required Credentials (Redsys)
```env
# .env file (backend)
REDSYS_MERCHANT_CODE=999008881
REDSYS_TERMINAL=001
REDSYS_SECRET_KEY=sq7HjrUOBfKmC576ILgskD5srU870gJ7
REDSYS_ENVIRONMENT=test # or 'production'
```

### Testing (Redsys)
- Test environment: https://sis-t.redsys.es:25443/sis/realizarPago
- Test phone: 600000000
- Test Bizum code: 000000

### Fees
- Bizum transaction: ~€0.50 - €0.80 per transaction
- Monthly fee: Varies by bank/gateway
- No percentage fees (flat rate only)

### Documentation
- Redsys: https://pagosonline.redsys.es/desarrolladores.html
- Bizum for Business: https://bizum.es/empresas/

---

## 4. Required Backend Infrastructure

### Mandatory Backend Services
All payment integrations require a secure backend server:

1. **Payment Intent Creation**
   - Create payment intents/preferences
   - Store sensitive API keys securely
   - Generate unique order IDs

2. **Webhook Handling**
   - Receive payment status notifications
   - Verify webhook signatures
   - Update database with payment status

3. **Security Requirements**
   - HTTPS required (SSL certificate)
   - Environment variables for secrets
   - Input validation and sanitization
   - Rate limiting
   - CORS configuration

### Recommended Stack
```
Backend: Node.js + Express
Database: PostgreSQL or MongoDB
Hosting: Heroku, AWS, DigitalOcean, or Railway
```

### Example Backend Structure
```
/backend
  /routes
    - mercadopago.js
    - stripe.js
    - redsys.js
  /controllers
    - paymentController.js
  /models
    - Payment.js
    - Booking.js
  /middleware
    - auth.js
    - validateWebhook.js
  - server.js
  - .env
```

---

## 5. App Changes Required

### Current Payment Method Storage
Location: `hooks/user-store.ts`

```typescript
// Current structure (local storage only)
interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple-pay' | 'mercadopago' | 'bizum';
  last4?: string;
  brand?: string;
  isDefault: boolean;
}
```

### Changes Needed

1. **Add Payment Token Storage:**
   ```typescript
   interface PaymentMethod {
     id: string;
     type: 'card' | 'paypal' | 'apple-pay' | 'mercadopago' | 'bizum';
     last4?: string;
     brand?: string;
     isDefault: boolean;
     // NEW: Store payment method ID from provider
     paymentMethodId?: string; // Stripe: pm_xxx, MercadoPago: card_id
     customerId?: string; // For saved cards
   }
   ```

2. **Create Payment Service:**
   ```typescript
   // utils/paymentService.ts
   export const PaymentService = {
     async processCardPayment(amount: number, paymentMethodId: string) {
       const response = await fetch(`${API_URL}/create-payment-intent`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ amount, paymentMethodId })
       });
       return response.json();
     },
     
     async processMercadoPago(amount: number, description: string) {
       const response = await fetch(`${API_URL}/create-mercadopago-payment`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ amount, description })
       });
       return response.json();
     },
     
     async processBizum(amount: number, orderId: string) {
       const response = await fetch(`${API_URL}/create-bizum-payment`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ amount, orderId })
       });
       return response.json();
     }
   };
   ```

3. **Update Payment Screen:**
   - Add Stripe card input component
   - Add MercadoPago checkout button
   - Add Bizum payment flow
   - Handle payment responses
   - Show loading states
   - Handle errors gracefully

---

## 6. Compliance & Legal Requirements

### PCI DSS Compliance
- ✅ Use payment providers (Stripe/MercadoPago) - they handle PCI compliance
- ✅ Never store card numbers, CVV, or full card data
- ✅ Only store tokenized payment methods
- ✅ Use HTTPS for all API calls

### GDPR Compliance (EU/Spain)
- [ ] Privacy policy mentioning payment data processing
- [ ] Terms of service for payment transactions
- [ ] User consent for storing payment methods
- [ ] Right to delete payment data

### Spanish Regulations
- [ ] Company registration (CIF required for Bizum)
- [ ] Terms and conditions in Spanish
- [ ] Consumer protection laws compliance
- [ ] Invoice generation for transactions

---

## 7. Cost Summary

### Setup Costs
- Stripe account: FREE
- MercadoPago account: FREE
- Bizum (via Redsys): €0 - €500 setup (varies by bank)
- Backend hosting: €5 - €50/month

### Transaction Fees
- **Stripe:** 1.5% + €0.25 (EU cards) | 2.9% + €0.25 (non-EU cards)
- **MercadoPago:** 3.99% + fixed fee (varies by country)
- **Bizum:** ~€0.50 - €0.80 flat fee per transaction

### Monthly Costs
- Backend server: €5 - €50/month
- Database: €0 - €20/month
- SSL certificate: FREE (Let's Encrypt) or €50 - €200/year

---

## 8. Implementation Priority

### Phase 1 (Immediate)
1. ✅ Create backend server
2. ✅ Implement Stripe integration (most universal)
3. ✅ Add card payment to app
4. ✅ Test with sandbox

### Phase 2 (Short-term)
1. ✅ Add MercadoPago for Latin America
2. ✅ Setup webhooks
3. ✅ Add payment status tracking

### Phase 3 (Medium-term)
1. ✅ Add Bizum for Spanish users
2. ✅ Implement refund functionality
3. ✅ Add payment history

---

## 9. Next Steps - Action Items

### Immediate Actions Required:
1. **Choose payment providers:**
   - [ ] Stripe (recommended for global)
   - [ ] MercadoPago (if targeting Latin America)
   - [ ] Bizum (if Spanish market is primary)

2. **Create merchant accounts:**
   - [ ] Sign up for Stripe
   - [ ] Sign up for MercadoPago (if needed)
   - [ ] Contact bank for Bizum business account (if needed)

3. **Backend development:**
   - [ ] Set up Node.js backend server
   - [ ] Deploy to hosting service
   - [ ] Implement payment endpoints
   - [ ] Set up webhook handlers

4. **App integration:**
   - [ ] Install payment SDKs
   - [ ] Update payment screens
   - [ ] Implement payment flows
   - [ ] Add error handling

5. **Testing:**
   - [ ] Test with sandbox credentials
   - [ ] Test all payment flows
   - [ ] Test webhooks
   - [ ] Test error scenarios

6. **Legal compliance:**
   - [ ] Update privacy policy
   - [ ] Update terms of service
   - [ ] Add payment disclaimers
   - [ ] Set up invoice generation

### Questions to Answer:
1. **What is your primary market?** (Spain, Latin America, Global)
2. **Do you have a company registered?** (Required for Bizum)
3. **What currencies do you need to support?** (EUR, USD, ARS, etc.)
4. **Do you have backend development resources?** (Required for all integrations)
5. **What is your expected transaction volume?** (Affects provider choice and fees)

---

## 10. Support & Resources

### Developer Support
- **Stripe:** https://support.stripe.com/
- **MercadoPago:** https://www.mercadopago.com/developers/en/support
- **Redsys:** soporte.comercios@redsys.es

### Community Resources
- Stripe Discord: https://discord.gg/stripe
- MercadoPago Forum: https://www.mercadopago.com/developers/en/community
- React Native Payments: https://github.com/react-native-community/discussions-and-proposals

---

**Document Status:** Ready for implementation
**Last Updated:** December 1, 2025
**Next Review:** After merchant accounts are created
