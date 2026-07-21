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

export async function sendAuditDigestEmail({
  to,
  siteUrl,
  highRiskItems,
  criticalItems,
}: {
  to: string;
  siteUrl: string;
  highRiskItems: any[];
  criticalItems: any[];
}) {
  const hasCritical = criticalItems.length > 0;
  const hasHighRisk = highRiskItems.length > 0;

  if (!hasCritical && !hasHighRisk) return;

  const subject = hasCritical
    ? `[CRITICAL ALERT] Action Required: Critical SEO Issues Discovered on ${siteUrl}`
    : `[HeyDrona] Action Required: New SEO Fixes Awaiting Approval for ${siteUrl}`;

  let contentHtml = "";

  if (hasCritical) {
    contentHtml += `
      <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <h3 style="color: #991b1b; margin-top: 0; margin-bottom: 8px; font-size: 14px; text-transform: uppercase; font-family: monospace;">⚠️ Critical Issues Detected</h3>
        <p style="margin: 0; font-size: 13px; color: #7f1d1d;">The following critical items require immediate attention to protect site rankings or functionality:</p>
        <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 13px; color: #7f1d1d; font-family: monospace;">
          ${criticalItems.map(item => `<li><strong>${item.type.replace(/_/g, " ").toUpperCase()}</strong> - ${item.targetUrl}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  if (hasHighRisk) {
    contentHtml += `
      <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <h3 style="color: #7c3aed; margin-top: 0; margin-bottom: 8px; font-size: 14px; text-transform: uppercase; font-family: monospace;">📋 High-Risk Fixes Pending Approval</h3>
        <p style="margin: 0; font-size: 13px; color: #3f3f46;">The following optimizations have high risk impact and are waiting for your manual review and approval:</p>
        <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 13px; color: #3f3f46; font-family: monospace;">
          ${highRiskItems.map(item => `<li><strong>${item.type.replace(/_/g, " ").toUpperCase()}</strong> - ${item.targetUrl}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  const emailHtml = `
    <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 12px;">
      <h2 style="color: #7c3aed; margin-bottom: 5px;">HeyDrona Growth Alert</h2>
      <p style="color: #71717a; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: bold; margin-top: 0;">SEO Audit Notification</p>
      <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
      <p>Hello,</p>
      <p>We recently completed an automated SEO audit scan for <strong>${siteUrl}</strong> and identified items that require your action.</p>
      
      ${contentHtml}

      <div style="text-align: center; margin: 25px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" style="display: inline-block; background-color: #7c3aed; color: white; padding: 10px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px;">Review Recommendations in Dashboard</a>
      </div>
      <p>Best regards,</p>
      <p style="font-size: 12px; color: #a1a1aa; border-top: 1px solid #e4e4e7; padding-top: 10px; margin-top: 20px;">The HeyDrona Team</p>
    </div>
  `;

  await sendEmail({
    to,
    subject,
    html: emailHtml,
  });
}
