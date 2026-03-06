# Authentication Flow Guide

This document describes the OAuth 2.0 authentication flow implemented in the CanBankX frontend.

## Architecture Overview

```
Frontend (React) <-> API Gateway (KrakenD) <-> Backend Services
                          ↓
                   Keycloak (Auth)
```

## Authentication Flow

### 1. Sign Up Flow

1. User clicks "Sign Up" (or "Get Started" / "Open Account") on the home page
2. Frontend redirects to Keycloak registration endpoint via KrakenD:
   ```
   GET http://localhost:8080/realms/can-bank-x/protocol/openid-connect/registrations?
       client_id=can-bank-x-api&
       redirect_uri=http://localhost:8083/callback&
       response_type=code&
      scope=openid profile email
   ```

3. **First-Time User Experience:**
   - User creates account on Keycloak (username, password)
   - Keycloak presents QR code for MFA setup
   - User scans QR code with authenticator app (Google Authenticator, Authy, etc.)
   - User enters 6-digit code from app
   - Keycloak validates and redirects back with authorization code

4. Frontend receives callback with auth code:
   ```
   http://localhost:8083/callback?code=AUTH_CODE
   ```

5. Frontend exchanges code for JWT token:
   ```
   POST http://localhost:8080/auth/realms/can-bank-x/protocol/openid-connect/token
   Content-Type: application/x-www-form-urlencoded
   
   grant_type=authorization_code&
   code=AUTH_CODE&
   client_id=can-bank-x-api&
   redirect_uri=http://localhost:8083/callback
   ```

6. Backend responds with JWT token:
   ```json
   {
     "access_token": "eyJhbGc...",
     "token_type": "Bearer",
     "expires_in": 300,
     "refresh_token": "...",
     "scope": "openid profile email"
   }
   ```

7. Frontend stores token and redirects to Complete Registration page

8. User fills in customer details (name, address, NAS)

9. Frontend calls customer registration API:
   ```
   POST http://localhost:8080/api/v1/customers/register
   Authorization: Bearer <JWT_TOKEN>
   Content-Type: application/json
   
   {
     "fullName": "John Doe",
     "email": "john@example.com",
     "address": {
       "street": "123 Maple St",
       "city": "Toronto",
       "province": "Ontario",
       "postalCode": "M1A1A1",
       "country": "Canada"
     },
     "nas": "123456789"
   }
   ```

10. Backend creates customer record and returns customer_id

11. Frontend redirects to KYC submission

### 2. Sign In Flow

1. User clicks "Sign In" on the home page
2. Frontend redirects to Keycloak login endpoint:
   ```
   GET http://localhost:8080/realms/can-bank-x/protocol/openid-connect/auth?
       client_id=can-bank-x-api&
       redirect_uri=http://localhost:8083/callback&
       response_type=code&
       scope=openid profile email
   ```
3. **Returning User Experience:**
   - User enters username and password
   - User enters 6-digit code from authenticator app
   - Keycloak validates and redirects back with authorization code
4. Frontend exchanges code for JWT token (same as signup)
5. Frontend redirects to dashboard/home

### 3. Authenticated API Calls

All authenticated requests include the JWT token:

```
Authorization: Bearer <JWT_TOKEN>
```

The API Gateway (KrakenD) validates the JWT and extracts claims:
- Validates signature using Keycloak's public keys
- Checks token expiration
- Extracts `sub` claim and passes as `X-User-Sub` header to backend services

## API Endpoints

### Authentication (via KrakenD → Keycloak)

- **GET /realms/can-bank-x/protocol/openid-connect/auth** - Sign in flow entrypoint
- **GET /realms/can-bank-x/protocol/openid-connect/registrations** - Sign up flow entrypoint
- **POST /auth/realms/can-bank-x/protocol/openid-connect/token** - Exchange code for token
- **GET /auth/realms/can-bank-x/protocol/openid-connect/certs** - Get Keycloak public keys (for JWT validation)

### User/Customer Management

- **POST /api/v1/customers/register** - Register new customer (requires auth)
- **GET /api/v1/auth/me** - Get current user info (requires auth)
- **GET /api/v1/customers/{id}** - Get customer details (requires auth)

### KYC

- **POST /api/v1/kyc/submit** - Submit KYC documents (requires auth)
- **GET /api/v1/kyc/status/{customer_id}** - Check KYC status (requires auth)

### Accounts

- **GET /api/v1/accounts/list** - List user accounts (requires auth)
- **GET /api/v1/accounts/{id}** - Get account details (requires auth)

### Transfers

- **POST /api/v1/transfers/create** - Create transfer (requires auth)
- **GET /api/v1/transfers/history** - Get transfer history (requires auth)

## Environment Variables

```bash
# API Gateway URL
VITE_API_GATEWAY_URL=http://localhost:8080

# Keycloak Client ID
VITE_KEYCLOAK_CLIENT_ID=can-bank-x-api

# OAuth Redirect URI
VITE_REDIRECT_URI=http://localhost:8083/callback
```

## Frontend Files

### Core Auth Files

- **src/lib/keycloak.ts** - OAuth 2.0 flow implementation
   - `redirectToSignIn()` - Redirects to Keycloak sign-in page
   - `redirectToSignUp()` - Redirects to Keycloak registration page
  - `exchangeCodeForToken()` - Exchanges auth code for JWT
   - `consumeAuthFlow()` - Reads sign-in/sign-up flow marker during callback
  - `getAccessToken()` - Gets stored token
  - `isAuthenticated()` - Checks if user is logged in
  - `logout()` - Clears tokens

- **src/lib/api.ts** - Backend API client
  - `registerCustomer()` - Customer registration
  - `getCurrentUser()` - Get user info
  - `submitKYC()` - Submit KYC
  - `getKYCStatus()` - Check KYC status
  - `getAccounts()` - List accounts
  - `createTransfer()` - Create transfer

### Pages

- **src/pages/Index.tsx** - Home page CTAs redirect directly to Keycloak sign-in/sign-up endpoints
- **src/pages/OAuthCallback.tsx** - Handles OAuth callback
- **src/pages/CompleteRegistration.tsx** - Customer registration form

## Security Features

1. **OAuth 2.0 Authorization Code Flow** - Industry standard, prevents token exposure
2. **JWT Tokens** - Stateless authentication with RS256 signing
3. **MFA (TOTP)** - Required for all users, adds security layer
4. **Token Storage** - Tokens stored in localStorage (consider httpOnly cookies for production)
5. **HTTPS** - All production traffic over HTTPS (configure in deployment)
6. **CORS** - API Gateway configured with strict CORS policy

## Development Setup

1. **Start Backend Services:**
   ```bash
   docker compose up -d
   ```

2. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Start Dev Server:**
   ```bash
   npm run dev
   ```

5. **Access Application:**
   - Frontend: http://localhost:8083
   - API Gateway: http://localhost:8080
   - Keycloak: http://localhost:8082

## Testing the Flow

1. Navigate to http://localhost:8083
2. Click "Get Started" or "Open Account"
3. You'll be redirected to Keycloak
4. Create account (username/password)
5. Scan QR code with Google Authenticator
6. Enter 6-digit code
7. You'll be redirected back to frontend
8. Complete customer registration form
9. Submit and proceed to KYC

## Troubleshooting

### "Unable to exchange code for token"
- Check that API Gateway is running
- Verify `VITE_API_GATEWAY_URL` is correct
- Ensure `redirect_uri` matches Keycloak client configuration

### "Authorization code expired"
- Authorization codes are single-use and expire quickly
- Don't refresh the callback page
- Start the flow again from sign in/sign up

### "Invalid redirect_uri"
- Ensure `VITE_REDIRECT_URI` matches Keycloak client config
- Check for trailing slashes and exact URL match

### MFA Issues
- Make sure phone time is synced (TOTP is time-based)
- Use apps like Google Authenticator, Authy, Microsoft Authenticator
- If QR scan fails, try manual entry of the secret code

## Production Considerations

1. **Environment Variables:**
   - Use production API Gateway URL
   - Use HTTPS for all URLs
   - Set proper redirect URIs

2. **Token Security:**
   - Consider httpOnly cookies instead of localStorage
   - Implement token refresh logic
   - Set appropriate token expiration times

3. **Error Handling:**
   - Add comprehensive error messages
   - Implement retry logic for network failures
   - Add logging for debugging

4. **User Experience:**
   - Add loading states
   - Implement "Remember me" functionality
   - Add session timeout warnings
