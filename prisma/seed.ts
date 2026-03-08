import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    await prisma.frameworkRequirement.deleteMany({})
    await prisma.framework.deleteMany({})

    await prisma.framework.create({
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
                        description: 'Personnel of the organization and relevant interested parties shall receive appropriate information security awareness, education and training and regular updates of the organization\'s information security policy, topic-specific policies and procedures, as relevant for their job function.',
                        severity: 'MEDIUM',
                        requiredDocTypes: ['Evidence', 'Log', 'Register'],
                        keywords: ['training log', 'awareness training', 'phishing training', 'certificate'],
                        exampleEvidence: 'Training completion logs or certificates.',
                        guidance: 'Evidence that staff completed security training.'
                    }
                ]
            }
        }
    })

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
                        description: 'Each controller and, where applicable, the controller\'s representative, shall maintain a record of processing activities under its responsibility.',
                        severity: 'CRITICAL',
                        requiredDocTypes: ['Register'],
                        keywords: ['ropa', 'records of processing activities', 'data mapping'],
                        exampleEvidence: 'RoPA spreadsheet detailing what data is collected, why, and how it is stored.',
                        guidance: 'Create a spreadsheet logging all data processing activities.'
                    },
                    {
                        code: 'ART.35',
                        title: 'Data Protection Impact Assessment (DPIA)',
                        description: 'Where a type of processing in particular using new technologies is likely to result in a high risk to the rights and freedoms of natural persons, the controller shall, prior to the processing, carry out an assessment of the impact of the envisaged processing operations on the protection of personal data.',
                        severity: 'MEDIUM',
                        requiredDocTypes: ['Evidence'],
                        keywords: ['dpia', 'impact assessment', 'data protection impact'],
                        exampleEvidence: 'Completed DPIA template for a major new project.',
                        guidance: 'Any DPIA document completed for new risk processes.'
                    },
                    {
                        code: 'ART.15',
                        title: 'Right of access by the data subject (DSAR)',
                        description: 'The data subject shall have the right to obtain from the controller confirmation as to whether or not personal data concerning him or her are being processed, and access to the personal data.',
                        severity: 'CRITICAL',
                        requiredDocTypes: ['Procedure'],
                        keywords: ['dsar', 'data subject access request', 'right of access'],
                        exampleEvidence: 'DSAR Handling Procedure.',
                        guidance: 'Process explaining how you respond to user data requests.'
                    },
                    {
                        code: 'ART.33',
                        title: 'Notification of a personal data breach to the supervisory authority',
                        description: 'In the case of a personal data breach, the controller shall without undue delay and, where feasible, not later than 72 hours after having become aware of it, notify the personal data breach to the supervisory authority.',
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

    console.log('Successfully seeded database with ISO 27001 and GDPR frameworks.')
}

main()
    .then(async () => { await prisma.$disconnect() })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
