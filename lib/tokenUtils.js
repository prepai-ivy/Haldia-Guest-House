// Decode JWT token and extract payload
export function decodeToken(token) {
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode the payload (second part)
    const decoded = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );
    return decoded;
  } catch {
    return null;
  }
}

// Check if token is expired
export function isTokenExpired(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  // exp is in seconds, convert to milliseconds
  const expirationTime = decoded.exp * 1000;
  const currentTime = Date.now();
  
  // Consider token expired if less than 1 minute remaining
  return currentTime >= expirationTime - 60000;
}

// Get time remaining until token expires (in milliseconds)
export function getTokenTimeRemaining(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return 0;
  
  const expirationTime = decoded.exp * 1000;
  const currentTime = Date.now();
  
  return Math.max(0, expirationTime - currentTime - 60000);
}
