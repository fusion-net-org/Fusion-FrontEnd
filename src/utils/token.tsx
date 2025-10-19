// utils/token.ts
export const getUserIdFromToken = (): string | null => {
  const userData = localStorage.getItem('user');
  if (!userData) return null;

  try {
    const parsed = JSON.parse(userData);
    const token = parsed.token;
    if (!token) return null;

    const payloadBase64 = token.split('.')[1];
    const payloadBase64Fixed = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const payloadJson = atob(payloadBase64Fixed);
    const payload = JSON.parse(payloadJson);

    return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || null;
  } catch (error) {
    console.error('Failed to parse token:', error);
    return null;
  }
};
