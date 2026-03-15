import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    // ── Clean up existing data (order matters — delete dependents first) ────────
    await prisma.qualityGateResult.deleteMany({})
    await prisma.scanFinding.deleteMany({})
    await prisma.scanRun.deleteMany({})
    await prisma.evidenceItem.deleteMany({})
    await prisma.controlLibraryChangeLog.deleteMany({})
    await prisma.evidenceType.deleteMany({})
    await prisma.controlLibraryVersion.deleteMany({})
    await prisma.frameworkRequirement.deleteMany({})
    await prisma.framework.deleteMany({})


    // ── ISO 27001 Framework ────────────────────────────────────────────────────
    const iso = await prisma.framework.create({
        data: {
            code: 'ISO27001',
            name: 'ISO/IEC 27001:2022',
            version: '2022',
            description: 'Information security management system',
            requirements: {
                create: [
                    {
                        code: 'A.5.1',
                        title: 'Policies for information security',
                        description: 'Information security policy and topic-specific policies shall be defined, approved by management, published, communicated to and acknowledged by relevant personnel and relevant interested parties, and reviewed at planned intervals and if significant changes occur.',
                        severity: 'CRITICAL',
                        requiredDocTypes: ['Policy'],
                        keywords: ['information security policy', 'purpose of this policy', 'isms policy'],
                        exampleEvidence: 'Information Security Policy document signed by management.',
                        guidance: 'Ensure you have an overarching ISMS policy.'
                    },
                    {
                        code: 'A.5.15',
                        title: 'Access control',
                        description: 'Rules to control physical and logical access to information and other associated assets shall be established and implemented based on business and information security requirements.',
                        severity: 'CRITICAL',
                        requiredDocTypes: ['Policy', 'Procedure'],
                        keywords: ['access control', 'logical access', 'physical access', 'authentication'],
                        exampleEvidence: 'Access Control Policy.',
                        guidance: 'Policy detailing how access rights are granted, reviewed, and revoked.'
                    },
                    {
                        code: 'A.5.9',
                        title: 'Inventory of information and other associated assets',
                        description: 'An inventory of information and other associated assets, including owners, shall be developed and maintained.',
                        severity: 'MEDIUM',
                        requiredDocTypes: ['Register'],
                        keywords: ['asset register', 'inventory', 'hardware', 'software'],
                        exampleEvidence: 'Asset Register spreadsheet or DB export.',
                        guidance: 'Maintain a list of all critical assets and who owns them.'
                    },
                    {
                        code: 'A.5.24',
                        title: 'Information security incident management planning and preparation',
                        description: 'The organization shall plan and prepare for managing information security incidents by defining, establishing and communicating information security incident management processes, roles and responsibilities.',
                        severity: 'CRITICAL',
                        requiredDocTypes: ['Procedure'],
                        keywords: ['incident response', 'incident management', 'breach response'],
                        exampleEvidence: 'Incident Response Plan.',
                        guidance: 'Documented procedure for handling security incidents.'
                    },
                    {
                        code: 'A.6.3',
                        title: 'Information security awareness, education and training',
                        description: 'Personnel of the organization and relevant interested parties shall receive appropriate information security awareness, education and training and regular updates.',
                        severity: 'MEDIUM',
                        requiredDocTypes: ['Evidence', 'Log', 'Register'],
                        keywords: ['training log', 'awareness training', 'phishing training', 'certificate'],
                        exampleEvidence: 'Training completion logs or certificates.',
                        guidance: 'Evidence that staff completed security training.'
                    },
                ]
            }
        },
        include: { requirements: true }
    })

    // ── GDPR Framework ─────────────────────────────────────────────────────────
    await prisma.framework.create({
        data: {
            code: 'GDPR',
            name: 'General Data Protection Regulation',
            version: 'v1',
            description: 'EU data protection and privacy regulation',
            requirements: {
                create: [
                    {
                        code: 'ART.13',
                        title: 'Privacy Policy / Notice',
                        description: 'Information to be provided where personal data are collected from the data subject.',
                        severity: 'CRITICAL',
                        requiredDocTypes: ['Policy'],
                        keywords: ['privacy policy', 'privacy notice', 'data protection policy'],
                        exampleEvidence: 'Publicly accessible Privacy Policy on the website.',
                        guidance: 'A document outlining how you handle personal data.'
                    },
                    {
                        code: 'ART.30',
                        title: 'Records of processing activities (RoPA)',
                        description: 'Each controller shall maintain a record of processing activities under its responsibility.',
                        severity: 'CRITICAL',
                        requiredDocTypes: ['Register'],
                        keywords: ['ropa', 'records of processing activities', 'data mapping'],
                        exampleEvidence: 'RoPA spreadsheet detailing what data is collected, why, and how it is stored.',
                        guidance: 'Create a spreadsheet logging all data processing activities.'
                    },
                    {
                        code: 'ART.35',
                        title: 'Data Protection Impact Assessment (DPIA)',
                        description: 'Where a type of processing is likely to result in a high risk to natural persons, the controller shall carry out a DPIA.',
                        severity: 'MEDIUM',
                        requiredDocTypes: ['Evidence'],
                        keywords: ['dpia', 'impact assessment', 'data protection impact'],
                        exampleEvidence: 'Completed DPIA template for a major new project.',
                        guidance: 'Any DPIA document completed for new risk processes.'
                    },
                    {
                        code: 'ART.15',
                        title: 'Right of access by the data subject (DSAR)',
                        description: 'The data subject shall have the right to obtain from the controller access to personal data concerning him or her.',
                        severity: 'CRITICAL',
                        requiredDocTypes: ['Procedure'],
                        keywords: ['dsar', 'data subject access request', 'right of access'],
                        exampleEvidence: 'DSAR Handling Procedure.',
                        guidance: 'Process explaining how you respond to user data requests.'
                    },
                    {
                        code: 'ART.33',
                        title: 'Notification of a personal data breach',
                        description: 'In the case of a personal data breach, the controller shall notify the personal data breach to the supervisory authority within 72 hours.',
                        severity: 'CRITICAL',
                        requiredDocTypes: ['Log', 'Procedure', 'Register'],
                        keywords: ['breach log', 'incident log', 'data breach'],
                        exampleEvidence: 'Security Incident Log.',
                        guidance: 'A log maintaining records of any data breaches or incidents.'
                    }
                ]
            }
        }
    })

    // ── CEG Control Library v1.0.0 for ISO 27001 ──────────────────────────────
    const reqByCode = new Map(iso.requirements.map(r => [r.code, r.id]))

    const libV1 = await prisma.controlLibraryVersion.create({
        data: {
            frameworkId: iso.id,
            version: '1.0.0',
            reviewedBy: 'AuditFlow Compliance Team',
            isActive: true,
            notes: 'Initial release of the ISO 27001:2022 Annex A evidence type library. Covers the 5 core controls for the SME tech wedge.',
        }
    })

    await prisma.evidenceType.createMany({
        data: [
            {
                libraryVersionId: libV1.id,
                requirementId: reqByCode.get('A.5.1')!,
                name: 'Information Security Policy',
                description: 'The organisation\'s overarching ISMS/information security policy, approved by management and communicated to staff.',
                requiredDocTypes: ['Policy'],
                maxAgeDays: 365,
                requiredKeywords: ['information security policy', 'isms'],
                systemSource: 'manual',
            },
            {
                libraryVersionId: libV1.id,
                requirementId: reqByCode.get('A.5.15')!,
                name: 'Access Control Policy',
                description: 'Policy or procedure defining how logical and physical access rights are granted, reviewed, and revoked.',
                requiredDocTypes: ['Policy', 'Procedure'],
                maxAgeDays: 365,
                requiredKeywords: ['access control'],
                systemSource: 'manual',
            },
            {
                libraryVersionId: libV1.id,
                requirementId: reqByCode.get('A.5.9')!,
                name: 'Asset Register',
                description: 'A maintained inventory of information and associated assets with assigned owners.',
                requiredDocTypes: ['Register'],
                maxAgeDays: 180,
                requiredKeywords: ['asset register', 'inventory'],
                systemSource: 'manual',
            },
            {
                libraryVersionId: libV1.id,
                requirementId: reqByCode.get('A.5.24')!,
                name: 'Incident Response Plan',
                description: 'Documented procedure defining roles, escalation paths, and steps for handling security incidents and breaches.',
                requiredDocTypes: ['Procedure'],
                maxAgeDays: 365,
                requiredKeywords: ['incident response', 'incident management'],
                systemSource: 'manual',
            },
            {
                libraryVersionId: libV1.id,
                requirementId: reqByCode.get('A.6.3')!,
                name: 'Security Awareness Training Log',
                description: 'Evidence that all personnel have completed security awareness training within the required period.',
                requiredDocTypes: ['Evidence', 'Log', 'Register'],
                maxAgeDays: 365,
                requiredKeywords: ['training log', 'awareness training'],
                systemSource: 'manual',
            },
        ]
    })

    const changeLogEntries = iso.requirements.map(req => ({
        libraryVersionId: libV1.id,
        controlCode: req.code,
        changeType: 'ADDED',
        summary: `Initial definition of evidence type for ${req.title}.`,
        customerImpact: 'No action required. This is the first version of the control library.',
    }))
    await prisma.controlLibraryChangeLog.createMany({ data: changeLogEntries })

    console.log('✓ Seeded ISO 27001 and GDPR frameworks.')
    console.log(`✓ Seeded CEG Control Library v1.0.0 with ${changeLogEntries.length} evidence type definitions.`)
}

main()
    .then(async () => { await prisma.$disconnect() })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
