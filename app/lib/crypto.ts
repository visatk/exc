// Simple PBKDF2 hashing using Web Crypto API to run natively on Cloudflare Workers
export async function hashPassword(password: string, saltString?: string): Promise<string> {
  const enc = new TextEncoder();
  
  // Use provided salt or generate a new one
  let salt: Uint8Array;
  if (saltString) {
    salt = Uint8Array.from(atob(saltString), c => c.charCodeAt(0));
  } else {
    salt = crypto.getRandomValues(new Uint8Array(16));
  }

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const exportedKey = await crypto.subtle.exportKey("raw", key);
  const hashBuffer = new Uint8Array(exportedKey);
  
  const hashArray = Array.from(hashBuffer);
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  const saltBase64 = btoa(String.fromCharCode.apply(null, Array.from(salt)));
  
  return `${saltBase64}:${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltBase64, hashHex] = storedHash.split(':');
  if (!saltBase64 || !hashHex) return false;
  
  const testHash = await hashPassword(password, saltBase64);
  return testHash === storedHash;
}
