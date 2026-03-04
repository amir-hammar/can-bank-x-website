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

const getAuthConfig = () => {
  const realm = import.meta.env.VITE_KEYCLOAK_REALM ?? "can-bank-x";
  const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "can-bank-x-web";
  const clientSecret = import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET ?? "";
  const tokenPath = import.meta.env.VITE_KEYCLOAK_TOKEN_PATH ?? `/realms/${realm}/protocol/openid-connect/token`;

  return { realm, clientId, clientSecret, tokenPath };
};

export const signInWithKeycloak = async (username: string, password: string): Promise<KeycloakTokenResponse> => {
  const { clientId, clientSecret, tokenPath } = getAuthConfig();

  const body = new URLSearchParams({
    grant_type: "password",
    client_id: clientId,
    username,
    password,
  });

  if (clientSecret) {
    body.set("client_secret", clientSecret);
  }

  const response = await fetch(tokenPath, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.access_token) {
    const reason = payload?.error_description ?? payload?.error ?? "Unable to sign in";
    throw new Error(reason);
  }

  const tokens = payload as KeycloakTokenResponse;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  if (tokens.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  }

  return tokens;
};

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
