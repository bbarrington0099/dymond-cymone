import { prisma } from "@lib/prisma";
import * as seed from "./seeds/index";

async function main() {
    console.log("🌱 Starting database seed...\n");
    try {
        await seed.seedArtistProfiles();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
    console.log("\n✨ Database seed complete!");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });