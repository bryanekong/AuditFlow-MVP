import { serve } from "inngest/next"
import { inngest } from "@/inngest/client"
import { processDocument } from "@/inngest/functions"

const handler = serve({
    client: inngest,
    functions: [processDocument],
})

export default handler

export const config = {
    api: {
        bodyParser: false,
    },
}
