const API_BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

/**
 * Turns the root-relative avatar path the API returns (`/api/avatars/<id>`)
 * into a URL pointing at the API itself.
 *
 * Frontend and backend are deployed to different hosts, so leaving the path
 * relative would resolve it against the frontend - which serves the SPA for
 * every unknown path and would hand back HTML instead of an image.
 */
export function resolveAvatarUrl(
  avatar: string | null | undefined,
  apiBaseUrl: string = API_BASE_URL,
): string | undefined {
  if (!avatar) return undefined;
  // Already absolute (an externally hosted picture) - leave it alone.
  if (/^https?:\/\//i.test(avatar) || avatar.startsWith("data:")) return avatar;
  if (!avatar.startsWith("/")) return avatar;

  try {
    // apiBaseUrl is either absolute ("https://api.example.com/api") or
    // relative ("/api", proxied in dev); both give the right origin here.
    const { origin } = new URL(apiBaseUrl, window.location.origin);
    return `${origin}${avatar}`;
  } catch {
    return avatar;
  }
}
