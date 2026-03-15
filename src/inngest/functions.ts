import { inngest } from "./client"
import { prisma } from '@/lib/prisma'
import { createClient } from "@supabase/supabase-js"
import pdfParse from 'pdf-parse'
import * as mammoth from 'mammoth'
import * as xlsx from 'xlsx'


// Using Service Role Key here because background jobs need admin access to Storage
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
)

export const processDocument = inngest.createFunction(
    { id: "process-document" },
    { event: "app/document.uploaded" },
    async ({ event, step }) => {
        const { documentId, workspaceId, storagePath } = event.data

        const fileData = await step.run("download-file", async () => {
            const { data, error } = await supabase.storage.from("documents").download(storagePath)
            if (error) throw new Error(error.message)
            const arrayBuffer = await data.arrayBuffer()
            return Buffer.from(arrayBuffer).toString('base64')
        })

        const extractedText = await step.run("extract-text", async () => {
            const buffer = Buffer.from(fileData, 'base64')
            let text = ""
            const ext = storagePath.split('.').pop()?.toLowerCase()

            try {
                if (ext === 'pdf') {
                    const pdfData = await pdfParse(buffer)
                    text = pdfData.text
                } else if (ext === 'docx') {
                    const result = await mammoth.extractRawText({ buffer })
                    text = result.value
                } else if (ext === 'xlsx') {
                    const workbook = xlsx.read(buffer, { type: 'buffer' })
                    const sheetName = workbook.SheetNames[0]
                    text = xlsx.utils.sheet_to_csv(workbook.Sheets[sheetName])
                }
            } catch (e) {
                console.error("Extraction error:", e)
            }
            return text.substring(0, 30000)
        })

        const classification = await step.run("classify-document", async () => {
            const doc = await prisma.document.findUnique({ where: { id: documentId } })
            const name = doc?.filename.toLowerCase() || ""
            const textLower = extractedText.toLowerCase()

            let docType = "Other"
            let confidence = 0.5
            const ext = storagePath.split('.').pop()?.toLowerCase()

            if (name.includes("policy") || textLower.includes("purpose of this policy")) { docType = "Policy"; confidence = 0.9; }
            else if (name.includes("procedure") || name.includes("sop") || textLower.includes("standard operating procedure")) { docType = "Procedure"; confidence = 0.8; }
            else if (name.includes("register") || textLower.includes("register")) { docType = "Register"; confidence = 0.8; }
            else if (name.includes("log") || textLower.includes("audit log")) { docType = "Log"; confidence = 0.8; }
            else if (name.includes("contract") || name.includes("agreement")) { docType = "Contract"; confidence = 0.9; }
            else if (name.includes("evidence") || ext === "xlsx") { docType = "Evidence"; confidence = 0.6; }

            return { docType, confidence }
        })

        await step.run("update-db", async () => {
            await prisma.documentMetadata.upsert({
                where: { documentId },
                update: {
                    docType: classification.docType,
                    confidence: classification.confidence,
                    extractedTextPreview: extractedText.substring(0, 2000),
                    processedAt: new Date()
                },
                create: {
                    documentId,
                    docType: classification.docType,
                    confidence: classification.confidence,
                    extractedTextPreview: extractedText.substring(0, 2000) // limit preview length in db
                }
            })
            await prisma.document.update({
                where: { id: documentId },
                data: { status: 'PROCESSED' }
            })
        })

        return { processed: true, documentId, docType: classification.docType }
    }
)
