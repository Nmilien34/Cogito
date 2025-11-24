import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const RUTH_EMAIL = "ruth@cogito.local";
const CAREGIVER_EMAIL = "caregiver@cogito.local";

async function main() {
  const residentPassword = await bcrypt.hash(process.env.RESIDENT_PASSWORD ?? "RuthPassword!123", 10);
  const caregiverPassword = await bcrypt.hash(process.env.CAREGIVER_PASSWORD ?? "Caregiver!123", 10);

  const ruthUser = await prisma.user.upsert({
    where: { email: RUTH_EMAIL },
    update: {},
    create: {
      name: "Ruth",
      email: RUTH_EMAIL,
      role: "RESIDENT",
      homeFacility: "Chestnut Nursing Home, New Jersey",
      passwordHash: residentPassword,
    },
  });

  const caregiverUser = await prisma.user.upsert({
    where: { email: CAREGIVER_EMAIL },
    update: {},
    create: {
      name: "Care Team",
      email: CAREGIVER_EMAIL,
      role: "CAREGIVER",
      homeFacility: "Chestnut Nursing Home, New Jersey",
      passwordHash: caregiverPassword,
    },
  });

  const profile = await prisma.profile.upsert({
    where: { userId: ruthUser.id },
    update: {},
    create: {
      id: "ruth-profile",
      userId: ruthUser.id,
      age: 85,
      residence: "Chestnut Nursing Home, New Jersey",
      conditions: { primary: "Alzheimer's disease" },
      wakeTime: buildTodayTime(8, 30),
      bedTime: buildTodayTime(21, 0),
      meals: {
        breakfast: "09:00",
        lunch: "12:00",
        dinner: "17:30",
      },
      favoriteGenres: ["Gospel", "Classical"],
      favoriteSongs: [
        { title: "Never Would Have Made It", artist: "Marvin Sapp" },
        { title: "Walking", artist: "Mary Mary" },
      ],
    },
  });

  await prisma.medication.deleteMany({ where: { profileId: profile.id } });

  const medications = await prisma.$transaction([
    prisma.medication.create({
      data: {
        profileId: profile.id,
        name: "Donepezil",
        dosage: "5mg",
        instructions: "Take with water after breakfast.",
        preferredTime: buildTodayTime(9, 0),
        notes: "Guideline recommends evening dosing; review with clinician.",
      },
    }),
    prisma.medication.create({
      data: {
        profileId: profile.id,
        name: "Simvastatin",
        dosage: "10mg",
        instructions: "Daily cholesterol medication.",
      },
    }),
    prisma.medication.create({
      data: {
        profileId: profile.id,
        name: "Lisinopril",
        dosage: "5mg",
        instructions: "Daily blood pressure medication; first dose at bedtime.",
      },
    }),
    prisma.medication.create({
      data: {
        profileId: profile.id,
        name: "Amlodipine",
        dosage: "5mg",
        instructions: "Daily blood pressure medication.",
      },
    }),
    prisma.medication.create({
      data: {
        profileId: profile.id,
        name: "Metformin",
        dosage: "500mg",
        instructions: "Take with meals.",
        takeWithFood: true,
      },
    }),
  ]);

  await prisma.reminder.deleteMany({ where: { profileId: profile.id } });

  const [donepezil, simvastatin] = medications;

  await prisma.reminder.createMany({
    data: [
      {
        profileId: profile.id,
        medicationId: donepezil.id,
        label: "Take Donepezil",
        scheduledAt: buildTodayTime(9, 0),
        recurrence: "DAILY",
        snoozeMinutes: 10,
      },
      {
        profileId: profile.id,
        medicationId: simvastatin.id,
        label: "Take Simvastatin",
        scheduledAt: buildTodayTime(21, 0),
        recurrence: "DAILY",
        snoozeMinutes: 10,
      },
    ],
  });

  await prisma.playlistItem.deleteMany({ where: { profileId: profile.id } });
  await prisma.playlistItem.createMany({
    data: [
      {
        profileId: profile.id,
        title: "Never Would Have Made It",
        artist: "Marvin Sapp",
        query: "Marvin Sapp Never Would Have Made It official audio",
        provider: "YouTube",
      },
      {
        profileId: profile.id,
        title: "Best in Me",
        artist: "Marvin Sapp",
        query: "Marvin Sapp Best In Me",
        provider: "YouTube",
      },
      {
        profileId: profile.id,
        title: "Walking",
        artist: "Mary Mary",
        query: "Mary Mary Walking official video",
        provider: "YouTube",
      },
      {
        profileId: profile.id,
        title: "Symphony No. 9 (Choral)",
        artist: "Ludwig van Beethoven",
        query: "Beethoven Symphony No. 9 Choral",
        provider: "YouTube",
      },
    ],
  });

  console.log("Seed data created", { ruthUser: ruthUser.email, caregiverUser: caregiverUser.email });
}

function buildTodayTime(hours: number, minutes: number) {
  const now = new Date();
  now.setHours(hours, minutes, 0, 0);
  return now;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

