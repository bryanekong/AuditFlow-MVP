const { chromium } = require('playwright');

async function main() {
    console.log("Launching browser to generate PDFs...");
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // 1. ISO 27001 Passing Document
    const ismsPolicyHTML = `
        <html>
            <body style="font-family: sans-serif; padding: 40px;">
                <h1>Information Security Policy & Access Control Procedure</h1>
                
                <h2>1. Purpose</h2>
                <p>The <strong>purpose of this policy</strong> is to establish the overarching <strong>Information Security Policy</strong> (<strong>ISMS Policy</strong>) for the organization.</p>
                
                <h2>2. Access Control</h2>
                <p>All <strong>logical access</strong> and <strong>physical access</strong> requires strict <strong>authentication</strong> and authorization controls.</p>
                
                <h2>3. Incident Management</h2>
                <p>If a security event occurs, the designated <strong>incident response</strong> team will follow the approved <strong>incident management</strong> and <strong>breach response</strong> procedures.</p>
            </body>
        </html>
    `;

    await page.setContent(ismsPolicyHTML);
    await page.pdf({ path: './ISO27001_Sample_Evidence.pdf' });
    console.log("Created ISO27001_Sample_Evidence.pdf!");

    // 2. GDPR Passing Document
    const privacyPolicyHTML = `
        <html>
            <body style="font-family: sans-serif; padding: 40px;">
                <h1>Data Protection & Privacy Policy</h1>
                
                <h2>1. Privacy Notice</h2>
                <p>This <strong>Privacy Policy</strong> and <strong>Privacy Notice</strong> defines how personal data is collected and processed.</p>
                
                <h2>2. Right of Access</h2>
                <p>Any data subject can exercise their <strong>right of access</strong> by submitting a formal <strong>DSAR</strong> (<strong>Data Subject Access Request</strong>).</p>

                <h2>3. Breach Notification</h2>
                <p>Any <strong>data breach</strong> will be immediately recorded in the formal <strong>incident log</strong> and <strong>breach log</strong> and reported to the supervisory authority within 72 hours.</p>
            </body>
        </html>
    `;

    await page.setContent(privacyPolicyHTML);
    await page.pdf({ path: './GDPR_Sample_Evidence.pdf' });
    console.log("Created GDPR_Sample_Evidence.pdf!");

    await browser.close();
    console.log("Done!");
}

main()
    .catch(console.error);
