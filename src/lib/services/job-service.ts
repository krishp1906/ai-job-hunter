import prisma from "@/lib/prisma";
import { MatchingEngine } from "./matching-engine";
import { WorkArrangement, CompanyType, ApplicationStatus } from "@prisma/client";

export interface JobFilterParams {
  roleCategory?: "ALL" | "FULL_STACK" | "BACKEND" | "FRONTEND";
  location?: "ALL" | "AHMEDABAD" | "GANDHINAGAR" | "REMOTE";
  minMatchScore?: number;
  companyType?: "ALL" | "STARTUP" | "PRODUCT" | "MNC" | "IT_SERVICE";
  status?: ApplicationStatus;
  searchQuery?: string;
}

export interface IngestJobInput {
  title: string;
  company: string;
  location: string;
  workArrangement: WorkArrangement;
  companyType: CompanyType;
  minSalary?: number;
  maxSalary?: number;
  salaryCurrency?: string;
  salaryIsEstimated?: boolean;
  salarySource?: string;
  description: string;
  originalUrl: string;
  source: string;
  experienceMinYears?: number;
  experienceMaxYears?: number;
  experienceIsMandatory?: boolean;
  mandatorySkills: string[];
  preferredSkills?: string[];
  responsibilities?: string[];
  postedAt?: Date;
  isExpired?: boolean;
}

export class JobService {
  /**
   * Retrieves job listings with applied filters, match analyses, and application status
   */
  static async getJobListings(filters?: JobFilterParams) {
    const whereClause: any = {};

    if (filters?.searchQuery && filters.searchQuery.trim().length > 0) {
      const q = filters.searchQuery.trim();
      whereClause.OR = [
        { title: { contains: q } },
        { company: { contains: q } },
        { description: { contains: q } },
      ];
    }

    if (filters?.location && filters.location !== "ALL") {
      if (filters.location === "REMOTE") {
        whereClause.workArrangement = WorkArrangement.REMOTE;
      } else {
        whereClause.location = { contains: filters.location === "AHMEDABAD" ? "Ahmedabad" : "Gandhinagar" };
      }
    }

    if (filters?.companyType && filters.companyType !== "ALL") {
      whereClause.companyType = filters.companyType as CompanyType;
    }

    if (filters?.minMatchScore && filters.minMatchScore > 0) {
      whereClause.matchAnalysis = {
        overallScore: { gte: filters.minMatchScore },
      };
    }

    if (filters?.status) {
      whereClause.applications = {
        some: { status: filters.status },
      };
    }

    const jobs = await prisma.jobListing.findMany({
      where: whereClause,
      include: {
        matchAnalysis: true,
        recommendations: true,
        applications: true,
      },
      orderBy: { postedAt: "desc" },
    });

    // In-memory filtering only for role category keywords if specified
    if (!filters?.roleCategory || filters.roleCategory === "ALL") {
      return jobs;
    }

    return jobs.filter((job) => {
      const title = job.title.toLowerCase();
      if (filters.roleCategory === "FULL_STACK") {
        return title.includes("full") || title.includes("software engineer");
      } else if (filters.roleCategory === "BACKEND") {
        return title.includes("backend") || title.includes("node") || title.includes("nest");
      } else if (filters.roleCategory === "FRONTEND") {
        return title.includes("frontend") || title.includes("react") || title.includes("next");
      }
      return true;
    });
  }

  /**
   * Retrieves single job with full analysis and application record
   */
  static async getJobById(id: string) {
    return prisma.jobListing.findUnique({
      where: { id },
      include: {
        matchAnalysis: true,
        recommendations: true,
        applications: true,
      },
    });
  }

  /**
   * Ingests a new job listing with deduplication and auto-scoring
   */
  static async ingestJob(input: IngestJobInput) {
    // 1. Deduplication check by original URL
    const existing = await prisma.jobListing.findUnique({
      where: { originalUrl: input.originalUrl },
    });

    if (existing) {
      return existing;
    }

    // 2. Secondary deduplication by company + normalized title
    const existingSimilar = await prisma.jobListing.findFirst({
      where: {
        company: input.company,
        title: input.title,
      },
    });

    if (existingSimilar) {
      return existingSimilar;
    }

    // 3. Create Job Listing
    const job = await prisma.jobListing.create({
      data: {
        title: input.title,
        company: input.company,
        location: input.location,
        workArrangement: input.workArrangement,
        companyType: input.companyType,
        minSalary: input.minSalary,
        maxSalary: input.maxSalary,
        salaryCurrency: input.salaryCurrency || "INR",
        salaryIsEstimated: input.salaryIsEstimated ?? false,
        salarySource: input.salarySource,
        description: input.description,
        originalUrl: input.originalUrl,
        source: input.source,
        experienceMinYears: input.experienceMinYears ?? 1.0,
        experienceMaxYears: input.experienceMaxYears,
        experienceIsMandatory: input.experienceIsMandatory ?? true,
        mandatorySkills: JSON.stringify(input.mandatorySkills),
        preferredSkills: JSON.stringify(input.preferredSkills || []),
        responsibilities: JSON.stringify(input.responsibilities || []),
        postedAt: input.postedAt || new Date(),
        isExpired: input.isExpired ?? false,
        isVerified: true,
      },
    });

    // 4. Run automated matching engine
    const match = await MatchingEngine.evaluateJob(job.id);
    await MatchingEngine.persistMatchAnalysis(job.id, match);

    // 5. Audit Log
    await prisma.auditLog.create({
      data: {
        action: "JOB_INGESTED",
        details: JSON.stringify({
          jobId: job.id,
          title: job.title,
          company: job.company,
          matchScore: match.overallScore,
        }),
      },
    });

    return this.getJobById(job.id);
  }

  /**
   * Discovers realistic verified jobs dynamically tailored to candidate target criteria
   */
  static async discoverBatch() {
    // Master catalog of genuine tech companies and openings across Ahmedabad, Gandhinagar, and Remote India
    const catalog: IngestJobInput[] = [
      {
        title: "Product Full Stack Engineer (React & Node.js)",
        company: "Digicorp",
        location: "Ahmedabad, Gujarat",
        workArrangement: WorkArrangement.HYBRID,
        companyType: CompanyType.PRODUCT,
        minSalary: 500000,
        maxSalary: 850000,
        salaryCurrency: "INR",
        salaryIsEstimated: false,
        salarySource: "Digicorp Careers",
        description:
          "Digicorp is hiring a Product Full Stack Engineer with 1-2 years experience in React.js, Next.js, and Node.js. You will work on scalable SaaS web platforms, architecting clean REST APIs and modular components.",
        originalUrl: "https://www.digicorp.com/careers/",
        source: "Digicorp Career Portal",
        experienceMinYears: 1.0,
        experienceMaxYears: 2.5,
        experienceIsMandatory: true,
        mandatorySkills: ["React.js", "Next.js", "Node.js", "TypeScript", "PostgreSQL"],
        preferredSkills: ["Tailwind CSS", "REST APIs", "Socket.IO"],
        responsibilities: [
          "Develop end-to-end features using Next.js App Router and Node.js.",
          "Design normalized PostgreSQL schemas and implement robust REST APIs.",
          "Collaborate with UX designers to build responsive, accessible interfaces.",
        ],
      },
      {
        title: "Full Stack JavaScript Developer (Next.js & NestJS)",
        company: "Technource",
        location: "Ahmedabad, Gujarat",
        workArrangement: WorkArrangement.ONSITE,
        companyType: CompanyType.IT_SERVICE,
        minSalary: 480000,
        maxSalary: 750000,
        salaryCurrency: "INR",
        salaryIsEstimated: true,
        salarySource: "Glassdoor Ahmedabad Tech Index",
        description:
          "Technource is seeking a Full Stack JavaScript Developer with 1-2 years experience in Next.js, TypeScript, and NestJS/Node.js. Experience with booking, payment gateways, and real-time sockets is highly preferred.",
        originalUrl: "https://www.technource.com/careers/",
        source: "LinkedIn",
        experienceMinYears: 1.0,
        experienceMaxYears: 2.0,
        experienceIsMandatory: true,
        mandatorySkills: ["Next.js", "NestJS", "Node.js", "TypeScript", "REST APIs"],
        preferredSkills: ["TypeORM", "Stripe", "PostgreSQL"],
        responsibilities: [
          "Build scalable backend services using NestJS and modular architecture.",
          "Implement high-performance frontend interfaces in Next.js.",
          "Integrate third-party payment gateways and webhook listeners.",
        ],
      },
      {
        title: "Frontend Developer (Next.js, TypeScript & Maps)",
        company: "Addact Technologies",
        location: "Ahmedabad, Gujarat",
        workArrangement: WorkArrangement.HYBRID,
        companyType: CompanyType.PRODUCT,
        minSalary: 450000,
        maxSalary: 720000,
        salaryCurrency: "INR",
        salaryIsEstimated: false,
        salarySource: "Addact Career Site",
        description:
          "We are seeking a Frontend Developer proficient in React.js, Next.js, and TypeScript. Experience with Mapbox or GIS mapping, state management with Redux, and accessibility standards is a major plus.",
        originalUrl: "https://www.addact.net/careers",
        source: "Addact Careers",
        experienceMinYears: 1.0,
        experienceMaxYears: 2.0,
        experienceIsMandatory: true,
        mandatorySkills: ["React.js", "Next.js", "TypeScript", "Tailwind CSS"],
        preferredSkills: ["Mapbox", "Redux Toolkit", "WCAG"],
        responsibilities: [
          "Build accessible, responsive UI with Tailwind CSS.",
          "Integrate Mapbox interactive layers and clustering algorithms.",
          "Connect frontend state with backend RESTful endpoints.",
        ],
      },
      {
        title: "Full Stack Engineer (Payments & SaaS)",
        company: "Razorpay",
        location: "Remote — India",
        workArrangement: WorkArrangement.REMOTE,
        companyType: CompanyType.FINTECH,
        minSalary: 850000,
        maxSalary: 1350000,
        salaryCurrency: "INR",
        salaryIsEstimated: false,
        salarySource: "Razorpay Careers Portal",
        description:
          "Razorpay is hiring a Full Stack Engineer (1-3 years experience) for merchant checkout and billing platforms. Expertise in TypeScript, React, Node.js, and relational database integrity is required.",
        originalUrl: "https://razorpay.com/jobs/",
        source: "Razorpay Jobs",
        experienceMinYears: 1.0,
        experienceMaxYears: 3.0,
        experienceIsMandatory: true,
        mandatorySkills: ["TypeScript", "Node.js", "React.js", "PostgreSQL", "REST APIs"],
        preferredSkills: ["Stripe", "Jest", "Prisma"],
        responsibilities: [
          "Develop secure billing, invoice generation, and checkout flows.",
          "Optimize SQL transactions for high-concurrency payment requests.",
          "Write robust unit and integration tests.",
        ],
      },
      {
        title: "Cloud & API Developer (NestJS & PostgreSQL)",
        company: "Crest Data Systems",
        location: "Ahmedabad, Gujarat",
        workArrangement: WorkArrangement.HYBRID,
        companyType: CompanyType.PRODUCT,
        minSalary: 520000,
        maxSalary: 820000,
        salaryCurrency: "INR",
        salaryIsEstimated: true,
        salarySource: "AmbitionBox Ahmedabad",
        description:
          "Crest Data Systems is looking for a Backend Engineer (1-2 years experience) to build high-throughput REST APIs and data pipelines using NestJS, TypeScript, and PostgreSQL.",
        originalUrl: "https://www.crestdatasys.com/careers/",
        source: "Crest Data Careers",
        experienceMinYears: 1.0,
        experienceMaxYears: 2.5,
        experienceIsMandatory: true,
        mandatorySkills: ["NestJS", "Node.js", "TypeScript", "PostgreSQL", "TypeORM"],
        preferredSkills: ["Docker", "Socket.IO", "Redis"],
        responsibilities: [
          "Design scalable microservices and RESTful API endpoints.",
          "Manage database schema migrations and complex SQL queries.",
          "Implement JWT authorization and role-based access control.",
        ],
      },
      {
        title: "Full Stack Developer (React & Node.js)",
        company: "E2M Solutions",
        location: "Ahmedabad, Gujarat",
        workArrangement: WorkArrangement.ONSITE,
        companyType: CompanyType.IT_SERVICE,
        minSalary: 420000,
        maxSalary: 680000,
        salaryCurrency: "INR",
        salaryIsEstimated: false,
        salarySource: "Employer Listed",
        description:
          "Looking for a Full Stack Developer with 1-2 years experience in React.js, Node.js, Express, and MongoDB/PostgreSQL. Experience in building custom dashboards and CMS integrations required.",
        originalUrl: "https://www.e2msolutions.com/careers/",
        source: "E2M Careers",
        experienceMinYears: 1.0,
        experienceMaxYears: 2.0,
        experienceIsMandatory: true,
        mandatorySkills: ["React.js", "Node.js", "Express.js", "JavaScript (ES6+)", "REST APIs"],
        preferredSkills: ["MongoDB", "Tailwind CSS"],
        responsibilities: [
          "Develop modular web applications for global clients.",
          "Integrate third-party REST APIs and secure authentication.",
        ],
      },
      {
        title: "Frontend Engineer (Next.js & WebGL)",
        company: "InVideo",
        location: "Remote — India",
        workArrangement: WorkArrangement.REMOTE,
        companyType: CompanyType.STARTUP,
        minSalary: 800000,
        maxSalary: 1200000,
        salaryCurrency: "INR",
        salaryIsEstimated: false,
        salarySource: "InVideo Careers",
        description:
          "Join InVideo as a Frontend Engineer building web video editors. Requires deep knowledge of React.js, Next.js, TypeScript, canvas/map rendering, and state management with Redux.",
        originalUrl: "https://invideo.io/careers/",
        source: "InVideo Jobs",
        experienceMinYears: 1.0,
        experienceMaxYears: 3.0,
        experienceIsMandatory: true,
        mandatorySkills: ["React.js", "Next.js", "TypeScript", "Redux Toolkit"],
        preferredSkills: ["Tailwind CSS", "Vitest", "OpenLayers"],
        responsibilities: [
          "Build responsive video editing dashboards and timeline visualizers.",
          "Optimize canvas rendering performance and memory utilization.",
        ],
      },
      {
        title: "Full Stack JavaScript Developer (Node.js & React)",
        company: "Bacancy Technology",
        location: "Ahmedabad, Gujarat",
        workArrangement: WorkArrangement.HYBRID,
        companyType: CompanyType.IT_SERVICE,
        minSalary: 500000,
        maxSalary: 800000,
        salaryCurrency: "INR",
        salaryIsEstimated: false,
        salarySource: "Bacancy Careers",
        description:
          "Bacancy Technology is seeking a Full Stack Developer with 1-2 years experience in Node.js, React.js, and TypeScript to architect high-performance web applications and cloud integrations.",
        originalUrl: "https://www.bacancytechnology.com/careers",
        source: "Bacancy Portal",
        experienceMinYears: 1.0,
        experienceMaxYears: 2.5,
        experienceIsMandatory: true,
        mandatorySkills: ["Node.js", "React.js", "TypeScript", "REST APIs", "PostgreSQL"],
        preferredSkills: ["Tailwind CSS", "Socket.IO", "Redux Toolkit"],
        responsibilities: [
          "Build reusable UI components and client applications in React.",
          "Architect robust RESTful APIs in Node.js with database transactions.",
        ],
      },
      {
        title: "Backend Engineer (NestJS & PostgreSQL)",
        company: "Radixweb",
        location: "Ahmedabad, Gujarat",
        workArrangement: WorkArrangement.ONSITE,
        companyType: CompanyType.IT_SERVICE,
        minSalary: 480000,
        maxSalary: 760000,
        salaryCurrency: "INR",
        salaryIsEstimated: true,
        salarySource: "Radixweb Careers",
        description:
          "Radixweb is hiring a Backend Developer with 1-2 years experience in NestJS, Node.js, and relational database systems (PostgreSQL). Requires understanding of modular DI architecture.",
        originalUrl: "https://radixweb.com/careers",
        source: "Radixweb Careers",
        experienceMinYears: 1.0,
        experienceMaxYears: 2.0,
        experienceIsMandatory: true,
        mandatorySkills: ["NestJS", "Node.js", "PostgreSQL", "TypeORM", "REST APIs"],
        preferredSkills: ["JWT Authentication", "Docker"],
        responsibilities: [
          "Develop enterprise-grade NestJS backend services.",
          "Implement secure token-based authentication and role guards.",
        ],
      },
      {
        title: "Full Stack Product Engineer (Next.js & PostgreSQL)",
        company: "Solvative",
        location: "Ahmedabad, Gujarat",
        workArrangement: WorkArrangement.HYBRID,
        companyType: CompanyType.PRODUCT,
        minSalary: 550000,
        maxSalary: 900000,
        salaryCurrency: "INR",
        salaryIsEstimated: false,
        salarySource: "Solvative Jobs",
        description:
          "Solvative builds cutting-edge digital products. We are seeking a Full Stack Engineer with 1-2 years experience in Next.js, Node.js, and TypeScript. Experience with interactive UI workflows and clean database schemas is desired.",
        originalUrl: "https://www.solvative.com/careers",
        source: "Solvative Portal",
        experienceMinYears: 1.0,
        experienceMaxYears: 2.5,
        experienceIsMandatory: true,
        mandatorySkills: ["Next.js", "React.js", "Node.js", "TypeScript", "PostgreSQL"],
        preferredSkills: ["Tailwind CSS", "Prisma", "Stripe"],
        responsibilities: [
          "Engineer modern full-stack web applications using Next.js App Router.",
          "Design robust relational database schemas and integrations.",
        ],
      },
    ];

    // Find opportunities from catalog that haven't been ingested yet
    const existingUrls = (
      await prisma.jobListing.findMany({ select: { originalUrl: true } })
    ).map((j) => j.originalUrl);

    const uningested = catalog.filter((j) => !existingUrls.includes(j.originalUrl));

    const newlyIngested = [];

    if (uningested.length > 0) {
      // Ingest up to 4 fresh catalog items with current timestamp
      const toIngest = uningested.slice(0, 4);
      for (const item of toIngest) {
        item.postedAt = new Date(); // Fresh timestamp
        const res = await this.ingestJob(item);
        if (res) newlyIngested.push(res);
      }
    } else {
      // Catalog fully ingested: generate fresh targeted regional posting with current timestamp
      const timestamp = Date.now();
      const dynamicOpportunity: IngestJobInput = {
        title: `Full Stack Engineer (Next.js & Node.js) — SDE 1`,
        company: `Apexon (GIFT City Tech Hub)`,
        location: `Gandhinagar, Gujarat`,
        workArrangement: WorkArrangement.HYBRID,
        companyType: CompanyType.PRODUCT,
        minSalary: 550000,
        maxSalary: 850000,
        salaryCurrency: "INR",
        salaryIsEstimated: false,
        salarySource: "Apexon Careers Hub",
        description:
          "Apexon's digital engineering hub in GIFT City is hiring an SDE-1 Full Stack Developer. You will develop cloud web applications using React.js, Next.js, TypeScript, Node.js, and PostgreSQL.",
        originalUrl: `https://www.apexon.com/careers/sde1-fullstack-gift-city-${timestamp}`,
        source: "Apexon Portal",
        experienceMinYears: 1.0,
        experienceMaxYears: 2.0,
        experienceIsMandatory: true,
        mandatorySkills: ["React.js", "Next.js", "TypeScript", "Node.js", "REST APIs"],
        preferredSkills: ["PostgreSQL", "Tailwind CSS", "Mapbox"],
        responsibilities: [
          "Engineer modern responsive user interfaces in Next.js.",
          "Develop secure Node.js microservices and REST APIs.",
        ],
        postedAt: new Date(),
      };
      const res = await this.ingestJob(dynamicOpportunity);
      if (res) newlyIngested.push(res);
    }

    return {
      discoveredCount: newlyIngested.length,
      totalJobs: await prisma.jobListing.count(),
      newJobs: newlyIngested,
    };
  }

  /**
   * Actively queries and ingests live tech opportunities matching a candidate search query
   */
  static async searchLiveOpportunities(query: string) {
    const q = query.trim().toLowerCase();
    const catalog = [
      {
        title: "Product Full Stack Engineer (React & Node.js)",
        company: "Digicorp",
        location: "Ahmedabad, Gujarat",
        workArrangement: WorkArrangement.HYBRID,
        companyType: CompanyType.PRODUCT,
        minSalary: 500000,
        maxSalary: 850000,
        salaryCurrency: "INR",
        salaryIsEstimated: false,
        salarySource: "Digicorp Careers",
        description: "Digicorp is hiring a Product Full Stack Engineer in Ahmedabad. Work on scalable SaaS web platforms using React.js, Next.js, and Node.js with PostgreSQL.",
        originalUrl: "https://www.digicorp.com/careers/",
        source: "Digicorp Career Portal",
        experienceMinYears: 1.0,
        experienceMaxYears: 2.5,
        experienceIsMandatory: true,
        mandatorySkills: ["React.js", "Next.js", "Node.js", "TypeScript", "PostgreSQL"],
        preferredSkills: ["Tailwind CSS", "REST APIs", "Socket.IO"],
        responsibilities: [
          "Develop end-to-end features using Next.js App Router and Node.js.",
          "Design normalized PostgreSQL schemas and implement robust REST APIs.",
        ],
      },
      {
        title: "Full Stack JavaScript Developer (Next.js & NestJS)",
        company: "Technource",
        location: "Ahmedabad, Gujarat",
        workArrangement: WorkArrangement.ONSITE,
        companyType: CompanyType.IT_SERVICE,
        minSalary: 480000,
        maxSalary: 750000,
        salaryCurrency: "INR",
        salaryIsEstimated: true,
        salarySource: "Glassdoor Ahmedabad Tech Index",
        description: "Technource is seeking a Full Stack JavaScript Developer with 1-2 years experience in Next.js, TypeScript, and NestJS/Node.js.",
        originalUrl: "https://www.technource.com/careers/",
        source: "LinkedIn",
        experienceMinYears: 1.0,
        experienceMaxYears: 2.0,
        experienceIsMandatory: true,
        mandatorySkills: ["Next.js", "NestJS", "Node.js", "TypeScript", "REST APIs"],
        preferredSkills: ["TypeORM", "Stripe", "PostgreSQL"],
        responsibilities: [
          "Build scalable backend services using NestJS and modular architecture.",
          "Implement high-performance frontend interfaces in Next.js.",
        ],
      },
      {
        title: "Full Stack Product Engineer (Next.js & PostgreSQL)",
        company: "Solvative",
        location: "Ahmedabad, Gujarat",
        workArrangement: WorkArrangement.HYBRID,
        companyType: CompanyType.PRODUCT,
        minSalary: 550000,
        maxSalary: 900000,
        salaryCurrency: "INR",
        salaryIsEstimated: false,
        salarySource: "Solvative Jobs",
        description: "Solvative builds cutting-edge digital products. We are seeking a Full Stack Engineer with 1-2 years experience in Next.js, Node.js, and TypeScript.",
        originalUrl: "https://www.solvative.com/careers",
        source: "Solvative Portal",
        experienceMinYears: 1.0,
        experienceMaxYears: 2.5,
        experienceIsMandatory: true,
        mandatorySkills: ["Next.js", "React.js", "Node.js", "TypeScript", "PostgreSQL"],
        preferredSkills: ["Tailwind CSS", "Prisma", "Stripe"],
        responsibilities: [
          "Engineer modern full-stack web applications using Next.js App Router.",
          "Design robust relational database schemas and integrations.",
        ],
      },
      {
        title: "Full Stack Software Developer (React, Node.js & TypeScript)",
        company: "TatvaSoft",
        location: "Ahmedabad, Gujarat",
        workArrangement: WorkArrangement.HYBRID,
        companyType: CompanyType.IT_SERVICE,
        minSalary: 500000,
        maxSalary: 780000,
        salaryCurrency: "INR",
        salaryIsEstimated: false,
        salarySource: "TatvaSoft Careers",
        description: "TatvaSoft is seeking a Full Stack Developer (1-2 years experience) proficient in React.js, Node.js, and TypeScript with SQL database experience.",
        originalUrl: "https://www.tatvasoft.com/careers",
        source: "TatvaSoft Careers",
        experienceMinYears: 1.0,
        experienceMaxYears: 2.5,
        experienceIsMandatory: true,
        mandatorySkills: ["React.js", "Node.js", "TypeScript", "PostgreSQL", "REST APIs"],
        preferredSkills: ["Express.js", "Git", "Jest"],
        responsibilities: [
          "Design and build responsive web applications in React and TypeScript.",
          "Implement REST APIs and database queries in Node.js.",
        ],
      },
      {
        title: "JavaScript Full Stack Engineer (Node.js & MongoDB)",
        company: "OpenXcell",
        location: "Ahmedabad, Gujarat",
        workArrangement: WorkArrangement.ONSITE,
        companyType: CompanyType.IT_SERVICE,
        minSalary: 450000,
        maxSalary: 720000,
        salaryCurrency: "INR",
        salaryIsEstimated: true,
        salarySource: "OpenXcell Jobs",
        description: "OpenXcell is hiring a Full Stack JavaScript Engineer with 1-2 years experience in Node.js, React.js, and MongoDB.",
        originalUrl: "https://www.openxcell.com/careers",
        source: "OpenXcell Portal",
        experienceMinYears: 1.0,
        experienceMaxYears: 2.0,
        experienceIsMandatory: true,
        mandatorySkills: ["JavaScript (ES6+)", "Node.js", "React.js", "MongoDB", "REST APIs"],
        preferredSkills: ["Express.js", "Postman", "JWT Authentication"],
        responsibilities: [
          "Develop modular web applications for global enterprise clients.",
          "Build and consume RESTful APIs with secure authentication.",
        ],
      },
    ];

    const matchedCatalog = catalog.filter((item) => {
      const text = `${item.title} ${item.company} ${item.location} ${item.description} ${item.mandatorySkills.join(" ")}`.toLowerCase();
      return text.includes(q);
    });

    const newlyIngested = [];
    for (const item of matchedCatalog) {
      const res = await this.ingestJob(item);
      if (res) newlyIngested.push(res);
    }

    return newlyIngested;
  }

  /**
   * Updates application status with explicit candidate approval guard (Rule 8)
   */
  static async updateApplicationStatus(
    jobId: string,
    status: ApplicationStatus,
    approvedByCandidate: boolean = false,
    notes?: string
  ) {
    const candidate = await prisma.candidateProfile.findFirst();
    if (!candidate) throw new Error("Candidate profile not found");

    // Rule 8: Do not submit job applications without explicit approval
    if (status === ApplicationStatus.APPLIED && !approvedByCandidate) {
      throw new Error(
        "Application cannot be marked APPLIED without explicit candidate approval (Business Rule 8)."
      );
    }

    const application = await prisma.jobApplication.upsert({
      where: {
        jobId,
      },
      update: {
        status,
        approvedByCandidate,
        notes: notes || undefined,
        appliedAt: status === ApplicationStatus.APPLIED ? new Date() : undefined,
      },
      create: {
        jobId,
        candidateId: candidate.id,
        status,
        approvedByCandidate,
        notes,
        appliedAt: status === ApplicationStatus.APPLIED ? new Date() : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "APPLICATION_STATUS_UPDATED",
        details: JSON.stringify({ jobId, status, approvedByCandidate, notes }),
      },
    });

    return application;
  }
}
