import { PrismaClient, SkillCategory, ExperienceType, ProficiencyLevel, ResumeProfileType, WorkArrangement, CompanyType, RecommendationVerdict, ApplicationStatus } from "@prisma/client";
import { JobService } from "../src/lib/services/job-service";

const prisma = new PrismaClient();

/**
 * ============================================================================
 * CANDIDATE CONFIGURATION TEMPLATE
 * ============================================================================
 * To personalize AI JobHunter with your own credentials:
 * 1. Customize the candidate fields, work experiences, and projects in this file
 *    and run: `npm run db:seed`
 * 2. OR launch the web app (`npm run dev`) and click "Upload Resume (PDF)"
 *    on the dashboard to automatically parse your resume in one click!
 * ============================================================================
 */
async function main() {
  console.log("🌱 Starting AI JobHunter database seeding with candidate template...");

  // Clear existing data cleanly in reverse order
  await prisma.jobApplication.deleteMany();
  await prisma.aIRecommendation.deleteMany();
  await prisma.jobMatchAnalysis.deleteMany();
  await prisma.jobListing.deleteMany();
  await prisma.resumeProfile.deleteMany();
  await prisma.project.deleteMany();
  await prisma.education.deleteMany();
  await prisma.workExperience.deleteMany();
  await prisma.candidateSkill.deleteMany();
  await prisma.candidateProfile.deleteMany();
  await prisma.auditLog.deleteMany();

  // 1. Candidate Profile Template
  const candidate = await prisma.candidateProfile.create({
    data: {
      name: "Full Stack Developer",
      email: "candidate.developer@example.com",
      phone: "+91-9876543210",
      location: "Ahmedabad, Gujarat, India",
      currentPosition: "Associate Software Developer",
      currentCompany: "Tech Enterprise Solutions",
      employmentStartDate: new Date("2025-01-01T00:00:00.000Z"),
      manualExperienceYears: null, // Dynamic calculation enabled
      educationDegree: "B.E. Computer Science and Engineering",
      educationInstitution: "Technological University, Ahmedabad",
      educationGraduationYear: 2025,
      educationCgpa: 9.00,
      professionalSummary:
        "Full Stack Developer with professional experience building production web applications using React.js, Next.js, TypeScript and Node.js. Experience includes booking and payment workflows, interactive maps, admin dashboards, REST API integrations, multilingual applications and accessible interfaces.",
      targetRoles: JSON.stringify([
        "Full Stack Developer",
        "Full Stack JavaScript Developer",
        "Node.js Developer",
        "Backend Developer",
        "NestJS Developer",
        "React.js Developer",
        "Next.js Developer",
        "Software Engineer",
        "JavaScript Developer",
        "TypeScript Developer",
        "Python Backend Developer",
        "API Developer",
        "Junior Software Engineer",
        "Backend Software Engineer",
        "AI Application Developer",
      ]),
      targetLocations: JSON.stringify([
        "Ahmedabad",
        "Gandhinagar",
        "Remote — India",
        "Hybrid — Ahmedabad",
      ]),
      targetExpMin: 1.0,
      targetExpMax: 2.0,
    },
  });

  console.log(`✅ Created candidate profile: ${candidate.name} (ID: ${candidate.id})`);

  // 2. Technical Skills with strict proficiency distinction
  const skillsData = [
    // --- CORE SKILLS ---
    {
      name: "JavaScript (ES6+)",
      category: SkillCategory.CORE,
      experienceType: ExperienceType.PROFESSIONAL,
      verifiedProficiency: ProficiencyLevel.ADVANCED,
      yearsOfExperience: 1.5,
      notes: "Extensively used in production frontend and backend integrations",
    },
    {
      name: "TypeScript",
      category: SkillCategory.CORE,
      experienceType: ExperienceType.PROFESSIONAL,
      verifiedProficiency: ProficiencyLevel.ADVANCED,
      yearsOfExperience: 1.5,
      notes: "Strict typing across Next.js and NestJS enterprise codebases",
    },
    {
      name: "React.js",
      category: SkillCategory.CORE,
      experienceType: ExperienceType.PROFESSIONAL,
      verifiedProficiency: ProficiencyLevel.ADVANCED,
      yearsOfExperience: 1.5,
      notes: "Production UI development with custom hooks and performance optimization",
    },
    {
      name: "Next.js",
      category: SkillCategory.CORE,
      experienceType: ExperienceType.PROFESSIONAL,
      verifiedProficiency: ProficiencyLevel.ADVANCED,
      yearsOfExperience: 1.5,
      notes: "App Router, SSR, SSG, server components, and API integration",
    },
    {
      name: "Node.js",
      category: SkillCategory.CORE,
      experienceType: ExperienceType.PROFESSIONAL,
      verifiedProficiency: ProficiencyLevel.INTERMEDIATE,
      yearsOfExperience: 1.2,
      notes: "Backend services, REST APIs, asynchronous task processing",
    },
    {
      name: "NestJS",
      category: SkillCategory.CORE,
      experienceType: ExperienceType.PERSONAL_PROJECT,
      verifiedProficiency: ProficiencyLevel.INTERMEDIATE,
      yearsOfExperience: 1.0,
      notes: "Modular architecture, dependency injection, TypeORM in Catalyst platform",
    },
    {
      name: "REST APIs",
      category: SkillCategory.CORE,
      experienceType: ExperienceType.PROFESSIONAL,
      verifiedProficiency: ProficiencyLevel.ADVANCED,
      yearsOfExperience: 1.5,
      notes: "API design, consumption, error handling, auth headers, pagination",
    },
    {
      name: "PostgreSQL",
      category: SkillCategory.CORE,
      experienceType: ExperienceType.PERSONAL_PROJECT,
      verifiedProficiency: ProficiencyLevel.INTERMEDIATE,
      yearsOfExperience: 1.0,
      notes: "Relational schema design, indexes, migrations via TypeORM and Prisma",
    },
    {
      name: "MongoDB",
      category: SkillCategory.CORE,
      experienceType: ExperienceType.PERSONAL_PROJECT,
      verifiedProficiency: ProficiencyLevel.INTERMEDIATE,
      yearsOfExperience: 0.8,
      notes: "Document modeling, aggregation pipelines, Mongoose ODM",
    },
    {
      name: "Tailwind CSS",
      category: SkillCategory.CORE,
      experienceType: ExperienceType.PROFESSIONAL,
      verifiedProficiency: ProficiencyLevel.ADVANCED,
      yearsOfExperience: 1.5,
      notes: "Responsive layouts, utility classes, theme customization",
    },

    // --- ADDITIONAL SKILLS ---
    {
      name: "Express.js",
      category: SkillCategory.ADDITIONAL,
      experienceType: ExperienceType.PERSONAL_PROJECT,
      verifiedProficiency: ProficiencyLevel.INTERMEDIATE,
      yearsOfExperience: 1.0,
      notes: "Middleware routing, JWT security, custom error handlers",
    },
    {
      name: "Redux Toolkit",
      category: SkillCategory.ADDITIONAL,
      experienceType: ExperienceType.PROFESSIONAL,
      verifiedProficiency: ProficiencyLevel.ADVANCED,
      yearsOfExperience: 1.2,
      notes: "Global state slices, async thunks, RTK Query in marine platform",
    },
    {
      name: "TypeORM",
      category: SkillCategory.ADDITIONAL,
      experienceType: ExperienceType.PERSONAL_PROJECT,
      verifiedProficiency: ProficiencyLevel.INTERMEDIATE,
      yearsOfExperience: 1.0,
      notes: "Entity definitions, migrations, relations in NestJS",
    },
    {
      name: "Prisma",
      category: SkillCategory.ADDITIONAL,
      experienceType: ExperienceType.PERSONAL_PROJECT,
      verifiedProficiency: ProficiencyLevel.INTERMEDIATE,
      yearsOfExperience: 1.0,
      notes: "Type-safe ORM schema and client in Next.js freelance platform",
    },
    {
      name: "JWT Authentication",
      category: SkillCategory.ADDITIONAL,
      experienceType: ExperienceType.PERSONAL_PROJECT,
      verifiedProficiency: ProficiencyLevel.INTERMEDIATE,
      yearsOfExperience: 1.0,
      notes: "Token generation, refresh token strategies, bearer validation",
    },
    {
      name: "Passport.js",
      category: SkillCategory.ADDITIONAL,
      experienceType: ExperienceType.PERSONAL_PROJECT,
      verifiedProficiency: ProficiencyLevel.INTERMEDIATE,
      yearsOfExperience: 0.8,
      notes: "Auth strategies, local and OAuth integration",
    },
    {
      name: "Role-Based Access Control",
      category: SkillCategory.ADDITIONAL,
      experienceType: ExperienceType.PERSONAL_PROJECT,
      verifiedProficiency: ProficiencyLevel.INTERMEDIATE,
      yearsOfExperience: 1.0,
      notes: "Client vs Freelancer permissions, guards, route interceptors",
    },
    {
      name: "Socket.IO",
      category: SkillCategory.ADDITIONAL,
      experienceType: ExperienceType.PERSONAL_PROJECT,
      verifiedProficiency: ProficiencyLevel.INTERMEDIATE,
      yearsOfExperience: 0.8,
      notes: "Real-time chat and notification broadcasts in Catalyst",
    },
    {
      name: "Stripe",
      category: SkillCategory.ADDITIONAL,
      experienceType: ExperienceType.PERSONAL_PROJECT,
      verifiedProficiency: ProficiencyLevel.INTERMEDIATE,
      yearsOfExperience: 0.8,
      notes: "Payment intents, webhooks, checkout sessions, invoice billing",
    },
    {
      name: "Mapbox",
      category: SkillCategory.ADDITIONAL,
      experienceType: ExperienceType.PROFESSIONAL,
      verifiedProficiency: ProficiencyLevel.ADVANCED,
      yearsOfExperience: 1.0,
      notes: "Harbor maps, custom marker clustering, layer toggling",
    },
    {
      name: "OpenLayers",
      category: SkillCategory.ADDITIONAL,
      experienceType: ExperienceType.PROFESSIONAL,
      verifiedProficiency: ProficiencyLevel.ADVANCED,
      yearsOfExperience: 1.0,
      notes: "Nautical overlays, geo-coordinate calculations, vector layers",
    },
    {
      name: "Jest",
      category: SkillCategory.ADDITIONAL,
      experienceType: ExperienceType.PERSONAL_PROJECT,
      verifiedProficiency: ProficiencyLevel.INTERMEDIATE,
      yearsOfExperience: 0.8,
      notes: "Unit testing for utility functions and API handlers",
    },
    {
      name: "Vitest",
      category: SkillCategory.ADDITIONAL,
      experienceType: ExperienceType.PERSONAL_PROJECT,
      verifiedProficiency: ProficiencyLevel.INTERMEDIATE,
      yearsOfExperience: 0.8,
      notes: "Fast ESM unit tests and component testing",
    },
    {
      name: "Git",
      category: SkillCategory.ADDITIONAL,
      experienceType: ExperienceType.PROFESSIONAL,
      verifiedProficiency: ProficiencyLevel.ADVANCED,
      yearsOfExperience: 1.8,
      notes: "Feature branches, rebasing, pull requests, resolving conflicts",
    },
    {
      name: "Postman",
      category: SkillCategory.ADDITIONAL,
      experienceType: ExperienceType.PROFESSIONAL,
      verifiedProficiency: ProficiencyLevel.ADVANCED,
      yearsOfExperience: 1.5,
      notes: "Collection runner, environment variables, automated tests",
    },
    {
      name: "WCAG",
      category: SkillCategory.ADDITIONAL,
      experienceType: ExperienceType.PROFESSIONAL,
      verifiedProficiency: ProficiencyLevel.ADVANCED,
      yearsOfExperience: 1.0,
      notes: "Accessibility standards 2.1 AA, contrast checks, keyboard navigation",
    },
    {
      name: "ARIA",
      category: SkillCategory.ADDITIONAL,
      experienceType: ExperienceType.PROFESSIONAL,
      verifiedProficiency: ProficiencyLevel.ADVANCED,
      yearsOfExperience: 1.0,
      notes: "Accessible semantic attributes, screen reader compatibility",
    },
    {
      name: "Python",
      category: SkillCategory.ADDITIONAL,
      experienceType: ExperienceType.PERSONAL_PROJECT,
      verifiedProficiency: ProficiencyLevel.BEGINNER,
      yearsOfExperience: 0.6,
      notes: "Scripting, basic automation, introductory FastAPI/Flask",
    },
    {
      name: "SQL",
      category: SkillCategory.ADDITIONAL,
      experienceType: ExperienceType.PERSONAL_PROJECT,
      verifiedProficiency: ProficiencyLevel.INTERMEDIATE,
      yearsOfExperience: 1.2,
      notes: "Joins, aggregations, indexing, relational constraints",
    },

    // --- FAMILIAR TECHNOLOGIES ---
    {
      name: "GraphQL",
      category: SkillCategory.FAMILIAR,
      experienceType: ExperienceType.FAMILIARITY,
      verifiedProficiency: ProficiencyLevel.BEGINNER,
      yearsOfExperience: 0.3,
      notes: "Familiar with schemas, queries, and mutations",
    },
    {
      name: "Redis",
      category: SkillCategory.FAMILIAR,
      experienceType: ExperienceType.FAMILIARITY,
      verifiedProficiency: ProficiencyLevel.BEGINNER,
      yearsOfExperience: 0.3,
      notes: "Key-value caching concepts, TTL expiration",
    },
    {
      name: "BullMQ",
      category: SkillCategory.FAMILIAR,
      experienceType: ExperienceType.FAMILIARITY,
      verifiedProficiency: ProficiencyLevel.BEGINNER,
      yearsOfExperience: 0.3,
      notes: "Asynchronous task queue concepts and job worker setup",
    },
  ];

  for (const s of skillsData) {
    await prisma.candidateSkill.create({
      data: {
        candidateId: candidate.id,
        ...s,
      },
    });
  }
  console.log(`✅ Seeded ${skillsData.length} technical skills across CORE, ADDITIONAL, and FAMILIAR.`);

  // 3. Professional Experience (Template)
  await prisma.workExperience.create({
    data: {
      candidateId: candidate.id,
      company: "Tech Enterprise Solutions",
      position: "Associate Software Developer",
      startDate: new Date("2025-01-01T00:00:00.000Z"),
      endDate: null,
      isCurrent: true,
      location: "Ahmedabad, Gujarat, India",
      description: "End-to-end feature delivery on modern web and cloud platform architectures.",
      responsibilities: JSON.stringify([
        "Next.js, React.js and TypeScript frontend development.",
        "Responsive interfaces and reusable component libraries.",
        "Backend REST API integration and database transactions.",
        "Booking workflows and pricing/VAT calculation logic.",
        "Interactive geospatial visualizers and dashboard widgets.",
        "WCAG 2.1 AA accessibility standards and keyboard navigation.",
        "Agile development, sprint planning, and peer code reviews.",
      ]),
      technologies: JSON.stringify([
        "Next.js",
        "React.js",
        "TypeScript",
        "Redux Toolkit",
        "Tailwind CSS",
        "Mapbox",
        "REST APIs",
      ]),
    },
  });

  await prisma.workExperience.create({
    data: {
      candidateId: candidate.id,
      company: "Web Innovation Labs",
      position: "Web Developer Intern",
      startDate: new Date("2023-12-01T00:00:00.000Z"),
      endDate: new Date("2024-01-31T00:00:00.000Z"),
      isCurrent: false,
      location: "Ahmedabad, Gujarat, India",
      description: "Internship focused on full-stack web fundamentals and CRUD systems.",
      responsibilities: JSON.stringify([
        "Developed CRUD web portals with modular frontend components.",
        "Implemented RESTful API endpoints and database models.",
      ]),
      technologies: JSON.stringify([
        "JavaScript",
        "React.js",
        "HTML5",
        "CSS3",
        "REST APIs",
      ]),
    },
  });

  console.log("✅ Seeded work experience (Tech Enterprise Solutions & Web Innovation Labs).");

  // 4. Education
  await prisma.education.create({
    data: {
      candidateId: candidate.id,
      institution: "Technological University, Ahmedabad",
      degree: "B.E. Computer Science and Engineering",
      fieldOfStudy: "Computer Science and Engineering",
      graduationYear: 2025,
      cgpa: 9.00,
    },
  });
  console.log("✅ Seeded education (Technological University, 9.00 CGPA).");

  // 5. Projects
  const project1 = await prisma.project.create({
    data: {
      candidateId: candidate.id,
      title: "Marine Marketplace & Harbor Management Platform",
      technologies: JSON.stringify([
        "Next.js",
        "React.js",
        "TypeScript",
        "Redux Toolkit",
        "Tailwind CSS",
        "Mapbox",
        "OpenLayers",
      ]),
      capabilities: JSON.stringify([
        "Booking and payment workflows.",
        "Pricing and VAT calculations.",
        "Subscription management.",
        "Interactive maps.",
        "Weather overlays.",
        "Admin dashboards.",
        "Multilingual interfaces.",
        "Accessibility improvements.",
      ]),
      description:
        "Production-grade marine marketplace and harbor management platform supporting berth reservations, automated VAT/pricing calculations, real-time weather overlays, and interactive nautical maps.",
    },
  });

  const project2 = await prisma.project.create({
    data: {
      candidateId: candidate.id,
      title: "Catalyst — Community Discussion Platform",
      technologies: JSON.stringify([
        "Next.js",
        "TypeScript",
        "NestJS",
        "PostgreSQL",
        "TypeORM",
        "Redux Toolkit",
        "Socket.IO",
      ]),
      capabilities: JSON.stringify([
        "Community management.",
        "Posts and comments.",
        "Voting.",
        "User profiles.",
        "REST API development.",
        "Database modelling.",
        "JWT authentication.",
        "Real-time updates.",
      ]),
      description:
        "High-performance community discussion platform with real-time socket communications, threaded comments, voting algorithms, and robust NestJS REST API backend.",
    },
  });

  const project3 = await prisma.project.create({
    data: {
      candidateId: candidate.id,
      title: "Freelance Platform",
      technologies: JSON.stringify([
        "Next.js",
        "TypeScript",
        "Prisma",
        "PostgreSQL",
        "NextAuth",
        "Stripe",
        "Zod",
        "Tailwind CSS",
      ]),
      capabilities: JSON.stringify([
        "Client and freelancer management.",
        "Projects and milestones.",
        "Contracts and invoices.",
        "Role-based authentication.",
        "Stripe payment integration.",
        "PDF invoice generation.",
      ]),
      description:
        "Two-sided talent marketplace featuring milestone contracts, Stripe escrow checkout, role-based access control, and dynamic PDF invoice generation.",
    },
  });

  console.log("✅ Seeded 3 capability projects (Marine Platform, Catalyst, Freelance Platform).");

  // 6. Resume Profiles (A, B, C)
  await prisma.resumeProfile.create({
    data: {
      candidateId: candidate.id,
      profileType: ResumeProfileType.FULL_STACK,
      title: "Full Stack Developer Profile",
      targetSummary:
        "Versatile Full Stack Developer with 1+ years of experience engineering end-to-end web applications using React.js, Next.js, TypeScript, Node.js, and NestJS. Proven record building complex booking workflows, relational database architectures, and secure RESTful APIs.",
      emphasizedSkills: JSON.stringify([
        "React.js",
        "Next.js",
        "TypeScript",
        "Node.js",
        "NestJS",
        "PostgreSQL",
        "REST APIs",
        "Full-stack projects",
      ]),
      projectIds: JSON.stringify([project1.id, project2.id, project3.id]),
    },
  });

  await prisma.resumeProfile.create({
    data: {
      candidateId: candidate.id,
      profileType: ResumeProfileType.BACKEND,
      title: "Backend Developer Profile",
      targetSummary:
        "Backend-focused Software Developer with hands-on expertise in Node.js, NestJS, Express.js, PostgreSQL, and MongoDB. Strong foundation in REST API architecture, TypeORM/Prisma ORM modeling, JWT/RBAC security, and real-time Socket.IO processing.",
      emphasizedSkills: JSON.stringify([
        "Node.js",
        "NestJS",
        "Express.js",
        "PostgreSQL",
        "MongoDB",
        "REST API architecture",
        "Authentication",
        "RBAC",
        "TypeORM",
        "Prisma",
        "Socket.IO",
      ]),
      projectIds: JSON.stringify([project2.id, project3.id]),
    },
  });

  await prisma.resumeProfile.create({
    data: {
      candidateId: candidate.id,
      profileType: ResumeProfileType.FRONTEND,
      title: "Frontend Developer Profile",
      targetSummary:
        "Frontend Developer specialized in modern React.js, Next.js, and TypeScript ecosystems. Experienced in crafting pixel-perfect, accessible (WCAG 2.1 AA, ARIA) user interfaces with Tailwind CSS, Redux Toolkit, and geospatial visualizers with Mapbox & OpenLayers.",
      emphasizedSkills: JSON.stringify([
        "React.js",
        "Next.js",
        "TypeScript",
        "Redux Toolkit",
        "Tailwind CSS",
        "Responsive UI",
        "WCAG",
        "ARIA",
        "Mapbox",
        "API integration",
      ]),
      projectIds: JSON.stringify([project1.id]),
    },
  });

  console.log("✅ Seeded 3 targeted Resume Profiles (Full Stack, Backend, Frontend).");

  console.log("🔍 Ingesting and evaluating initial batch of verified authentic tech opportunities...");
  const discoveryResult = await JobService.discoverBatch();
  console.log(`✅ Ingested and 5-factor scored ${discoveryResult.discoveredCount} legitimate regional opportunities (Zero fake sample jobs).`);

  // 7. Audit Log
  await prisma.auditLog.create({
    data: {
      action: "PROFILE_AND_JOBS_SEED_COMPLETE",
      details: JSON.stringify({
        candidate: candidate.name,
        timestamp: new Date().toISOString(),
        skillsCount: skillsData.length,
        jobsCount: discoveryResult.discoveredCount,
      }),
    },
  });

  console.log("🚀 Candidate profile, technical portfolio, and verified opportunities seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
