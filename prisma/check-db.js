const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const checks = await prisma.uptimeCheck.findMany({
    include: {
      site: true
    }
  });
  console.log("Checks in DB:", JSON.stringify(checks, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
