# CanBankX Website

A modern banking web application built with React, TypeScript, and Vite. Features secure OAuth 2.0 authentication via Keycloak with multi-factor authentication (MFA).

## 🚀 Quick Start

### Development Mode

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env if needed
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:8083

## 🔐 Authentication

This application uses **OAuth 2.0 Authorization Code Flow** with Keycloak for authentication. All users are required to set up MFA (TOTP) on first login.

### Authentication Flow

1. **Sign Up / Sign In** → Redirect to Keycloak
2. **Keycloak Login** → User enters credentials
3. **MFA Setup** (first time) → Scan QR code with authenticator app
4. **MFA Validation** → Enter 6-digit code
5. **OAuth Callback** → Frontend receives authorization code
6. **Token Exchange** → Frontend exchanges code for JWT
7. **Complete Registration** (new users) → Fill customer information
8. **Authenticated** → Access protected resources

For detailed authentication documentation, see [AUTHENTICATION.md](./AUTHENTICATION.md).

## 📝 Environment Variables

Create a `.env` file in the project root:

```env
# API Gateway URL (KrakenD)
VITE_API_GATEWAY_URL=http://localhost:8080

# Keycloak OAuth Client ID
VITE_KEYCLOAK_CLIENT_ID=can-bank-x-api

# OAuth Redirect URI
VITE_REDIRECT_URI=http://localhost:8083/callback
```

## 🐳 Docker Deployment

### 1) Create the shared network (one time)

```bash
docker network create can-bank-x-network
```

If it already exists, Docker will ignore the command.

### 2) Start the container

```bash
docker compose up -d --build
```

The app is exposed at:
- `http://localhost:8083`

### 3) Routing

Nginx proxies these paths over `can-bank-x-network`:

- `/api/*` → `api-gateway:8080`
- `/auth/*` → `api-gateway:8080`
- `/realms/*` → `keycloak:8080`
- `/resources/*` → `keycloak:8080`

### 4) Stop containers

```bash
docker compose down
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## 📁 Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── ui/           # shadcn/ui components
│   ├── AuthLayout.tsx
│   ├── LanguageToggle.tsx
│   └── ...
├── pages/            # Page components
│   ├── Index.tsx
│   ├── SignIn.tsx
│   ├── SignUp.tsx
│   ├── OAuthCallback.tsx
│   ├── CompleteRegistration.tsx
│   └── ...
├── lib/              # Utilities and configurations
│   ├── api.ts        # Backend API client
│   ├── keycloak.ts   # OAuth 2.0 implementation
│   ├── i18n.tsx      # Internationalization
│   ├── validation.ts # Form validation schemas
│   └── utils.ts
├── hooks/            # Custom React hooks
└── assets/           # Static assets
```

## 🌐 API Integration

The frontend communicates with the backend through the KrakenD API Gateway. All authenticated requests include a JWT Bearer token.

### Main API Endpoints

- **Authentication:** `/auth/*`
- **Customer Management:** `/api/v1/customers/*`
- **KYC:** `/api/v1/kyc/*`
- **Accounts:** `/api/v1/accounts/*`
- **Transfers:** `/api/v1/transfers/*`

See [AUTHENTICATION.md](./AUTHENTICATION.md) for complete API documentation.

## 🎨 UI Components

This project uses [shadcn/ui](https://ui.shadcn.com/) components with Tailwind CSS for styling. Components are fully customizable and follow modern design patterns.

## 🌍 Internationalization

The application supports English and French. Language can be toggled using the language selector in the navigation bar.

## 🧪 Testing

Run tests with:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

## 📦 Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **React Router** - Routing
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **TanStack Query** - Data fetching
- **Keycloak** - Authentication
- **Docker** - Containerization

## 🚨 Security Considerations

- JWT tokens stored in localStorage (consider httpOnly cookies for production)
- All authentication handled by Keycloak
- MFA required for all users
- HTTPS recommended for production
- Secure token exchange using OAuth 2.0 Authorization Code Flow

## 📄 License

[Your License Here]
