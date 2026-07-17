export interface UnsplashImage {
  url: string;
  photographerName: string;
  photographerLink: string;
}

export async function searchRelevantImages(topic: string, count: number = 2): Promise<UnsplashImage[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey || accessKey === "mock-key") {
    console.log("[Unsplash] Access key not configured. Skipping image search.");
    return [];
  }

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(topic)}&per_page=10`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
    });

    if (!res.ok) {
      console.error(`[Unsplash API Error] Status ${res.status}: ${await res.text()}`);
      return [];
    }

    const data = await res.json();
    const results = data.results || [];
    return results.slice(0, count).map((photo: any) => ({
      url: photo.urls.regular,
      photographerName: photo.user.name,
      photographerLink: photo.user.links.html,
    }));
  } catch (err) {
    console.error("[Unsplash] Failed to query search photos:", err);
    return [];
  }
}
