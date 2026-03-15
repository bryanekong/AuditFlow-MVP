import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const meta = await prisma.documentMetadata.findMany({
        orderBy: { processedAt: 'desc' },
        take: 1
    })

    console.log("Latest Metadata Record:", JSON.stringify(meta, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
