import { PrismaClient } from "@prisma/client";

function assertSafeTestDatabaseUrl(url: string) {
  const lowered = url.toLowerCase();
  const isLikelyTestDb =
    lowered.includes("_test") || lowered.includes("test_") || lowered.includes("/test");
  if (!isLikelyTestDb) {
    throw new Error(
      "Unsafe TEST_DATABASE_URL: must point to a dedicated test database (name should include 'test')."
    );
  }
}

export function getTestDatabaseUrl() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error("TEST_DATABASE_URL is required for DB integration tests.");
  }
  assertSafeTestDatabaseUrl(url);
  return url;
}

export function createTestPrismaClient() {
  return new PrismaClient({
    datasources: { db: { url: getTestDatabaseUrl() } }
  });
}

export async function resetTestDatabase(prisma: PrismaClient) {
  await prisma.report.deleteMany({});
  await prisma.block.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.weeklyParticipation.deleteMany({});
  await prisma.week.deleteMany({});
  await prisma.preference.deleteMany({});
  await prisma.questionnaireResponse.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});
}
