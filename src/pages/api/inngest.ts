import { serve } from "inngest/next"
import { inngest } from "@/inngest/client"
import { processDocument } from "@/inngest/functions"

const handler = serve({
    client: inngest,
    functions: [], // Temporarily empty to test sync crash
})

export default handler

export const config = {
    api: {
        bodyParser: false,
    },
}
