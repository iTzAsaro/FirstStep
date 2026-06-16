// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     seed.ts                                                 ║
// ║ Módulo:      scripts/                                                ║
// ║ Descripción: Seed de datos de prueba para FirstStep.                 ║
// ║              Crea empresas, talentos, ofertas y postulaciones.       ║
// ║                                                                      ║
// ║ Uso:                                                                 ║
// ║   cd scripts                                                         ║
// ║   npm install                                                        ║
// ║   npx ts-node seed.ts                      # usa .env.local          ║
// ║   DATABASE_URL=<url> npx ts-node seed.ts   # url explícita           ║
// ║   npx ts-node seed.ts --clean              # limpia antes de insertar║
// ╚══════════════════════════════════════════════════════════════════════╝

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dns from "node:dns";
import postgres from "postgres";
import bcrypt from "bcryptjs";

dns.setDefaultResultOrder("ipv4first");

const __filename = typeof __filename !== "undefined" ? __filename : fileURLToPath(import.meta?.url ?? "");
const __dirname  = typeof __dirname  !== "undefined" ? __dirname  : path.dirname(__filename);

// ── Config ──────────────────────────────────────────────────────────────
const CLEAN  = process.argv.includes("--clean");
const ROUNDS = 8; // bcrypt rounds (bajos para que el seed sea rápido)

const COMPANIES = 6;
const TALENTS   = 20;
const JOBS_PER_COMPANY     = 4;
const APPLICATIONS_PER_JOB = 3; // cuántos talentos postulan a cada oferta

// ── Cargar .env.local desde la raíz del proyecto ────────────────────────
function loadEnvFile() {
  const candidates = [
    path.resolve(__dirname, "../.env.local"),
    path.resolve(__dirname, "../.env"),
  ];
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const l = line.trim();
      if (!l || l.startsWith("#")) continue;
      const idx = l.indexOf("=");
      if (idx <= 0) continue;
      const key = l.slice(0, idx).trim();
      let val = l.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
    console.log(`✔ Cargado ${p}`);
    break;
  }
}

loadEnvFile();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌  Falta DATABASE_URL. Agrega .env.local o exporta la variable.");
  process.exit(1);
}

// ── Datos ficticios ──────────────────────────────────────────────────────
const COMPANY_DATA = [
  { name: "NovaTech SpA",        industry: "Software",           size: "11-50",   location: "Santiago, Chile",  domain: "novatech.cl" },
  { name: "DataSphere Ltda",     industry: "Análisis de Datos",  size: "51-200",  location: "Valparaíso, Chile",domain: "datasphere.io" },
  { name: "CloudMind",           industry: "Cloud Computing",    size: "201-500", location: "Santiago, Chile",  domain: "cloudmind.com" },
  { name: "GreenCode",           industry: "Sustentabilidad",    size: "1-10",    location: "Concepción, Chile",domain: "greencode.dev" },
  { name: "FinPulse",            industry: "Fintech",            size: "51-200",  location: "Santiago, Chile",  domain: "finpulse.cl" },
  { name: "MedAI Solutions",     industry: "Salud Digital",      size: "11-50",   location: "Santiago, Chile",  domain: "medai.cl" },
];

const JOB_TEMPLATES = [
  {
    title: "Desarrollador Frontend Junior",
    description: "Buscamos un desarrollador Frontend con ganas de aprender y crecer en un equipo ágil. Trabajarás con React, TypeScript y Tailwind CSS en productos reales.",
    requirements: "Conocimientos de React y JavaScript.\nExperiencia con CSS y diseño responsive.\nGanas de aprender y trabajar en equipo.",
    benefits: "Trabajo remoto 100%.\nFlexibilidad horaria.\nMacBook Pro.",
    employmentType: "full_time" as const,
    seniority: "junior" as const,
    salaryMin: 800_000, salaryMax: 1_200_000,
  },
  {
    title: "Analista de Datos",
    description: "Únete al equipo de datos para transformar información en decisiones estratégicas. Usarás Python, SQL y herramientas de visualización.",
    requirements: "Python (pandas, numpy).\nSQL intermedio.\nConocimiento de Power BI o Tableau.",
    benefits: "Bono de desempeño trimestral.\nCapacitaciones pagadas.\nSeguro médico complementario.",
    employmentType: "full_time" as const,
    seniority: "mid" as const,
    salaryMin: 1_200_000, salaryMax: 1_800_000,
  },
  {
    title: "Diseñador UX/UI",
    description: "Diseña experiencias que impactan a miles de usuarios. Tendrás ownership del flujo completo: investigación, wireframes, prototipos y hand-off.",
    requirements: "Figma avanzado.\nPortafolio con casos de estudio.\nExperiencia en pruebas de usabilidad.",
    benefits: "Stock options.\nPresupuesto mensual de herramientas.\nRetiro anual de equipo.",
    employmentType: "full_time" as const,
    seniority: "mid" as const,
    salaryMin: 1_000_000, salaryMax: 1_600_000,
  },
  {
    title: "Practicante de Ingeniería de Software",
    description: "Práctica profesional en un entorno real. Participarás en sprints, code reviews y entregas a producción desde el primer día.",
    requirements: "Estar cursando 3er año o superior.\nConocimientos básicos de algún lenguaje de programación.\nDisponibilidad mínima de 30 hrs semanales.",
    benefits: "Mensualidad competitiva.\nMentoría personalizada.\nPosibilidad de contrato al término.",
    employmentType: "internship" as const,
    seniority: "junior" as const,
    salaryMin: 300_000, salaryMax: 500_000,
  },
  {
    title: "Ingeniero Backend Senior",
    description: "Lidera el diseño e implementación de microservicios de alto rendimiento. Mentorizarás al equipo junior y participarás en decisiones de arquitectura.",
    requirements: "Node.js o Python avanzado.\n5+ años de experiencia.\nExperiencia con PostgreSQL y Redis.\nConocimiento de AWS o GCP.",
    benefits: "Salario en USD.\nRemoto full.\n5 semanas de vacaciones.",
    employmentType: "full_time" as const,
    seniority: "senior" as const,
    salaryMin: 3_000_000, salaryMax: 4_500_000,
  },
  {
    title: "DevOps / SRE",
    description: "Construye y mantiene la infraestructura que soporta millones de requests. Automatización, observabilidad y resiliencia son tus palabras clave.",
    requirements: "Kubernetes y Docker.\nTerraform o Pulumi.\nExperiencia con CI/CD (GitHub Actions, GitLab CI).",
    benefits: "Budget de certificaciones.\nHome office setup.\nEquipo de última generación.",
    employmentType: "contract" as const,
    seniority: "senior" as const,
    salaryMin: 2_500_000, salaryMax: 3_800_000,
  },
];

const FIRST_NAMES = ["Camila","Sebastián","Valentina","Matías","Catalina","Diego","Fernanda","Rodrigo","Andrea","Felipe","Javiera","Nicolás","Paula","Gonzalo","Isidora","Tomás","Sofía","Ignacio","Carla","Pablo"];
const LAST_NAMES  = ["González","Muñoz","Rojas","Díaz","Pérez","Soto","Contreras","Silva","Martínez","Sepúlveda","Morales","Torres","Flores","Rivera","López","Castillo","Reyes","Herrera","Medina","Ramos"];

const INTERESTS_POOL = [
  "desarrollo-frontend","analisis-de-datos","ciberseguridad",
  "diseno-ux-ui","gestion-de-producto","marketing-digital",
  "machine-learning","arquitectura-cloud",
];

const UNIVERSITIES = ["Universidad de Chile","Pontificia Universidad Católica de Chile","Universidad de Santiago","Universidad Adolfo Ibáñez","Universidad Diego Portales","DUOC UC","INACAP"];
const DEGREES      = ["Ingeniería Civil en Computación","Ingeniería en Informática","Diseño Gráfico","Ingeniería Comercial","Ingeniería en Telecomunicaciones","Análisis de Sistemas"];
const CITIES       = ["Santiago","Valparaíso","Concepción","La Serena","Antofagasta","Temuco","Rancagua"];

const COVER_LETTERS = [
  "Estoy muy interesado en esta posición ya que se alinea perfectamente con mis objetivos de carrera y mi formación académica. Tengo experiencia en los principales tecnologías requeridas y estoy ansioso por contribuir al equipo.",
  "Creo firmemente que mi perfil encaja con lo que busca la empresa. He trabajado en proyectos similares y me apasiona resolver los desafíos que implica este rol.",
  "Esta oportunidad me entusiasma mucho. He estado desarrollando mis habilidades en esta área durante los últimos años y me encantaría aplicarlas en un entorno como el de su empresa.",
  "Me llama mucho la atención la cultura de la empresa y los proyectos en los que trabajan. Soy alguien que aprende rápido y me adapto bien a nuevos entornos.",
  null, // algunos sin carta
];

// ── Helpers ──────────────────────────────────────────────────────────────
const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)] as T;
const pickN = <T>(arr: T[], n: number): T[] => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
const rInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function slug(name: string, idx: number) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "") + idx;
}

// ── Main ─────────────────────────────────────────────────────────────────
async function main() {
  const ssl = DATABASE_URL!.includes("localhost") || DATABASE_URL!.includes("127.0.0.1")
    ? false
    : ("require" as const);

  const sql = postgres(DATABASE_URL!, { ssl });

  try {
    // ── Limpieza opcional ──────────────────────────────────────────────
    if (CLEAN) {
      console.log("\n🧹  Limpiando datos de prueba previos...");
      await sql.unsafe(`
        DELETE FROM users
        WHERE email LIKE '%@seed.firststep.dev'
      `);
      console.log("   ✔ Datos seed eliminados.");
    }

    const passwordHash = await bcrypt.hash("Password123!", ROUNDS);
    const now = new Date().toISOString();

    // ── 1. Crear empresas ──────────────────────────────────────────────
    console.log(`\n🏢  Creando ${COMPANIES} empresas...`);
    const companyIds: number[] = [];

    for (let i = 0; i < COMPANIES; i++) {
      const c = COMPANY_DATA[i % COMPANY_DATA.length]!;
      const email = `empresa${i + 1}@seed.firststep.dev`;

      const [user] = await sql.unsafe(
        `INSERT INTO users (email, role, password_hash, accepted_terms_at, accepted_privacy_at)
         VALUES ($1, 'empresa', $2, $3, $3)
         ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
         RETURNING id`,
        [email, passwordHash, now],
      ) as any[];

      await sql.unsafe(
        `INSERT INTO company_profiles
           (user_id, company_name, legal_name, industry, company_size, location, contact_email, website, verification_status, description)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'verified',$9)
         ON CONFLICT (user_id) DO UPDATE
           SET company_name=EXCLUDED.company_name,
               industry=EXCLUDED.industry,
               updated_at=NOW()`,
        [
          user.id,
          c.name,
          c.name + " S.A.",
          c.industry,
          c.size,
          c.location,
          `contacto@${c.domain}`,
          `https://www.${c.domain}`,
          `${c.name} es una empresa líder en ${c.industry} con sede en ${c.location}. Trabajamos con tecnología de punta y un equipo apasionado por construir soluciones que impactan a las personas.`,
        ],
      );

      companyIds.push(user.id);
      process.stdout.write(`   ✔ ${c.name} (id=${user.id})\n`);
    }

    // ── 2. Crear talentos ──────────────────────────────────────────────
    console.log(`\n👤  Creando ${TALENTS} talentos...`);
    const talentIds: number[] = [];

    for (let i = 0; i < TALENTS; i++) {
      const firstName = FIRST_NAMES[i % FIRST_NAMES.length]!;
      const lastName  = LAST_NAMES[i % LAST_NAMES.length]!;
      const email     = `${slug(firstName + lastName, i + 1)}@seed.firststep.dev`;
      const gradYear  = rInt(2018, 2025);
      const interests = pickN(INTERESTS_POOL, rInt(2, 4));

      const [user] = await sql.unsafe(
        `INSERT INTO users (email, role, password_hash, accepted_terms_at, accepted_privacy_at)
         VALUES ($1, 'talento', $2, $3, $3)
         ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
         RETURNING id`,
        [email, passwordHash, now],
      ) as any[];

      await sql.unsafe(
        `INSERT INTO talent_profiles
           (user_id, full_name, headline, location, university, degree, grad_year, career_interests, linkedin, github)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (user_id) DO UPDATE
           SET full_name=EXCLUDED.full_name,
               headline=EXCLUDED.headline,
               updated_at=NOW()`,
        [
          user.id,
          `${firstName} ${lastName}`,
          `${pick(DEGREES)} · Buscando oportunidades en ${pick(interests.map(s => s.replace(/-/g," ")))}`,
          pick(CITIES) + ", Chile",
          pick(UNIVERSITIES),
          pick(DEGREES),
          gradYear,
          interests,
          `https://linkedin.com/in/${slug(firstName+lastName, i+1)}`,
          Math.random() > 0.4 ? `https://github.com/${slug(firstName, i+1)}` : null,
        ],
      );

      talentIds.push(user.id);
      process.stdout.write(`   ✔ ${firstName} ${lastName} (id=${user.id})\n`);
    }

    // ── 3. Crear ofertas de trabajo ────────────────────────────────────
    console.log(`\n💼  Creando ofertas (${JOBS_PER_COMPANY} por empresa)...`);
    const jobIds: number[] = [];

    for (const companyId of companyIds) {
      const templates = pickN(JOB_TEMPLATES, JOBS_PER_COMPANY);
      for (const tmpl of templates) {
        const deadline = new Date(Date.now() + rInt(15, 60) * 86400 * 1000).toISOString();
        const [job] = await sql.unsafe(
          `INSERT INTO jobs
             (company_user_id, title, description, requirements, benefits,
              location, employment_type, seniority, salary_min, salary_max,
              application_deadline, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'active')
           RETURNING id`,
          [
            companyId,
            tmpl.title,
            tmpl.description,
            tmpl.requirements,
            tmpl.benefits,
            pick(CITIES) + ", Chile",
            tmpl.employmentType,
            tmpl.seniority,
            tmpl.salaryMin,
            tmpl.salaryMax,
            deadline,
          ],
        ) as any[];
        jobIds.push(job.id);
      }
    }
    console.log(`   ✔ ${jobIds.length} ofertas creadas.`);

    // ── 4. Crear postulaciones ─────────────────────────────────────────
    console.log(`\n📨  Creando postulaciones (~${APPLICATIONS_PER_JOB} por oferta)...`);
    let appCount = 0;
    const statuses = ["submitted","submitted","submitted","accepted","rejected"] as string[];

    for (const jobId of jobIds) {
      const applicants = pickN(talentIds, Math.min(APPLICATIONS_PER_JOB, talentIds.length));
      for (const talentId of applicants) {
        try {
          await sql.unsafe(
            `INSERT INTO job_applications (job_id, talent_user_id, cover_letter, status)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (job_id, talent_user_id) DO NOTHING`,
            [jobId, talentId, pick(COVER_LETTERS), pick(statuses)],
          );
          appCount++;
        } catch {
          // ignorar conflictos de unicidad
        }
      }
    }
    console.log(`   ✔ ${appCount} postulaciones creadas.`);

    // ── 5. Crear sesiones IA ───────────────────────────────────────────
    console.log(`\n🤖  Creando sesiones IA de muestra...`);
    const sessionKinds = ["general","interview"] as string[];
    const models = ["llama3.2","mistral","gemma2"];
    let sessionCount = 0;

    for (const talentId of talentIds.slice(0, 10)) {
      const n = rInt(1, 3);
      for (let s = 0; s < n; s++) {
        const kind = pick(sessionKinds);
        const [session] = await sql.unsafe(
          `INSERT INTO ai_sessions (user_id, kind, title, model, interview_role, interview_type, interview_difficulty)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           RETURNING id`,
          [
            talentId,
            kind as string,
            kind === "interview" ? `Simulación: ${pick(["Desarrollador Frontend","Data Analyst","UX Designer"])}` : "Chat de orientación profesional",
            pick(models),
            kind === "interview" ? pick(["Desarrollador Frontend","Analista de Datos","Diseñador UX"]) : null,
            kind === "interview" ? pick(["técnica","rrhh","mixta"]) : null,
            kind === "interview" ? pick(["junior","mid","senior"]) : null,
          ],
        ) as any[];

        await sql.unsafe(
          `INSERT INTO ai_messages (session_id, role, content) VALUES
           ($1,'user',$2),
           ($1,'assistant',$3)`,
          [
            session.id,
            "¿Puedes ayudarme a prepararme para mi próxima entrevista?",
            "¡Por supuesto! Cuéntame más sobre el rol al que estás aplicando y te haré preguntas de práctica personalizadas.",
          ],
        );
        sessionCount++;
      }
    }
    console.log(`   ✔ ${sessionCount} sesiones IA creadas.`);

    // ── Resumen ────────────────────────────────────────────────────────
    console.log(`
╔══════════════════════════════════════════════╗
║           SEED COMPLETADO ✅                  ║
╠══════════════════════════════════════════════╣
║  Empresas:      ${String(companyIds.length).padEnd(28)}║
║  Talentos:      ${String(talentIds.length).padEnd(28)}║
║  Ofertas:       ${String(jobIds.length).padEnd(28)}║
║  Postulaciones: ${String(appCount).padEnd(28)}║
║  Sesiones IA:   ${String(sessionCount).padEnd(28)}║
╠══════════════════════════════════════════════╣
║  Contraseña de todos: Password123!           ║
║  Emails empresa:  empresa1@seed.firststep.dev║
║  Emails talento:  <nombre>N@seed.firststep... ║
╚══════════════════════════════════════════════╝
`);

  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error("❌ Error en seed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
