[# Financial Data Analyst App - Under Development, for test purposes only

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


](https://github.com/marioszabo/financial-data-analyst
### Core Purpose
The application allows users to:
1. Analyze financial data
2. Generate visualizations
3. Access premium features through subscriptions
4. Interact with financial data through a chat interface

### Technical Architecture

1. **Authentication System**
- Built on Supabase Auth
- Supports both email/password and Google OAuth
- Uses PKCE flow for enhanced security
- Manages sessions through three client types:
  - Browser client for client-side operations
  - Server client for server-side operations
  - Base client for configuration

2. **Subscription System**
The subscription flow is handled through Stripe integration.

The webhook handler manages:
- Subscription creation
- Status updates
- Payment processing
- Cancellations
- Failed payment handling

3. **Database Structure**
Uses Supabase (PostgreSQL) with tables for:
- Users (auth)
- Subscriptions
- Chat messages
- Analysis data

4. **Security Implementation**
- Server-side webhook verification
- Edge runtime for better performance
- Geographic deployment optimization
- Secure session management
- Database-level access control

5. **Feature Access Control**
- Premium features are gated behind subscription status
- Real-time subscription status verification
- Graceful handling of payment failures
- Automatic status updates

### User Flow

1. **Authentication**
- User signs up/logs in
- Session is created and stored
- Redirected to dashboard

2. **Subscription Process**
- User selects subscription plan
- Redirected to Stripe Checkout
- Payment processed
- Webhook updates database
- User gains premium access

3. **Feature Access**
- Regular users: Basic features
- Premium users: Full feature set
- Real-time status checks
- Subscription management through Stripe Portal

### Technical Implementation

The webhook system is particularly sophisticated:
- Handles multiple event types
- Asynchronous processing
- Error handling
- Database updates
- Status management


This ensures:
- Reliable payment processing
- Accurate subscription status
- Data consistency
- Error recovery

### Integration Points
1. **Frontend**: Next.js App Router
2. **Authentication**: Supabase Auth
3. **Payments**: Stripe
4. **Database**: Supabase PostgreSQL
5. **Runtime**: Edge-compatible

The system is designed to be:
- Scalable
- Secure
- Reliable
- User-friendly
- Maintainable

All components work together to provide a seamless experience for financial data analysis while maintaining secure access control through the subscription system.)
