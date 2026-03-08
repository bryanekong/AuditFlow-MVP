import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("Fetching all documents...");
    const docs = await prisma.document.findMany({
        include: { metadata: true }
    });

    console.log(JSON.stringify(docs, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
