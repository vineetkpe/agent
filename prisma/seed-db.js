const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("[Seed] Starting database seeding...");

  // 1. Backfill User roles
  console.log("[Seed] Backfilling user roles...");
  const admins = await prisma.user.updateMany({
    where: { isAdmin: true },
    data: { role: "admin" }
  });
  console.log(`[Seed] Backfilled ${admins.count} admin user(s).`);

  const regularUsers = await prisma.user.updateMany({
    where: { isAdmin: false },
    data: { role: "user" }
  });
  console.log(`[Seed] Backfilled ${regularUsers.count} regular user(s).`);

  // 2. Seed Features Catalog
  console.log("[Seed] Seeding Features Catalog...");
  const features = [
    { key: "maxSites", label: "Maximum Monitored Sites", type: "number", description: "Number of websites the user is allowed to connect" },
    { key: "cooldownMinutes", label: "Audit Cooldown Period", type: "number", description: "Cooldown time between consecutive audits (in minutes)" },
    { key: "wpAutoApply", label: "WordPress Auto-Apply", type: "boolean", description: "Allow AI-generated suggestions to be auto-published to WordPress" },
    { key: "chatbot", label: "AI Chat Assistant", type: "boolean", description: "Allow chatting with the AI growth agent regarding diagnostics" },
    { key: "autoScheduledCrawl", label: "Daily Scheduled Crawl", type: "boolean", description: "Enable automatic daily scheduled SEO audits" },
    { key: "pdfExport", label: "Downloadable PDF Reports", type: "boolean", description: "Allow exporting audits as PDF documents" },
    { key: "whiteLabelReport", label: "White-label PDF Reports", type: "boolean", description: "Allow custom logos and white-labeled PDF audits" },
    { key: "uptimeMonitoring", label: "Uptime & Latency Monitoring", type: "boolean", description: "Enable active uptime and latency inspections every 5 minutes" }
  ];

  for (const feat of features) {
    await prisma.feature.upsert({
      where: { key: feat.key },
      update: {
        label: feat.label,
        type: feat.type,
        description: feat.description
      },
      create: feat
    });
  }
  console.log(`[Seed] Seeded ${features.length} features.`);

  // 3. Seed Plan Definitions
  console.log("[Seed] Seeding Plans...");
  const plans = [
    {
      slug: "free",
      name: "Free Plan",
      monthlyPriceCents: 0,
      annualPriceCents: 0,
      isActive: true,
      isVisible: true,
      sortOrder: 0,
      features: {
        maxSites: 1,
        cooldownMinutes: 1440,
        wpAutoApply: false,
        chatbot: false,
        autoScheduledCrawl: false,
        pdfExport: false,
        whiteLabelReport: false,
        uptimeMonitoring: true // Universal per UPTIME-FREE-1
      }
    },
    {
      slug: "starter",
      name: "Starter Plan",
      monthlyPriceCents: 1900,
      annualPriceCents: 19000,
      isActive: true,
      isVisible: true,
      sortOrder: 1,
      features: {
        maxSites: 1,
        cooldownMinutes: 1440,
        wpAutoApply: true,
        chatbot: true,
        autoScheduledCrawl: false,
        pdfExport: false,
        whiteLabelReport: false,
        uptimeMonitoring: true
      }
    },
    {
      slug: "growth",
      name: "Growth Plan",
      monthlyPriceCents: 4900,
      annualPriceCents: 49000,
      isActive: true,
      isVisible: true,
      sortOrder: 2,
      features: {
        maxSites: 3,
        cooldownMinutes: 360,
        wpAutoApply: true,
        chatbot: true,
        autoScheduledCrawl: true,
        pdfExport: true,
        whiteLabelReport: false,
        uptimeMonitoring: true
      }
    },
    {
      slug: "agency",
      name: "Agency Plan",
      monthlyPriceCents: 9900,
      annualPriceCents: 99000,
      isActive: true,
      isVisible: true,
      sortOrder: 3,
      features: {
        maxSites: 10,
        cooldownMinutes: 60,
        wpAutoApply: true,
        chatbot: true,
        autoScheduledCrawl: true,
        pdfExport: true,
        whiteLabelReport: true,
        uptimeMonitoring: true
      }
    }
  ];

  for (const p of plans) {
    const createdPlan = await prisma.plan.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        monthlyPriceCents: p.monthlyPriceCents,
        annualPriceCents: p.annualPriceCents,
        isActive: p.isActive,
        isVisible: p.isVisible,
        sortOrder: p.sortOrder
      },
      create: {
        name: p.name,
        slug: p.slug,
        monthlyPriceCents: p.monthlyPriceCents,
        annualPriceCents: p.annualPriceCents,
        isActive: p.isActive,
        isVisible: p.isVisible,
        sortOrder: p.sortOrder
      }
    });

    // Upsert features for this plan
    for (const [key, val] of Object.entries(p.features)) {
      await prisma.planFeature.upsert({
        where: {
          planId_featureKey: {
            planId: createdPlan.id,
            featureKey: key
          }
        },
        update: {
          value: JSON.stringify(val)
        },
        create: {
          planId: createdPlan.id,
          featureKey: key,
          value: JSON.stringify(val)
        }
      });
    }
  }

  console.log(`[Seed] Seeded ${plans.length} plans successfully.`);
  console.log("[Seed] Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("[Seed] Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
