# Polar Integration Setup

This project uses [Polar](https://polar.sh) with [Better Auth](https://better-auth.com) for subscription management and payments.

## Required Environment Variables

Add these to your `.env` file:

```bash
# Polar Configuration
POLAR_ACCESS_TOKEN=your_polar_access_token_here
POLAR_MONTHLY_PRODUCT_ID=your_monthly_product_id
POLAR_YEARLY_PRODUCT_ID=your_yearly_product_id
POLAR_LIFETIME_PRODUCT_ID=your_lifetime_product_id

# Optional: Webhook secret (for production)
POLAR_WEBHOOK_SECRET=your_webhook_secret
```

## Getting Started with Polar

### 1. Create a Polar Account
1. Visit [polar.sh](https://polar.sh) and create an account
2. Create your organization

### 2. Get Your Access Token
1. Go to your Polar Organization Settings
2. Navigate to the "API" section
3. Create an Organization Access Token
4. Copy the token and add it to your `.env` file as `POLAR_ACCESS_TOKEN`

### 3. Create Products
Create three products in your Polar dashboard:

#### Monthly Subscription
- **Type**: Subscription
- **Billing Interval**: Monthly
- **Price**: $19/month (or your preferred price)
- Copy the Product ID and set as `POLAR_MONTHLY_PRODUCT_ID`

#### Yearly Subscription
- **Type**: Subscription
- **Billing Interval**: Yearly
- **Price**: $180/year (or your preferred price - should be discounted vs monthly)
- Copy the Product ID and set as `POLAR_YEARLY_PRODUCT_ID`

#### Lifetime Deal
- **Type**: One-time purchase
- **Price**: $299 (or your preferred price)
- Copy the Product ID and set as `POLAR_LIFETIME_PRODUCT_ID`

### 4. Environment Configuration

For **development**, use Polar's sandbox environment:
- The Better Auth integration automatically uses `sandbox` when `NODE_ENV !== "production"`

For **production**, ensure:
- `NODE_ENV=production`
- Use production Polar access tokens and product IDs
- Set up webhooks (optional for basic functionality)

## Features Implemented

### ✅ Checkout Integration
- **Location**: `/src/components/landing/pricing-section.tsx`
- **Functionality**: 
  - Handles authentication checks
  - Prevents duplicate subscriptions
  - Shows appropriate button states
  - Redirects to Polar checkout

### ✅ Customer State Management
- **API Used**: `authClient.customer.state()`
- **Returns**: Complete customer information including:
  - Active subscriptions
  - Purchase history (orders)
  - Granted benefits
  - Usage meters

### ✅ Premium Dashboard
- **Route**: `/app`
- **Features**:
  - Subscription status overview
  - Lifetime access tracking
  - Quick access to customer portal
  - Profile management


## Key Integration Points

### 1. Authentication Flow
```typescript
// Check if user is authenticated before allowing checkout
if (!session?.user) {
  toast.error("Please sign in to purchase a plan");
  return;
}
```

### 2. Customer State Checking
```typescript
// Always check customer state before operations
const { data } = await authClient.customer.state();
const hasActiveSubscription = data.subscriptions?.some(sub => sub.status === "active");
const hasLifetimeAccess = data.orders?.some(order => order.price?.type === "one_time");
```

### 3. Checkout Process
```typescript
// Use Better Auth Polar checkout with product slugs
await authClient.checkout({
  slug: "monthly" | "yearly" | "lifetime",
});
```

### 4. Customer Portal Access
```typescript
// Redirect to Polar customer portal for subscription management
await authClient.customer.portal();
```

## Access Control

The application implements access control based on customer state:

- **Free Users**: Access to basic chat features
- **Subscription Users**: Access to premium features + dashboard
- **Lifetime Users**: Full access to all features permanently

## Important Notes

### Existing Users vs New Users

- **New Users**: Polar customers are automatically created when they sign up (due to `createCustomerOnSignUp: true`)
- **Existing Users**: May not have Polar customer records yet, which is normal

### Error Handling

The application gracefully handles cases where users don't have Polar customer records:
- Shows appropriate UI states
- Allows checkout (Polar creates customer automatically)
- Provides helpful error messages
- Doesn't break the user experience

### First-Time Checkout

When an existing user makes their first purchase:
1. Polar automatically creates a customer record
2. Customer state becomes available
3. Dashboard features become fully functional

## Next Steps

1. **Add your Polar credentials** to `.env`
2. **Create products** in Polar dashboard
3. **Test checkout flow** in sandbox mode
4. **Set up webhooks** for production (optional)
5. **Customize pricing** and product features as needed

## Documentation References

- [Better Auth Polar Plugin](https://www.better-auth.com/docs/plugins/polar)
- [Polar API Documentation](https://docs.polar.sh/api-reference/customers/state-external)
- [Polar Dashboard](https://polar.sh/dashboard)

## Support

For issues related to:
- **Better Auth**: Check [Better Auth docs](https://better-auth.com/docs)
- **Polar**: Check [Polar docs](https://docs.polar.sh) or [Polar GitHub](https://github.com/polarsource/polar)
- **This integration**: Open an issue in this repository 