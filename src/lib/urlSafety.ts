import dns from "dns";
import { promisify } from "util";

const lookupAsync = promisify(dns.lookup);

/**
 * Validates if the given URL is safe to fetch from the server.
 * Resolves hostnames and rejects private IP spaces, loopbacks, and metadata service hosts.
 */
export async function isSafeUrlToFetch(urlStr: string): Promise<boolean> {
  if (!urlStr) return false;

  try {
    const parsedUrl = new URL(urlStr);

    // Block non-HTTP/HTTPS schemes
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      console.log(`[UrlSafety] Rejected non-HTTP/HTTPS scheme: ${parsedUrl.protocol}`);
      return false;
    }

    // Allow localhost/private IP ranges in development or when explicitly enabled
    if (process.env.NODE_ENV !== "production" || process.env.ALLOW_LOCAL_URLS === "true") {
      return true;
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    // Block obvious local hosts immediately
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1"
    ) {
      console.log(`[UrlSafety] Rejected local hostname: ${hostname}`);
      return false;
    }

    // Resolve DNS
    let ip: string;
    try {
      const result = await lookupAsync(hostname);
      ip = result.address;
    } catch (err) {
      console.log(`[UrlSafety] DNS lookup failed for ${hostname}`);
      return false;
    }

    // Check loopback / wildcards
    if (ip.startsWith("127.") || ip === "0.0.0.0" || ip === "::1") {
      console.log(`[UrlSafety] Rejected loopback/wildcard IP: ${ip}`);
      return false;
    }

    // Check private IPv4 spaces
    const parts = ip.split(".").map(Number);
    if (parts.length === 4) {
      const [first, second] = parts;

      // 10.0.0.0/8
      if (first === 10) {
        console.log(`[UrlSafety] Rejected private IP 10.0.0.0/8: ${ip}`);
        return false;
      }

      // 172.16.0.0/12
      if (first === 172 && second >= 16 && second <= 31) {
        console.log(`[UrlSafety] Rejected private IP 172.16.0.0/12: ${ip}`);
        return false;
      }

      // 192.168.0.0/16
      if (first === 192 && second === 168) {
        console.log(`[UrlSafety] Rejected private IP 192.168.0.0/16: ${ip}`);
        return false;
      }

      // 169.254.0.0/16 (Link-local/AWS/Google Cloud Metadata)
      if (first === 169 && second === 254) {
        console.log(`[UrlSafety] Rejected link-local IP 169.254.0.0/16: ${ip}`);
        return false;
      }
    }

    // Check private IPv6 spaces
    if (
      ip.startsWith("fe80:") || 
      ip.startsWith("fc00:") || 
      ip.startsWith("fd00:")
    ) {
      console.log(`[UrlSafety] Rejected private IPv6: ${ip}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`[UrlSafety] Failed to parse URL or resolve host ${urlStr}:`, err);
    return false;
  }
}
