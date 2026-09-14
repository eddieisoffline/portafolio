export function getSiteOrigin(currentUrl: URL): string {
  const configuredUrl = import.meta.env.PUBLIC_SITE_URL?.trim();

  if (!configuredUrl) {
    return currentUrl.origin;
  }

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return currentUrl.origin;
  }
}

export function toAbsoluteUrl(pathOrUrl: string, siteOrigin: string): string {
  return new URL(pathOrUrl, siteOrigin).toString();
}
