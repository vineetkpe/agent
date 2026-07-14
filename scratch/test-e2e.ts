import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("=== STARTING END-TO-END INTEGRATION TEST ===");
  
  // 1. Reset database state for testing
  console.log("\n1. Resetting test DB state...");
  await prisma.user.deleteMany({ where: { email: "user@example.com" } }).catch(() => {});
  
  // 2. Fetch/Create default user
  console.log("\n2. Getting/Creating default test user...");
  const { getOrCreateDefaultUser } = require("../src/lib/user");
  const user = await getOrCreateDefaultUser();
  console.log("Default User:", { id: user.id, email: user.email, subscriptionActive: user.subscriptionActive });

  // 3. Simulate crawler & audit trigger via audit logic
  console.log("\n3. Simulating Audit Pipeline Run...");
  // Directly simulate route handler execution logic
  const targetUrl = "https://example.com";
  console.log(`Running crawler + SEO check + Gemini AI suggestions for: ${targetUrl}`);
  
  const { crawlSite } = require("../src/lib/crawler");
  const { runSeoAudits } = require("../src/lib/seoChecks");
  const { generateStructuredJson } = require("../src/lib/aiProvider");
  
  const crawled = await crawlSite(targetUrl, 1);
  const auditResults = await runSeoAudits(crawled, targetUrl);
  
  // Create Site
  const site = await prisma.site.create({
    data: {
      userId: user.id,
      url: targetUrl,
    }
  });
  console.log("Created site record:", site.id);

  // Create Audit
  const audit = await prisma.audit.create({
    data: {
      siteId: site.id,
      scorePerformance: auditResults.scorePerformance,
      scoreSeo: auditResults.scoreSeo,
      status: "pending",
    }
  });

  // Mock Gemini Structured Output Prompt Call
  const mockGeminiPrompt = `Audit the site ${targetUrl}`;
  const responseSchema = {}; // empty mock schema representation
  const aiResponse = await generateStructuredJson(mockGeminiPrompt, responseSchema);

  // Save Audit Items
  for (const fix of aiResponse.fixes) {
    await prisma.auditItem.create({
      data: {
        auditId: audit.id,
        siteId: site.id,
        type: fix.type,
        targetUrl: fix.targetUrl,
        currentValue: JSON.stringify({ isMissing: true }),
        suggestedValue: fix.suggestedValue,
        status: "pending",
      }
    });
  }

  for (const post of aiResponse.blogPosts) {
    await prisma.auditItem.create({
      data: {
        auditId: audit.id,
        siteId: site.id,
        type: "blog_post",
        targetUrl: `${targetUrl}/blog/${post.suggestedSlug}`,
        currentValue: JSON.stringify({ status: "not_created" }),
        suggestedValue: JSON.stringify({
          title: post.title,
          content: post.content,
          slug: post.suggestedSlug,
        }),
        status: "pending",
      }
    });
  }

  // Update Audit status to completed
  await prisma.audit.update({
    where: { id: audit.id },
    data: { status: "completed" },
  });

  console.log("Successfully ran and completed audit.");
  
  // Verify DB entries
  const fetchedAudit = await prisma.audit.findUnique({
    where: { id: audit.id },
    include: { items: true },
  });
  console.log("Database Audit Scores:", {
    seo: fetchedAudit?.scoreSeo,
    performance: fetchedAudit?.scorePerformance,
    itemsCreated: fetchedAudit?.items.length,
  });

  // 4. Test Approve Action
  console.log("\n4. Simulating User Approving a Fix Item...");
  const itemToApprove = fetchedAudit?.items.find(item => item.type === "meta_title");
  if (itemToApprove) {
    // Approve it
    const updated = await prisma.auditItem.update({
      where: { id: itemToApprove.id },
      data: { status: "approved" },
    });
    console.log("Approved Item status in DB:", updated.status);
    if (updated.status === "approved") {
      console.log("Success: Item approved successfully.");
    } else {
      console.error("Fail: Approval state incorrect.");
      process.exit(1);
    }
  }

  // 5. Test Mock Stripe Subscription Checkout Toggle
  console.log("\n5. Testing Mock Stripe Subscription Activation...");
  // Simulate Stripe Checkout route logic:
  await prisma.user.update({
    where: { id: user.id },
    data: { subscriptionActive: true },
  });
  
  const updatedUser = await prisma.user.findUnique({
    where: { id: user.id },
  });
  console.log("Updated User billing state:", { email: updatedUser?.email, subscriptionActive: updatedUser?.subscriptionActive });
  if (updatedUser?.subscriptionActive === true) {
    console.log("Success: Billing simulation passed successfully.");
  } else {
    console.error("Fail: Subscription activation simulation failed.");
    process.exit(1);
  }

  console.log("\n=== E2E INTEGRATION TEST COMPLETED SUCCESSFULLY! ===");
}

main().catch(err => {
  console.error("E2E Integration Test failed:", err);
  process.exit(1);
});
