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

    // ── ISO 27001:2022 Framework (the only supported framework) ────────────────
    const iso = await prisma.framework.create({
        data: {
            code: 'ISO27001',
            name: 'ISO/IEC 27001:2022',
            version: '2022',
            description: 'Information security management system — Annex A controls',
            requirements: {
                create: [
                    // ── A.5 Organisational Controls ─────────────────────────────
                    {
                        code: 'A.5.1',
                        title: 'Policies for information security',
                        description: 'Information security policy and topic-specific policies shall be defined, approved by management, published, communicated to and acknowledged by relevant personnel.',
                        severity: 'CRITICAL',
                        requiredDocTypes: ['Policy'],
                        keywords: ['information security policy', 'isms policy', 'purpose of this policy'],
                        exampleEvidence: 'Information Security Policy document signed by management.',
                        guidance: 'Ensure you have an overarching ISMS policy approved by top management.'
                    },
                    {
                        code: 'A.5.2',
                        title: 'Information security roles and responsibilities',
                        description: 'Information security roles and responsibilities shall be defined and allocated.',
                        severity: 'CRITICAL',
                        requiredDocTypes: ['Policy', 'Procedure'],
                        keywords: ['roles and responsibilities', 'information security', 'accountable', 'responsible'],
                        exampleEvidence: 'RACI matrix or org chart with security responsibilities.',
                        guidance: 'Document who is responsible for each security function.'
                    },
                    {
                        code: 'A.5.9',
                        title: 'Inventory of information and other associated assets',
                        description: 'An inventory of information and other associated assets, including owners, shall be developed and maintained.',
                        severity: 'MEDIUM',
                        requiredDocTypes: ['Register'],
                        keywords: ['asset register', 'inventory', 'hardware', 'software', 'asset owner'],
                        exampleEvidence: 'Asset Register spreadsheet or CMDB export.',
                        guidance: 'Maintain a list of all critical assets and who owns them.'
                    },
                    {
                        code: 'A.5.10',
                        title: 'Acceptable use of information and other associated assets',
                        description: 'Rules for the acceptable use of information and other associated assets shall be identified, documented and implemented.',
                        severity: 'MEDIUM',
                        requiredDocTypes: ['Policy'],
                        keywords: ['acceptable use', 'use of assets', 'permitted use'],
                        exampleEvidence: 'Acceptable Use Policy signed by staff.',
                        guidance: 'Policy defining how company assets (laptops, email, internet) may be used.'
                    },
                    {
                        code: 'A.5.15',
                        title: 'Access control',
                        description: 'Rules to control physical and logical access to information and other associated assets shall be established and implemented.',
                        severity: 'CRITICAL',
                        requiredDocTypes: ['Policy', 'Procedure'],
                        keywords: ['access control', 'logical access', 'authentication', 'authorisation'],
                        exampleEvidence: 'Access Control Policy.',
                        guidance: 'Policy detailing how access rights are granted, reviewed, and revoked.'
                    },
                    {
                        code: 'A.5.17',
                        title: 'Authentication information',
                        description: 'Allocation and management of authentication information shall be controlled by a management process.',
                        severity: 'CRITICAL',
                        requiredDocTypes: ['Policy', 'Procedure'],
                        keywords: ['password policy', 'authentication', 'mfa', 'multi-factor', 'credential'],
                        exampleEvidence: 'Password/authentication policy with MFA requirements.',
                        guidance: 'Define password complexity, rotation, and MFA requirements.'
                    },
                    {
                        code: 'A.5.23',
                        title: 'Information security for use of cloud services',
                        description: 'Processes for acquisition, use, management and exit from cloud services shall be established.',
                        severity: 'MEDIUM',
                        requiredDocTypes: ['Policy', 'Register'],
                        keywords: ['cloud', 'saas', 'cloud security', 'cloud services'],
                        exampleEvidence: 'Cloud usage policy and register of cloud services.',
                        guidance: 'Document which cloud services are used and how they are secured.'
                    },
                    {
                        code: 'A.5.24',
                        title: 'Information security incident management planning',
                        description: 'The organization shall plan and prepare for managing information security incidents.',
                        severity: 'CRITICAL',
                        requiredDocTypes: ['Procedure'],
                        keywords: ['incident response', 'incident management', 'breach response', 'escalation'],
                        exampleEvidence: 'Incident Response Plan.',
                        guidance: 'Documented procedure for handling security incidents.'
                    },
                    {
                        code: 'A.5.29',
                        title: 'Information security during disruption',
                        description: 'The organization shall plan how to maintain information security at an appropriate level during disruption.',
                        severity: 'MEDIUM',
                        requiredDocTypes: ['Procedure', 'Evidence'],
                        keywords: ['business continuity', 'disaster recovery', 'disruption', 'bcp'],
                        exampleEvidence: 'Business Continuity Plan or Disaster Recovery Plan.',
                        guidance: 'Document how security is maintained during business disruptions.'
                    },
                    {
                        code: 'A.5.31',
                        title: 'Legal, statutory, regulatory and contractual requirements',
                        description: 'Legal, statutory, regulatory and contractual requirements relevant to information security shall be identified, documented and kept up to date.',
                        severity: 'MEDIUM',
                        requiredDocTypes: ['Register'],
                        keywords: ['legal register', 'regulatory', 'statutory', 'contractual'],
                        exampleEvidence: 'Legal/regulatory obligations register.',
                        guidance: 'Maintain a register of all applicable legal and regulatory requirements.'
                    },
                    {
                        code: 'A.5.34',
                        title: 'Privacy and protection of personal identifiable information',
                        description: 'The organization shall identify and meet the requirements regarding the preservation of privacy and protection of PII.',
                        severity: 'CRITICAL',
                        requiredDocTypes: ['Policy'],
                        keywords: ['privacy', 'personal data', 'pii', 'data protection'],
                        exampleEvidence: 'Privacy Policy or Data Protection Policy.',
                        guidance: 'Document how personal data is protected and processed.'
                    },

                    // ── A.6 People Controls ────────────────────────────────────
                    {
                        code: 'A.6.1',
                        title: 'Screening',
                        description: 'Background verification checks on all candidates to become personnel shall be carried out prior to joining the organization.',
                        severity: 'MEDIUM',
                        requiredDocTypes: ['Procedure', 'Evidence'],
                        keywords: ['screening', 'background check', 'vetting', 'pre-employment'],
                        exampleEvidence: 'Screening procedure and evidence of completed checks.',
                        guidance: 'Confirm background checks are performed before onboarding.'
                    },
                    {
                        code: 'A.6.3',
                        title: 'Information security awareness, education and training',
                        description: 'Personnel shall receive appropriate information security awareness, education and training.',
                        severity: 'MEDIUM',
                        requiredDocTypes: ['Evidence', 'Log', 'Register'],
                        keywords: ['training log', 'awareness training', 'phishing training', 'security training'],
                        exampleEvidence: 'Training completion logs or certificates.',
                        guidance: 'Evidence that staff completed security training.'
                    },

                    // ── A.7 Physical Controls ──────────────────────────────────
                    {
                        code: 'A.7.1',
                        title: 'Physical security perimeters',
                        description: 'Security perimeters shall be defined and used to protect areas that contain information and other associated assets.',
                        severity: 'LOW',
                        requiredDocTypes: ['Policy', 'Evidence'],
                        keywords: ['physical security', 'perimeter', 'office security', 'access badges'],
                        exampleEvidence: 'Physical security policy, office access logs.',
                        guidance: 'Define and document physical security controls for your premises.'
                    },

                    // ── A.8 Technological Controls ─────────────────────────────
                    {
                        code: 'A.8.1',
                        title: 'User endpoint devices',
                        description: 'Information stored on, processed by or accessible via user endpoint devices shall be protected.',
                        severity: 'CRITICAL',
                        requiredDocTypes: ['Policy', 'Evidence'],
                        keywords: ['endpoint', 'device management', 'mdm', 'laptop', 'encryption'],
                        exampleEvidence: 'Endpoint security policy, MDM configuration evidence.',
                        guidance: 'Document how laptops and mobile devices are secured (encryption, MDM).'
                    },
                    {
                        code: 'A.8.5',
                        title: 'Secure authentication',
                        description: 'Secure authentication technologies and procedures shall be established and implemented.',
                        severity: 'CRITICAL',
                        requiredDocTypes: ['Evidence', 'Procedure'],
                        keywords: ['sso', 'single sign-on', 'mfa', 'authentication', 'identity provider'],
                        exampleEvidence: 'SSO/MFA configuration screenshots from identity provider.',
                        guidance: 'Evidence that MFA and SSO are enforced across all systems.'
                    },
                    {
                        code: 'A.8.8',
                        title: 'Management of technical vulnerabilities',
                        description: 'Information about technical vulnerabilities of information systems in use shall be obtained and appropriate measures taken.',
                        severity: 'CRITICAL',
                        requiredDocTypes: ['Procedure', 'Evidence', 'Log'],
                        keywords: ['vulnerability', 'patching', 'cve', 'security update', 'scan'],
                        exampleEvidence: 'Vulnerability scan reports, patching procedure.',
                        guidance: 'Regular vulnerability scanning and timely patching process.'
                    },
                    {
                        code: 'A.8.9',
                        title: 'Configuration management',
                        description: 'Configurations, including security configurations, of hardware, software, services and networks shall be established, documented and managed.',
                        severity: 'MEDIUM',
                        requiredDocTypes: ['Procedure', 'Evidence'],
                        keywords: ['configuration management', 'hardening', 'baseline', 'security configuration'],
                        exampleEvidence: 'Hardening standards, configuration baseline docs.',
                        guidance: 'Document security configuration baselines for key systems.'
                    },
                    {
                        code: 'A.8.13',
                        title: 'Information backup',
                        description: 'Backup copies of information, software and systems shall be maintained and regularly tested.',
                        severity: 'CRITICAL',
                        requiredDocTypes: ['Procedure', 'Log'],
                        keywords: ['backup', 'restore', 'backup policy', 'recovery test'],
                        exampleEvidence: 'Backup procedure and restore test logs.',
                        guidance: 'Document backup schedule and evidence of restore testing.'
                    },
                    {
                        code: 'A.8.15',
                        title: 'Logging',
                        description: 'Logs that record activities, exceptions, faults and other relevant events shall be produced, stored, protected and analysed.',
                        severity: 'CRITICAL',
                        requiredDocTypes: ['Procedure', 'Evidence'],
                        keywords: ['logging', 'audit log', 'monitoring', 'log retention', 'siem'],
                        exampleEvidence: 'Logging policy, SIEM dashboard screenshots.',
                        guidance: 'Document logging standards, retention periods, and monitoring process.'
                    },
                    {
                        code: 'A.8.24',
                        title: 'Use of cryptography',
                        description: 'Rules for the effective use of cryptography, including cryptographic key management, shall be defined and implemented.',
                        severity: 'MEDIUM',
                        requiredDocTypes: ['Policy', 'Procedure'],
                        keywords: ['cryptography', 'encryption', 'tls', 'aes', 'key management'],
                        exampleEvidence: 'Cryptography policy, TLS configuration evidence.',
                        guidance: 'Document encryption standards (data at rest, in transit) and key management.'
                    },
                    {
                        code: 'A.8.25',
                        title: 'Secure development life cycle',
                        description: 'Rules for the secure development of software and systems shall be established and applied.',
                        severity: 'MEDIUM',
                        requiredDocTypes: ['Policy', 'Procedure'],
                        keywords: ['secure development', 'sdlc', 'code review', 'security testing'],
                        exampleEvidence: 'SDLC policy, code review process docs.',
                        guidance: 'Document secure coding standards, code review, and security testing practices.'
                    },
                ]
            }
        },
        include: { requirements: true }
    })

    // ── CEG Control Library v1.0.0 for ISO 27001 ──────────────────────────────
    const reqByCode = new Map(iso.requirements.map(r => [r.code, r.id]))

    const libV1 = await prisma.controlLibraryVersion.create({
        data: {
            frameworkId: iso.id,
            version: '1.0.0',
            reviewedBy: 'AuditFlow Compliance Team',
            isActive: true,
            notes: 'Initial release of the ISO 27001:2022 Annex A evidence type library. Covers 22 controls across organisational, people, physical, and technological domains — the core wedge for UK SaaS SMEs.',
        }
    })

    // Define EvidenceType records with quality gate rules, test procedures, and accountable roles
    const evidenceTypes = [
        {
            requirementId: reqByCode.get('A.5.1')!,
            name: 'Information Security Policy',
            description: 'The overarching ISMS/information security policy, approved by management.',
            requiredDocTypes: ['Policy'],
            maxAgeDays: 365,
            requiredKeywords: ['information security policy', 'isms'],
            systemSource: 'manual',
            accountableRole: 'CISO / Managing Director',
            testProcedure: '1. Confirm policy document exists and is dated within 12 months\n2. Verify management approval signature or board minute reference\n3. Confirm communication to all staff (email evidence or intranet access log)\n4. Check policy covers: scope, objectives, roles, compliance obligations',
        },
        {
            requirementId: reqByCode.get('A.5.2')!,
            name: 'Security Roles & Responsibilities Matrix',
            description: 'RACI matrix or organisational chart defining security roles.',
            requiredDocTypes: ['Policy', 'Procedure'],
            maxAgeDays: 365,
            requiredKeywords: ['roles and responsibilities', 'information security'],
            systemSource: 'manual',
            accountableRole: 'CISO / HR Director',
            testProcedure: '1. Confirm documented roles matrix exists\n2. Verify each key security function has a named individual\n3. Check matrix references current org structure\n4. Confirm staff have been notified of their responsibilities',
        },
        {
            requirementId: reqByCode.get('A.5.9')!,
            name: 'Asset Register',
            description: 'Maintained inventory of information and associated assets with assigned owners.',
            requiredDocTypes: ['Register'],
            maxAgeDays: 180,
            requiredKeywords: ['asset register', 'inventory'],
            systemSource: 'manual',
            accountableRole: 'IT Manager',
            testProcedure: '1. Confirm asset register exists and was reviewed within 6 months\n2. Sample 5 assets and verify owner is current employee\n3. Check register includes: asset type, classification, location, owner\n4. Verify register covers hardware, software, data, and cloud services',
        },
        {
            requirementId: reqByCode.get('A.5.10')!,
            name: 'Acceptable Use Policy',
            description: 'Policy defining acceptable use of company information and assets.',
            requiredDocTypes: ['Policy'],
            maxAgeDays: 365,
            requiredKeywords: ['acceptable use'],
            systemSource: 'manual',
            accountableRole: 'CISO / IT Manager',
            testProcedure: '1. Confirm AUP document exists and is dated within 12 months\n2. Verify it covers: email, internet, removable media, personal devices\n3. Confirm staff acknowledgement evidence exists (signatures or system log)',
        },
        {
            requirementId: reqByCode.get('A.5.15')!,
            name: 'Access Control Policy',
            description: 'Policy defining how logical and physical access rights are granted, reviewed, and revoked.',
            requiredDocTypes: ['Policy', 'Procedure'],
            maxAgeDays: 365,
            requiredKeywords: ['access control'],
            systemSource: 'manual',
            accountableRole: 'IT Manager',
            testProcedure: '1. Confirm access control policy exists\n2. Verify it defines: provisioning, de-provisioning, periodic review cadence\n3. Check evidence of most recent access review (within 90 days)\n4. Verify policy covers both logical (systems) and physical (premises) access',
        },
        {
            requirementId: reqByCode.get('A.5.17')!,
            name: 'Authentication Policy',
            description: 'Password and MFA policy with complexity and rotation requirements.',
            requiredDocTypes: ['Policy', 'Procedure'],
            maxAgeDays: 365,
            requiredKeywords: ['password policy', 'authentication'],
            systemSource: 'identity_provider',
            accountableRole: 'IT Manager',
            testProcedure: '1. Confirm authentication policy exists\n2. Verify it specifies: minimum password length, complexity, MFA requirement\n3. Cross-check with identity provider configuration (screenshot of settings)\n4. Confirm MFA is enforced for all users with system access',
        },
        {
            requirementId: reqByCode.get('A.5.23')!,
            name: 'Cloud Services Register',
            description: 'Register of cloud services and associated security measures.',
            requiredDocTypes: ['Policy', 'Register'],
            maxAgeDays: 180,
            requiredKeywords: ['cloud', 'cloud services'],
            systemSource: 'manual',
            accountableRole: 'IT Manager / CTO',
            testProcedure: '1. Confirm cloud services register exists\n2. Verify it lists: service name, provider, data classification, security measures\n3. Check register has been updated within 6 months\n4. Confirm exit/data retrieval procedures are documented for critical services',
        },
        {
            requirementId: reqByCode.get('A.5.24')!,
            name: 'Incident Response Plan',
            description: 'Documented procedure for handling security incidents and breaches.',
            requiredDocTypes: ['Procedure'],
            maxAgeDays: 365,
            requiredKeywords: ['incident response', 'incident management'],
            systemSource: 'manual',
            accountableRole: 'CISO',
            testProcedure: '1. Confirm incident response plan exists and is dated within 12 months\n2. Verify it defines: roles, escalation paths, severity classification, notification timelines\n3. Check evidence of most recent incident response test/drill\n4. Verify plan covers: detection, containment, eradication, recovery, lessons learned',
        },
        {
            requirementId: reqByCode.get('A.5.29')!,
            name: 'Business Continuity / DR Plan',
            description: 'Business continuity and disaster recovery plan.',
            requiredDocTypes: ['Procedure', 'Evidence'],
            maxAgeDays: 365,
            requiredKeywords: ['business continuity', 'disaster recovery'],
            systemSource: 'manual',
            accountableRole: 'CTO / CISO',
            testProcedure: '1. Confirm BCP/DR plan exists\n2. Verify it defines: RPO, RTO, critical system priorities, communication plan\n3. Check evidence of most recent DR test\n4. Verify plan covers information security requirements during disruption',
        },
        {
            requirementId: reqByCode.get('A.5.31')!,
            name: 'Legal & Regulatory Obligations Register',
            description: 'Register of applicable legal, regulatory, and contractual requirements.',
            requiredDocTypes: ['Register'],
            maxAgeDays: 365,
            requiredKeywords: ['legal register', 'regulatory'],
            systemSource: 'manual',
            accountableRole: 'Legal / Compliance Officer',
            testProcedure: '1. Confirm obligations register exists\n2. Verify it lists: regulation name, applicable clauses, compliance owner, review date\n3. Check register has been reviewed within 12 months\n4. Verify it covers: data protection, industry regulations, contractual obligations',
        },
        {
            requirementId: reqByCode.get('A.5.34')!,
            name: 'Privacy / Data Protection Policy',
            description: 'Policy for preserving privacy and protecting PII.',
            requiredDocTypes: ['Policy'],
            maxAgeDays: 365,
            requiredKeywords: ['privacy', 'personal data'],
            systemSource: 'manual',
            accountableRole: 'DPO / CISO',
            testProcedure: '1. Confirm privacy/data protection policy exists\n2. Verify it defines: lawful basis, data subject rights, retention periods\n3. Confirm policy is publicly accessible (website) or communicated to data subjects\n4. Check alignment with applicable data protection regulation (e.g. UK GDPR)',
        },
        {
            requirementId: reqByCode.get('A.6.1')!,
            name: 'Employee Screening Procedure',
            description: 'Pre-employment screening and background verification procedure.',
            requiredDocTypes: ['Procedure', 'Evidence'],
            maxAgeDays: 365,
            requiredKeywords: ['screening', 'background check'],
            systemSource: 'manual',
            accountableRole: 'HR Director',
            testProcedure: '1. Confirm screening procedure exists\n2. Sample 3 recent hires and verify screening was completed before start date\n3. Verify procedure defines: checks required by role type, documentation retained',
        },
        {
            requirementId: reqByCode.get('A.6.3')!,
            name: 'Security Awareness Training Log',
            description: 'Evidence of security awareness training completion.',
            requiredDocTypes: ['Evidence', 'Log', 'Register'],
            maxAgeDays: 365,
            requiredKeywords: ['training log', 'awareness training'],
            systemSource: 'manual',
            accountableRole: 'CISO / HR Director',
            testProcedure: '1. Confirm training records exist\n2. Verify 100% of current staff completed training within the last 12 months\n3. Check training content covers: phishing, social engineering, data handling, incident reporting\n4. Verify new joiners complete training within first 30 days',
        },
        {
            requirementId: reqByCode.get('A.7.1')!,
            name: 'Physical Security Policy',
            description: 'Policy and evidence for physical security perimeters and access controls.',
            requiredDocTypes: ['Policy', 'Evidence'],
            maxAgeDays: 365,
            requiredKeywords: ['physical security'],
            systemSource: 'manual',
            accountableRole: 'Facilities / IT Manager',
            testProcedure: '1. Confirm physical security policy exists\n2. Verify it defines: entry controls, visitor procedures, secure areas\n3. For remote-first: confirm policy addresses home office security requirements',
        },
        {
            requirementId: reqByCode.get('A.8.1')!,
            name: 'Endpoint Security Policy & MDM Evidence',
            description: 'Endpoint device security policy and MDM configuration evidence.',
            requiredDocTypes: ['Policy', 'Evidence'],
            maxAgeDays: 365,
            requiredKeywords: ['endpoint', 'device management'],
            systemSource: 'mdm_platform',
            accountableRole: 'IT Manager',
            testProcedure: '1. Confirm endpoint security policy exists\n2. Verify MDM is deployed (screenshot of device list from MDM console)\n3. Confirm disk encryption is enforced on all endpoints\n4. Verify auto-update/patching policy is active',
        },
        {
            requirementId: reqByCode.get('A.8.5')!,
            name: 'SSO/MFA Configuration Evidence',
            description: 'Evidence that SSO and MFA are enforced from the identity provider.',
            requiredDocTypes: ['Evidence', 'Procedure'],
            maxAgeDays: 180,
            requiredKeywords: ['mfa', 'authentication'],
            systemSource: 'identity_provider',
            accountableRole: 'IT Manager',
            testProcedure: '1. Obtain screenshot of IdP MFA enforcement settings\n2. Verify MFA is required for all users (not optional)\n3. Confirm SSO is configured for all critical business applications\n4. Check no bypass/exception accounts exist without documented approval',
        },
        {
            requirementId: reqByCode.get('A.8.8')!,
            name: 'Vulnerability Management Procedure & Scan Reports',
            description: 'Vulnerability scanning procedure and recent scan results.',
            requiredDocTypes: ['Procedure', 'Evidence', 'Log'],
            maxAgeDays: 90,
            requiredKeywords: ['vulnerability', 'patching'],
            systemSource: 'vulnerability_scanner',
            accountableRole: 'IT Manager / CTO',
            testProcedure: '1. Confirm vulnerability management procedure exists\n2. Verify scans are run at defined frequency (minimum quarterly)\n3. Review most recent scan report for critical/high findings\n4. Confirm remediation timelines: critical ≤7 days, high ≤30 days\n5. Verify patch management process and evidence of recent patching',
        },
        {
            requirementId: reqByCode.get('A.8.9')!,
            name: 'Configuration Management Standards',
            description: 'Security configuration baselines and hardening standards.',
            requiredDocTypes: ['Procedure', 'Evidence'],
            maxAgeDays: 365,
            requiredKeywords: ['configuration management', 'hardening'],
            systemSource: 'manual',
            accountableRole: 'IT Manager / DevOps Lead',
            testProcedure: '1. Confirm configuration baseline document exists\n2. Verify it covers: server hardening, cloud service configuration, network settings\n3. Check evidence that baselines are applied (e.g. IaC templates, config audit output)',
        },
        {
            requirementId: reqByCode.get('A.8.13')!,
            name: 'Backup Procedure & Restore Test Logs',
            description: 'Backup policy with evidence of regular restore testing.',
            requiredDocTypes: ['Procedure', 'Log'],
            maxAgeDays: 90,
            requiredKeywords: ['backup', 'restore'],
            systemSource: 'backup_platform',
            accountableRole: 'IT Manager / DevOps Lead',
            testProcedure: '1. Confirm backup procedure exists and defines: scope, frequency, retention, encryption\n2. Verify backups are running (screenshot of backup dashboard/logs)\n3. Confirm restore test completed within the last 90 days\n4. Verify restore test log includes: date, data restored, success/failure, time to restore',
        },
        {
            requirementId: reqByCode.get('A.8.15')!,
            name: 'Logging & Monitoring Procedure',
            description: 'Logging standards, retention policy, and monitoring procedure.',
            requiredDocTypes: ['Procedure', 'Evidence'],
            maxAgeDays: 365,
            requiredKeywords: ['logging', 'audit log'],
            systemSource: 'siem',
            accountableRole: 'IT Manager / CISO',
            testProcedure: '1. Confirm logging procedure exists\n2. Verify it defines: log types collected, retention period, access controls on logs\n3. Confirm monitoring/alerting is configured (SIEM dashboard screenshot or equivalent)\n4. Verify logs cannot be modified or deleted by system administrators',
        },
        {
            requirementId: reqByCode.get('A.8.24')!,
            name: 'Cryptography Policy',
            description: 'Policy for encryption standards and key management.',
            requiredDocTypes: ['Policy', 'Procedure'],
            maxAgeDays: 365,
            requiredKeywords: ['cryptography', 'encryption'],
            systemSource: 'manual',
            accountableRole: 'CTO / IT Manager',
            testProcedure: '1. Confirm cryptography policy exists\n2. Verify it defines: encryption at rest (AES-256), in transit (TLS 1.2+), key management\n3. Check evidence that encryption is applied (e.g. database encryption settings, TLS config)\n4. Verify key rotation schedule is defined and followed',
        },
        {
            requirementId: reqByCode.get('A.8.25')!,
            name: 'Secure Development Lifecycle Policy',
            description: 'SDLC policy covering secure coding, code review, and security testing.',
            requiredDocTypes: ['Policy', 'Procedure'],
            maxAgeDays: 365,
            requiredKeywords: ['secure development', 'sdlc'],
            systemSource: 'manual',
            accountableRole: 'CTO / Engineering Lead',
            testProcedure: '1. Confirm SDLC policy exists\n2. Verify it defines: secure coding standards, mandatory code review, security testing\n3. Check evidence of code reviews (e.g. PR merge requirements in Git)\n4. Verify security testing is included in CI/CD pipeline (SAST/DAST evidence)',
        },
    ]

    await prisma.evidenceType.createMany({
        data: evidenceTypes.map(et => ({
            libraryVersionId: libV1.id,
            ...et,
        }))
    })

    // Create the initial change log entries
    const changeLogEntries = iso.requirements.map(req => ({
        libraryVersionId: libV1.id,
        controlCode: req.code,
        changeType: 'ADDED',
        summary: `Initial definition of evidence type for ${req.title}.`,
        customerImpact: 'No action required. This is the first version of the control library.',
    }))
    await prisma.controlLibraryChangeLog.createMany({ data: changeLogEntries })

    console.log(`✓ Seeded ISO 27001:2022 framework with ${iso.requirements.length} controls.`)
    console.log(`✓ Seeded CEG Control Library v1.0.0 with ${evidenceTypes.length} evidence type definitions.`)
    console.log(`✓ Created ${changeLogEntries.length} change log entries.`)
}

main()
    .then(async () => { await prisma.$disconnect() })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
