const TOKEN_KEY = "smartseason_access_token";
const ROLE_KEY = "smartseason_role";

export const tokenStorage = {
  set(accessToken: string) {
    localStorage.setItem(TOKEN_KEY, accessToken);
  },
  get() {
    return localStorage.getItem(TOKEN_KEY);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

export const roleStorage = {
  set(role: string) {
    localStorage.setItem(ROLE_KEY, role);
  },
  get() {
    return localStorage.getItem(ROLE_KEY);
  },
  clear() {
    localStorage.removeItem(ROLE_KEY);
  },
};

export const clearSession = () => {
  tokenStorage.clear();
  roleStorage.clear();
};
