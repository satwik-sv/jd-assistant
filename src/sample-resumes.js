// Fictional demonstration resumes, with intentional gaps for useful comparison.
export const SAMPLE_RESUMES = [
  `Demo candidate — Full-Stack Engineer
Experience: 3 years delivering customer-facing software.
Skills: React, TypeScript, Python, REST APIs, Git and component testing.
Built a React onboarding flow and Python API, reducing manual support requests.
Partnered with product managers and designers to clarify requirements.
Reviewed pull requests and added tests for critical user journeys.
Education: BTech in Computer Science.`,
  `Demo candidate — Junior Frontend Developer
Experience: 1 year of frontend development and portfolio projects.
Skills: React, JavaScript, HTML, CSS, Git and REST API integration.
Built responsive product pages from Figma designs using reusable components.
Worked with a designer and presented implementation choices in reviews.
Portfolio: shopping cart and event registration interfaces.
Education: BSc in Computer Science.`,
  `Demo candidate — Backend Engineer
Experience: 6 years of backend engineering.
Skills: Java, Spring Boot, PostgreSQL, JUnit, REST APIs and Docker.
Owned a billing service and improved slow SQL queries using execution plans.
Wrote automated integration tests and reviewed architecture proposals.
Mentored two junior engineers and explained reliability tradeoffs to stakeholders.
Education: BTech in Information Technology.`,
  `Demo candidate — Data Analyst
Experience: 3 years analyzing retail sales data.
Skills: SQL joins, Python, Excel, basic statistics and data-quality checks.
Investigated customer retention and validated weekly sales reporting.
Documented metric definitions and explained campaign findings to marketing teams.
Built spreadsheet reporting templates for operations.
Education: BSc in Statistics.`,
  `Demo candidate — Product Manager
Experience: 4 years managing appointment-booking software.
Interviewed customers and wrote product requirements and acceptance criteria.
Prioritized roadmap items with engineering, design and operations stakeholders.
Resolved competing delivery priorities and communicated release decisions.
Defined adoption metrics and tracked booking completion rates.
Education: MBA.`,
  `Demo candidate — Cloud Operations Engineer
Experience: 3 years operating AWS infrastructure.
Skills: Linux, Bash, networking, AWS IAM and CI/CD pipelines.
Maintained deployment pipelines and investigated production incidents.
Worked with developers to reduce repeated manual maintenance tasks.
Documented recovery procedures and supported scheduled evening maintenance.
Education: BTech in Computer Science.`,
  `Demo candidate — UX Designer
Experience: 2 years designing digital products.
Skills: Figma, interaction design, wireframes and prototyping.
Interviewed users and iterated a mobile learning flow after usability tests.
Collaborated with developers and product managers on delivery constraints.
Portfolio: documented research, prototypes and iterations for a learning app.
Education: Bachelor of Design.`,
  `Demo candidate — Reliability Engineer
Experience: 5 years operating cloud services.
Skills: Linux, Python, AWS, Kubernetes, Terraform, Prometheus and Grafana.
Automated service deployment and created incident runbooks.
Participated in an on-call rotation and wrote post-incident reviews.
Collaborated with backend engineers and reviewed infrastructure changes.
Maintained alerting dashboards and improved capacity visibility.
Education: BTech in Computer Science.`,
];
export const LONG_SAMPLE = `Senior Site Reliability Engineer · Atlas Cloud
Location: Remote within India.
Experience: 5+ years operating production services.
Own availability, latency and capacity for customer-facing services.
Manage Linux systems and diagnose operating system failures.
Troubleshoot DNS, TLS, load balancers and network connectivity.
Operate Kubernetes clusters and improve deployment safety.
Manage infrastructure as code with Terraform on AWS.
Automate repetitive operational tasks using Python or Bash.
Define service-level objectives and error-budget policies with product teams.
Build actionable monitoring with Prometheus and Grafana.
Improve logging and tracing for distributed services.
Participate in a shared on-call rotation and respond to incidents.
Write blameless post-incident reviews and track corrective actions.
Plan disaster recovery exercises and validate backup restoration.
Tune PostgreSQL performance and support high-availability database operations.
Design safe change rollouts using staged deployment and rollback plans.
Measure capacity trends and plan sustainable infrastructure costs.
Review access controls and rotate service credentials using established processes.
Collaborate with developers to identify reliability risks before releases.
Maintain runbooks that explain diagnosis and recovery steps.
Mentor engineers and explain technical tradeoffs in design reviews.
Work asynchronously and communicate progress and incidents clearly.
Required: production troubleshooting, automation and ownership of operational changes.
This is a full-time role. Compensation is not specified in this example.`;

// Synthetic work histories: these are demo evidence, never personal credentials.
export const RESUME_MATCH_LEVELS = ["strong", "partial", "career-change"];
export const SAMPLE_RESUME_VARIANTS = SAMPLE_RESUMES.map((partial, index) => ({
  strong: [
    "Fictional candidate — " +
      [
        "Full-Stack AI Engineer",
        "Junior Frontend Developer",
        "Senior Backend Engineer",
        "Data Analyst",
        "Product Manager",
        "DevOps Engineer",
        "UX Designer",
        "Site Reliability Engineer",
      ][index],
    "PROFILE: " +
      [
        "4 years",
        "1 year",
        "7 years",
        "3 years",
        "5 years",
        "4 years",
        "3 years",
        "6 years",
      ][index] +
      " of relevant professional experience",
    "WORK EXPERIENCE: Example employer | Product delivery team",
    [
      "Built a React and TypeScript support portal backed by Python REST APIs and PostgreSQL; reduced repeat support tickets by 18%.\nShipped a retrieval-augmented generation assistant with prompt versioning, a 120-case evaluation set and regression checks for unsupported answers.\nDeployed services on AWS with CloudWatch monitoring; profiled slow queries and reduced API p95 latency from 650 ms to 310 ms.\nPartnered with designers and product managers on ambiguous requirements, wrote integration tests and explained rollout tradeoffs in code reviews.",
      "Built accessible React interfaces with JavaScript, semantic HTML and CSS Grid from Figma designs; integrated REST APIs for a booking flow.\nWrote 34 component tests with React Testing Library covering validation, loading and error states.\nTested keyboard navigation, focus management and screen-reader labels against basic WCAG accessibility checks.\nFixed Safari flexbox and Firefox form layout issues; used Git pull requests and explained implementation choices to senior engineers and designers.\nPortfolio: responsive checkout and event registration projects with documented tests and review feedback.",
      "Owned Java and Spring Boot billing APIs, PostgreSQL schemas and asynchronous background jobs using RabbitMQ message queues.\nAdded retries, idempotency and circuit breakers; improved distributed-system resilience and reduced slow queries using execution plans.\nDeployed Docker services on AWS, built traces and dashboards for observability and joined the production on-call rotation.\nLed incident response and follow-up fixes; maintained JUnit and integration tests and mentored two engineers through architectural reviews.",
      "Used SQL joins, Python and Excel to analyze retail sales trends, customer retention and marketing campaign outcomes.\nBuilt Power BI dashboards with documented metric definitions and automated data-quality checks for missing and duplicate records.\nUsed basic statistics to compare campaign cohorts and communicated uncertainty and findings to marketing and operations teams.\nPublished clear written analysis notes and reusable SQL queries for weekly business reporting.",
      "Managed appointment-booking and patient communication software for five years; interviewed customers and wrote clear requirements and acceptance criteria.\nPrioritized competing stakeholder needs in a quarterly roadmap, working with design, engineering and compliance teams on releases.\nDefined booking completion and message response metrics; evaluated experiments before choosing roadmap changes.\nUsed research findings and adoption data to explain product decisions and resolve delivery tradeoffs with stakeholders.",
      "Operated AWS infrastructure for four years with Linux, networking, Bash scripting, IAM access controls and credential rotation.\nManaged Kubernetes clusters and Terraform infrastructure; built CI/CD pipelines with staged rollout and rollback checks.\nCreated Prometheus alerts and Grafana dashboards; responded to incidents and reduced deployment failures from 9% to 3%.\nWorked with developers to improve security and automate maintenance, including scheduled evening changes.",
      "Designed a mobile learning product for three years using Figma wireframes and interactive prototypes.\nPlanned 12 user interviews and repeated usability tests; used findings to simplify lesson navigation and iterate interaction design.\nMaintained a design system with accessible contrast, focus states and documented component patterns.\nWorked with product managers and developers on delivery constraints; portfolio case studies show research, prototypes, decisions and iterations.",
      "Owned availability, latency and capacity for AWS customer-facing services for six years; debugged Linux, DNS, TLS and load-balancer failures.\nOperated Kubernetes and Terraform, automated operational work in Python and Bash and used staged deployments with tested rollback plans.\nDefined service-level objectives and error-budget policies with product teams; built Prometheus and Grafana monitoring and distributed logging and tracing.\nJoined on-call incident response, wrote blameless post-incident reviews, updated runbooks and tracked corrective actions.\nRan disaster recovery and backup restoration exercises; tuned PostgreSQL and managed high-availability failover.\nPlanned capacity and infrastructure costs, reviewed access controls and rotated service credentials.\nMentored engineers, reviewed reliability risks with developers and communicated tradeoffs and incident progress asynchronously.",
    ][index],
    "EDUCATION: Relevant undergraduate degree. All names, work histories and metrics in this sample are fictional.",
  ].join("\n"),
  partial:
    partial
      .replace("Demo candidate", "Fictional candidate")
      .replace("Education:", "EDUCATION:") +
    "\nWork context: Example employer | Cross-functional product team. Fictional demonstration only.",
  "career-change": [
    "Fictional candidate — Transitioning to " +
      [
        "Full-Stack AI Engineer",
        "Junior Frontend Developer",
        "Senior Backend Engineer",
        "Data Analyst",
        "Product Manager",
        "DevOps Engineer",
        "UX Designer",
        "Site Reliability Engineer",
      ][index],
    "PROFILE: Early experience in an adjacent role",
    "WORK EXPERIENCE: Example employer | Associate",
    [
      "Built a JavaScript customer support dashboard and Node.js REST endpoints using SQLite. Wrote unit tests and collaborated with a product designer.",
      "Created HTML and CSS landing pages and a JavaScript shopping cart. Used Git for portfolio revisions and received design feedback.",
      "Maintained Python reporting APIs and MySQL queries. Wrote unit tests and supported routine releases with a senior engineer.",
      "Prepared Excel sales summaries, checked duplicate entries and presented weekly trends to a store operations team.",
      "Coordinated customer support releases, tracked delivery tasks and collected user feedback for engineering teams.",
      "Maintained Linux servers, wrote Bash backup scripts and supported manual deployments in an internal staging environment.",
      "Created branding assets and landing page mockups in Figma, incorporating feedback from marketing stakeholders.",
      "Supported Linux servers, maintained Bash scripts and escalated incidents using existing runbooks.",
    ][index],
    "EDUCATION: Undergraduate degree and independent portfolio projects. Fictional demonstration only.",
  ].join("\n"),
}));

// Three evidence histories per role/profile. Ordered rotation avoids immediate repeats.
export const RESUME_PROFILE_OPTIONS = [
  {
    value: "strong",
    label: "Strong match",
    description: "Relevant skills and project evidence",
  },
  {
    value: "partial",
    label: "Partial match",
    description: "Related experience with some gaps",
  },
  {
    value: "career-change",
    label: "Career change",
    description: "Transferable skills from another role",
  },
];
export const SAMPLE_RESUME_POOLS = SAMPLE_RESUME_VARIANTS.map(
  (profiles, role) =>
    Object.fromEntries(
      RESUME_MATCH_LEVELS.map((level) => {
        const base = profiles[level];
        const strongBullets = profiles.strong.split("\n").slice(3, -1);
        const baseLines = base.split("\n");
        const projects = [
          "customer onboarding",
          "subscription management",
          "operations reporting",
        ];
        const examples = [0, 1, 2].map((version) => {
          const lines = [...baseLines];
          if (version > 0 && level !== "strong") {
            // Add different demonstrated skills, so the comparison evidence changes too.
            lines.splice(
              3,
              0,
              strongBullets[(version - 1) % strongBullets.length],
            );
          }
          let body = lines.join("\n");
          body = body.replace(
            /Example employer/g,
            [
              "Fictional Cedar Works",
              "Fictional Harbor Products",
              "Fictional Orchard Systems",
            ][version],
          );
          body = body.replace(
            /support portal|booking flow|billing APIs|retail sales|appointment-booking|cloud infrastructure|mobile learning product|customer-facing services/g,
            (match) =>
              version === 0
                ? match
                : match +
                  " for a " +
                  ["", "subscription platform", "operations platform"][version],
          );
          body = body.replace(
            /18%|34 component|120-case|650 ms|310 ms|12 user|9%|3%/g,
            (match) =>
              version === 0
                ? match
                : {
                    "18%": version === 1 ? "22%" : "15%",
                    "34 component":
                      version === 1 ? "28 component" : "41 component",
                    "120-case": version === 1 ? "90-case" : "160-case",
                    "650 ms": version === 1 ? "720 ms" : "580 ms",
                    "310 ms": version === 1 ? "340 ms" : "260 ms",
                    "12 user": version === 1 ? "9 user" : "15 user",
                    "9%": version === 1 ? "8%" : "11%",
                    "3%": version === 1 ? "2%" : "4%",
                  }[match],
          );
          return (
            body +
            "\nPROJECT CONTEXT: " +
            projects[version] +
            "; worked with a designer and operations stakeholders on a documented delivery cycle.\nDEMO EXAMPLE: " +
            (version + 1) +
            " of 3; fictional history for comparison practice."
          );
        });
        return [level, examples];
      }),
    ),
);
export function selectSampleResume(role, profile, sequence = 0) {
  const pool = SAMPLE_RESUME_POOLS[role]?.[profile];
  if (!pool || !Number.isInteger(sequence) || sequence < 0)
    throw new Error("Invalid sample resume selection.");
  const index = sequence % pool.length;
  return { text: pool[index], example: index + 1, total: pool.length };
}
