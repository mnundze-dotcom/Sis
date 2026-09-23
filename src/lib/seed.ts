import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { disputes, records, reports, sessions, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { PLATFORMS } from "@/lib/domain";

export const DEMO_ADMIN_EMAIL = (process.env.SIS_ADMIN_EMAIL ?? "moderator@sis.local").trim().toLowerCase();
export const DEMO_ADMIN_PASSWORD = process.env.SIS_ADMIN_PASSWORD ?? "SisModerator#2026";
export const usingDemoAdmin = !process.env.SIS_ADMIN_PASSWORD;

const g = globalThis as typeof globalThis & { __sisSeed?: Promise<void>; __sisHousekeepingAt?: number };

/** Idempotent: creates the moderator account and clearly-labelled sample data on first run. */
export function ensureSeed(): Promise<void> {
  let pending = g.__sisSeed;
  if (!pending) {
    pending = seed().catch((err: unknown) => {
      console.error("[sis] seed failed", err);
      g.__sisSeed = undefined;
    });
    g.__sisSeed = pending;
  }
  void housekeeping();
  return pending;
}

/** Retention rules promised in the Community Guidelines. */
async function housekeeping() {
  const now = Date.now();
  if (g.__sisHousekeepingAt && now - g.__sisHousekeepingAt < 6 * 3_600_000) return;
  g.__sisHousekeepingAt = now;
  try {
    await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
    await db
      .delete(reports)
      .where(and(eq(reports.status, "rejected"), lt(reports.reviewedAt, new Date(now - 90 * 86_400_000))));
  } catch (err) {
    console.error("[sis] housekeeping failed", err);
  }
}

type SampleRecord = {
  plate: string;
  displayName: string;
  driverDescription: string;
  category: string;
  riskLevel: string;
  verification: string;
  status: string;
  province: string;
  vehicleMake: string;
  vehicleColour: string;
  summary: string;
  sapsCaseNumber: string | null;
  reportCount: number;
};

const SAMPLES: { record: SampleRecord; reports: { daysAgo: number; area: string; description: string }[] }[] = [
  {
    record: {
      plate: "CA123456",
      displayName: "Unknown driver",
      driverDescription: "Male, approx. 35–45, heavy build, short greying beard. Often wears a navy cap.",
      category: "sexual_offence",
      riskLevel: "critical",
      verification: "verified",
      status: "active",
      province: "Western Cape",
      vehicleMake: "Toyota Corolla Quest",
      vehicleColour: "White",
      summary:
        "Three women independently reported unwanted sexual touching and comments during e-hailing trips between Bellville and Durbanville. A SAPS case has been opened and the case reference was reviewed by Sis moderators.",
      sapsCaseNumber: "CAS 214/03/2026 · Bellville",
      reportCount: 3,
    },
    reports: [
      { daysAgo: 74, area: "Bellville", description: "Driver repeatedly touched my knee and made sexual comments on a trip from Bellville station. I asked to be dropped at a garage." },
      { daysAgo: 45, area: "Durbanville", description: "He locked the doors and tried to kiss me when we arrived. I pushed him away and got out, then opened a case at Bellville SAPS." },
      { daysAgo: 16, area: "Bellville CBD", description: "Driver asked if I had a boyfriend, then put his hand on my thigh twice. Same white Corolla Quest and navy cap." },
    ],
  },
  {
    record: {
      plate: "BC12DFGP",
      displayName: "“Tshepo” (name shown on app)",
      driverDescription: "Male, mid-20s, slim build, short braids.",
      category: "harassment",
      riskLevel: "high",
      verification: "community",
      status: "disputed",
      province: "Gauteng",
      vehicleMake: "Suzuki Swift",
      vehicleColour: "Silver",
      summary:
        "Two members reported the driver deviating from the route, locking the doors and refusing to stop when asked. Both women got out safely at a filling station in Midrand.",
      sapsCaseNumber: null,
      reportCount: 2,
    },
    reports: [
      { daysAgo: 38, area: "Midrand", description: "Driver switched off the app route, locked the doors and ignored me when I asked him to stop. I got out at a filling station." },
      { daysAgo: 9, area: "Midrand", description: "Same silver Swift. He kept driving past my stop and only let me out when I threatened to call the police." },
    ],
  },
  {
    record: {
      plate: "ND456789",
      displayName: "Unknown driver",
      driverDescription: "Male, approx. 30, tall, tattoo on left forearm.",
      category: "gbv",
      riskLevel: "high",
      verification: "verified",
      status: "active",
      province: "KwaZulu-Natal",
      vehicleMake: "Nissan NP200",
      vehicleColour: "Blue",
      summary:
        "The driver is subject to an interim protection order obtained by a former passenger after repeated threatening calls and messages following a trip. Moderators reviewed the order.",
      sapsCaseNumber: "Protection order · Durban Magistrate's Court",
      reportCount: 1,
    },
    reports: [
      { daysAgo: 27, area: "Durban North", description: "After a trip he kept my number and sent threatening messages for weeks. I obtained a protection order." },
    ],
  },
  {
    record: {
      plate: "FXR204EC",
      displayName: "Johan Voorbeeld",
      driverDescription: "Male, approx. 40, medium build, clean-shaven.",
      category: "robbery",
      riskLevel: "critical",
      verification: "verified",
      status: "active",
      province: "Eastern Cape",
      vehicleMake: "VW Polo Vivo",
      vehicleColour: "Red",
      summary:
        "A passenger was robbed of her phone and bank cards at knifepoint near Walmer after a late-night pickup. The SAPS case reference was supplied and confirmed by moderators.",
      sapsCaseNumber: "CAS 88/02/2026 · Walmer",
      reportCount: 1,
    },
    reports: [
      { daysAgo: 52, area: "Walmer, Gqeberha", description: "He stopped in a dark street, pulled a knife and took my phone and cards. I reported it at Walmer SAPS." },
    ],
  },
];

async function seed() {
  const [admin] = await db.select({ id: users.id }).from(users).where(eq(users.email, DEMO_ADMIN_EMAIL)).limit(1);
  if (!admin) {
    await db
      .insert(users)
      .values({
        email: DEMO_ADMIN_EMAIL,
        displayName: "Sis Moderation",
        passwordHash: await hashPassword(DEMO_ADMIN_PASSWORD),
        role: "admin",
        guidelinesAcceptedAt: new Date(),
      })
      .onConflictDoNothing({ target: users.email });
  }

  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(records);
  if (n > 0) return;

  const ago = (days: number) => new Date(Date.now() - days * 86_400_000);
  const isoAgo = (days: number) => ago(days).toISOString().slice(0, 10);
  const ehailing = PLATFORMS[0];

  for (const sample of SAMPLES) {
    const days = sample.reports.map((r) => r.daysAgo);
    const [rec] = await db
      .insert(records)
      .values({ ...sample.record, isSample: true, createdAt: ago(Math.max(...days)), updatedAt: ago(Math.min(...days) - 1) })
      .onConflictDoNothing({ target: records.plate })
      .returning({ id: records.id });
    if (!rec) continue;
    for (const r of sample.reports) {
      await db.insert(reports).values({
        plate: sample.record.plate,
        recordId: rec.id,
        category: sample.record.category,
        platform: ehailing,
        province: sample.record.province,
        vehicleMake: sample.record.vehicleMake,
        vehicleColour: sample.record.vehicleColour,
        incidentDate: isoAgo(r.daysAgo),
        incidentArea: r.area,
        description: r.description,
        status: "approved",
        reviewedAt: ago(Math.max(0, r.daysAgo - 1)),
        isSample: true,
        createdAt: ago(r.daysAgo),
      });
    }
  }

  await db.insert(reports).values([
    {
      plate: "HXZ519GP",
      category: "harassment",
      platform: ehailing,
      driverDescription: "Male, late 30s, glasses, soft-spoken.",
      vehicleMake: "Toyota Etios",
      vehicleColour: "Grey",
      province: "Gauteng",
      incidentDate: isoAgo(2),
      incidentArea: "Sandton",
      description:
        "The driver kept asking where I live and whether I stay alone. After drop-off he parked and followed me on foot to the entrance of my building. Security at the gate intervened.",
      status: "pending",
      isSample: true,
      createdAt: ago(1),
    },
    {
      plate: "CA123456",
      category: "sexual_offence",
      platform: ehailing,
      vehicleMake: "Toyota Corolla Quest",
      vehicleColour: "White",
      province: "Western Cape",
      incidentDate: isoAgo(1),
      incidentArea: "Parow",
      description:
        "Driver made sexual comments about my body and put his hand on my thigh at a red light on Voortrekker Road. I got out at the next stop and reported it in the app.",
      status: "pending",
      isSample: true,
      createdAt: ago(0.2),
    },
  ]);

  const [disputed] = await db.select({ id: records.id }).from(records).where(eq(records.plate, "BC12DFGP")).limit(1);
  if (disputed) {
    await db.insert(disputes).values({
      recordId: disputed.id,
      name: "R. Naidoo (sample)",
      email: "owner@example.com",
      relationship: "owner",
      reason: "vehicle_sold",
      details:
        "I sold this Suzuki Swift in February and the incidents happened after the sale date. I can send the NaTIS change-of-ownership form.",
      createdAt: ago(3),
    });
  }
}
