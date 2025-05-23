// Functions for working with authentication tokens

/**
 * Get the authentication token from local storage
 * @returns {string|null} The authentication token or null if not found
 */
export const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

/**
 * Set the authentication token in local storage
 * @param {string} token - The authentication token to store
 */
export const setToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

/**
 * Remove the authentication token from local storage
 */
export const removeToken = (): void => {
  localStorage.removeItem('auth_token');
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated, false otherwise
 */
export const isAuthenticated = (): boolean => {
  return !!getToken();
};