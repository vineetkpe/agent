async function main() {
  const cronSecret = "c7b744d03e91129b8c38fa22b83491ea";
  try {
    const res = await fetch("http://localhost:3000/api/cron/uptime-check", {
      headers: {
        "Authorization": `Bearer ${cronSecret}`
      }
    });
    const data = await res.json();
    console.log("Cron execution response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Failed to call local cron check endpoint. Is the dev server running on port 3000? Error:", err.message);
  }
}
main();
