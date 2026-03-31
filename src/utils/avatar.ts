/**
 * Gravatar avatar URL generation
 */
export async function getAvatar(email: string): Promise<string> {
  if (!email) return '';
  const hash = await md5(email.trim().toLowerCase());
  return `https://gravatar.com/avatar/${hash}?d=mp`;
}

async function md5(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('MD5', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
