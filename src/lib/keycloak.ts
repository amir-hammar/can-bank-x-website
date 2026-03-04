export interface KeycloakTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_expires_in?: number;
  token_type?: string;
  scope?: string;
}

const ACCESS_TOKEN_KEY = "canbankx.access_token";
const REFRESH_TOKEN_KEY = "canbankx.refresh_token";
const USER_INFO_KEY = "canbankx.user_info";

const getAuthConfig = () => {
  const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL
  const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "can-bank-x-api";
  const redirectUri = import.meta.env.VITE_REDIRECT_URI ?? "http://localhost:8083/callback";

  return { gatewayUrl, clientId, redirectUri };
};

/**
 * Initiates the OAuth 2.0 Authorization Code flow by redirecting to Keycloak
 */
export const redirectToLogin = () => {
  const { gatewayUrl, clientId, redirectUri } = getAuthConfig();
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid profile email",
  });

  window.location.href = `${gatewayUrl}/auth/realms/can-bank-x/protocol/openid-connect/auth?${params.toString()}`;
};

/**
 * Exchanges the authorization code for JWT tokens
 */
export const exchangeCodeForToken = async (code: string): Promise<KeycloakTokenResponse> => {
  const { gatewayUrl, clientId, redirectUri } = getAuthConfig();

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
  });

  const response = await fetch(`${gatewayUrl}/auth/realms/can-bank-x/protocol/openid-connect/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.access_token) {
    const reason = payload?.error_description ?? payload?.error ?? "Unable to exchange code for token";
    throw new Error(reason);
  }

  const tokens = payload as KeycloakTokenResponse;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  if (tokens.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  }

  return tokens;
};

/**
 * Gets the current access token from storage
 */
export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);

/**
 * Gets the current refresh token from storage
 */
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

/**
 * Checks if the user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

/**
 * Logs out the user by clearing stored tokens
 */
export const logout = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_INFO_KEY);
};

/**
 * Stores user info in local storage
 */
export const setUserInfo = (userInfo: unknown) => {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
};

/**
 * Gets user info from local storage
 */
export const getUserInfo = () => {
  const info = localStorage.getItem(USER_INFO_KEY);
  return info ? JSON.parse(info) : null;
};
