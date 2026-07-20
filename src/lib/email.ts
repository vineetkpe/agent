export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "mock-resend-key") {
    console.log(`[Mock Resend Email] Dispatch to: ${to}`);
    console.log(`[Mock Resend Email] Subject: "${subject}"`);
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "HeyDrona Growth <onboarding@resend.dev>",
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[Email Service] Resend API error: ${text}`);
    } else {
      console.log(`[Email Service] Successfully sent email to: ${to}`);
    }
  } catch (err) {
    console.error("[Email Service] Network error calling Resend API:", err);
  }
}
