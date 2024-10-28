# Financial Data Analyst App

A Next.js application with Supabase authentication and Stripe subscription management.

## 🔐 Authentication Flow

### Login Process
- **Multiple Auth Methods:**
  - Email/Password: Direct authentication with Supabase
  - Google OAuth: Enhanced security with PKCE flow
- **Implementation:** See `login/page.tsx` for details

### OAuth Callback
- Handles Google authentication callback
- Exchanges OAuth code for session
- Smart redirects:
  - Success → Dashboard
  - Failure → Login with error details

### Session Management
Three specialized Supabase clients:
| Client | File | Purpose |
|--------|------|---------|
| Browser | `supabase-browser.ts` | Client components |
| Server | `supabase-server.ts` | Server components |
| Base | `supabase.ts` | General configuration |

## 💳 Subscription Flow

### Subscription Creation
1. User initiates from dashboard
2. Redirects to Stripe Checkout
3. Webhook processes payment:
   - Creates subscription record
   - Updates user status
   - Manages lifecycle

### Subscription Management
- **Customer Portal Integration**
  - Users manage subscriptions via Stripe Portal
  - Secure portal session creation
  - Real-time status updates

### Webhook Events
The system handles multiple subscription events:
- `payment_intent.succeeded`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

### Subscription Verification
- Active status check via `isSubscriptionActive()`
- Gates premium features
- Validates:
  - Subscription status
  - Expiration date

## 🔒 Security Measures

### Authentication Security
- PKCE flow for OAuth
- Secure cookie-based session storage
- Edge runtime support
- Automatic token refresh

### Subscription Security
- Server-side webhook verification
- Secure customer portal access
- Database-level access control
- Real-time status updates


