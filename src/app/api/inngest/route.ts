import { serve } from "inngest/next"
import { inngest } from "@/inngest/client"
import { processDocument } from "@/inngest/functions"

// Force Next.js to run this API dynamically so it never returns cached dummy responses to Inngest
export const dynamic = "force-dynamic"

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [processDocument],
})
