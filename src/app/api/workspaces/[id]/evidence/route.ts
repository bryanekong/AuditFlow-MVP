import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const workspaceId = params.id
        const body = await req.json()
        const { evidenceTypeId, documentId, ownerName, systemSource, evidenceDate } = body

        if (!evidenceTypeId || !documentId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Verify the document belongs to this workspace
        const document = await prisma.document.findUnique({
            where: { id: documentId, workspaceId }
        })

        if (!document) {
            return NextResponse.json({ error: "Document not found in this workspace" }, { status: 404 })
        }

        const evidenceItem = await prisma.evidenceItem.create({
            data: {
                workspaceId,
                evidenceTypeId,
                documentId,
                ownerName: ownerName || null,
                systemSource: systemSource || null,
                evidenceDate: evidenceDate ? new Date(evidenceDate) : null,
            }
        })

        // Log the mapping action
        await prisma.auditLogEvent.create({
            data: {
                workspaceId,
                action: 'DOCUMENT_MAPPED',
                entityType: 'DOCUMENT',
                entityId: documentId,
                // If auth was present, we'd add actorUserId here
                actorUserId: 'system',
                metadata: {
                    evidenceItemId: evidenceItem.id,
                    evidenceTypeId,
                    ownerName,
                }
            }
        })

        return NextResponse.json(evidenceItem)
    } catch (error: any) {
        console.error("Evidence submission error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
