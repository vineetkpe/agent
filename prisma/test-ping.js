const { isSafeUrlToFetch } = require("../src/lib/urlSafety");

async function pingSite(url) {
  const startTime = Date.now();
  const isSafe = await isSafeUrlToFetch(url);
  console.log(`isSafeUrlToFetch("${url}"):`, isSafe);
  if (!isSafe) {
    return { isUp: false, errorMessage: "SSRF check failed" };
  }

  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": "HeyDrona Uptime Checker/1.0" },
    });
    console.log(`HEAD status for ${url}:`, res.status);
    return { isUp: res.status >= 200 && res.status < 400 };
  } catch (err) {
    console.log(`HEAD failed for ${url}, trying GET... Error:`, err.message);
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { "User-Agent": "HeyDrona Uptime Checker/1.0" },
      });
      console.log(`GET status for ${url}:`, res.status);
      return { isUp: res.status >= 200 && res.status < 400 };
    } catch (getErr) {
      console.log(`GET failed for ${url} as well. Error:`, getErr.message);
      return { isUp: false, errorMessage: getErr.message };
    }
  }
}

pingSite("https://devneet.in")
  .then(res => console.log("Final ping result:", res))
  .catch(console.error);
