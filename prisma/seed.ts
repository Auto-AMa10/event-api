import "dotenv/config";
import { PrismaClient, TransactionStatus } from "../src/generated/prisma/index.js";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Clean up existing data ───────────────────────────────────────────────
  await prisma.review.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.event.deleteMany();
  await prisma.pointHistory.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // ─── Passwords ────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("Password123!", 10);

  // ─── Users ────────────────────────────────────────────────────────────────
  const organizer1 = await prisma.user.create({
    data: {
      email: "organizer@loket.dev",
      password: hashedPassword,
      name: "Budi Santoso",
      role: "ORGANIZER" as const,
      referralCode: "BUDSNT",
      pointsBalance: 0,
    },
  });

  const organizer2 = await prisma.user.create({
    data: {
      email: "organizer2@loket.dev",
      password: hashedPassword,
      name: "Dewi Rahayu",
      role: "ORGANIZER" as const,
      referralCode: "DEWRHY",
      pointsBalance: 0,
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      email: "customerservice@loket.Digital",
      password: hashedPassword,
      name: "Andi Wijaya",
      role: "CUSTOMER" as const,
      referralCode: "ANDWJY",
      pointsBalance: 30000,
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: "customerservice2@loket.Digital",
      password: hashedPassword,
      name: "Siti Nurhaliza",
      role: "CUSTOMER" as const,
      referralCode: "STINUR",
      pointsBalance: 10000,
      referredById: customer1.id,
    },
  });

  console.log("✅ Users seeded");

  // ─── Point History ─────────────────────────────────────────────────────────
  const threeMonthsLater = new Date();
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

  await prisma.pointHistory.createMany({
    data: [
      {
        userId: customer1.id,
        amount: 10000,
        type: "REFERRAL_BONUS",
        expiredAt: threeMonthsLater,
      },
      {
        userId: customer2.id,
        amount: 10000,
        type: "REFERRAL_BONUS",
        expiredAt: threeMonthsLater,
      },
      {
        userId: customer1.id,
        amount: 10000,
        type: "REFERRAL_BONUS",
        expiredAt: threeMonthsLater,
      },
    ],
  });

  console.log("✅ Point history seeded");

  // ─── Events ──────────────────────────────────────────────────────────────
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const twoMonths = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const event1 = await prisma.event.create({
    data: {
      organizer: { connect: { id: organizer1.id } },
      title: "Tech Summit Jakarta 2026",
      slug: "tech-summit-jakarta-2026",
      description:
        "Konferensi teknologi terbesar di Indonesia! Bergabunglah dengan ribuan developer, startup founder, dan tech enthusiast. Hadirkan pembicara kelas dunia dari Google, Microsoft, dan perusahaan teknologi terkemuka. Jangan lewatkan workshop eksklusif, networking session, dan pameran produk terbaru.",
      price: 500000,
      startDate: nextWeek,
      endDate: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000),
      location: "Jakarta Convention Center, Jakarta",
      category: { connectOrCreate: { where: { name: "Technology" }, create: { name: "Technology", slug: "technology" } } },
      availableSeats: 450,
      totalSeats: 500,
    },
  });

  const event2 = await prisma.event.create({
    data: {
      organizer: { connect: { id: organizer1.id } },
      title: "Soundrenaline Music Festival",
      slug: "soundrenaline-music-festival",
      description:
        "Festival musik terbesar di Asia Tenggara kembali hadir! Nikmati penampilan dari 50+ artis lokal dan internasional selama 3 hari penuh. Genre: Rock, Pop, Electronic, Jazz. Tersedia VIP area, food court premium, dan merchandise eksklusif.",
      price: 350000,
      startDate: nextMonth,
      endDate: new Date(nextMonth.getTime() + 3 * 24 * 60 * 60 * 1000),
      location: "GBK Senayan, Jakarta",
      category: { connectOrCreate: { where: { name: "Music" }, create: { name: "Music", slug: "music" } } },
      availableSeats: 7500,
      totalSeats: 8000,
    },
  });

  const event3 = await prisma.event.create({
    data: {
      organizer: { connect: { id: organizer2.id } },
      title: "Bali International Business Forum",
      slug: "bali-international-business-forum",
      description:
        "Forum bisnis internasional yang menghubungkan pengusaha dari seluruh dunia. Topik utama: Sustainable Business, Digital Transformation, dan ASEAN Market Opportunities. Networking dinner eksklusif dengan 200+ CEO dan investor.",
      price: 1500000,
      startDate: twoMonths,
      endDate: new Date(twoMonths.getTime() + 2 * 24 * 60 * 60 * 1000),
      location: "Nusa Dua Convention Center, Bali",
      category: { connectOrCreate: { where: { name: "Business" }, create: { name: "Business", slug: "business" } } },
      availableSeats: 200,
      totalSeats: 200,
    },
  });

  const event4 = await prisma.event.create({
    data: {
      organizer: { connect: { id: organizer2.id } },
      title: "Jakarta Marathon 2026",
      slug: "jakarta-marathon-2026",
      description:
        "Maraton internasional tahunan Jakarta! Tersedia kategori: Full Marathon (42km), Half Marathon (21km), Fun Run (5km). Rute melewati ikon-ikon bersejarah Jakarta. Semua finisher mendapatkan medali dan sertifikat digital.",
      price: 250000,
      startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      location: "Monas, Jakarta",
      category: { connectOrCreate: { where: { name: "Sports" }, create: { name: "Sports", slug: "sports" } } },
      availableSeats: 1990,
      totalSeats: 2000,
    },
  });

  const event5 = await prisma.event.create({
    data: {
      organizer: { connect: { id: organizer1.id } },
      title: "UI/UX Design Bootcamp",
      slug: "ui-ux-design-bootcamp",
      description:
        "Bootcamp intensif 2 hari untuk menjadi UI/UX Designer profesional. Materi: Design Thinking, Figma Advanced, User Research, dan Portfolio Building. Mentor dari perusahaan top: Tokopedia, Gojek, Traveloka. Sertifikat diakui industri.",
      price: 150000,
      startDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
      location: "Online (Zoom)",
      category: { connectOrCreate: { where: { name: "Technology" }, create: { name: "Technology", slug: "technology" } } },
      availableSeats: 300,
      totalSeats: 300,
    },
  });

  const event6 = await prisma.event.create({
    data: {
      organizer: { connect: { id: organizer2.id } },
      title: "Artificial Intelligence Summit 2026",
      slug: "artificial-intelligence-summit-2026",
      description:
        "Jelajahi masa depan AI bersama pakar industri dari Google DeepMind dan OpenAI. Seminar satu hari penuh yang membahas implementasi Agentic AI, Generative Models, dan penerapannya di dunia nyata.",
      price: 750000,
      startDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // Besok!
      endDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      location: "Grand Hyatt, Jakarta",
      category: { connectOrCreate: { where: { name: "Technology" }, create: { name: "Technology", slug: "technology" } } },
      availableSeats: 50,
      totalSeats: 150,
    },
  });

  console.log("✅ Events seeded");

  // ─── Vouchers ─────────────────────────────────────────────────────────────
  const voucherExpiry = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  await prisma.voucher.createMany({
    data: [
      {
        eventId: event1.id,
        code: "TECHSUMMIT50",
        discountAmount: 50000,
        expiresAt: voucherExpiry,
        isActive: true,
      },
      {
        eventId: event2.id,
        code: "FESTIVAL100",
        discountAmount: 100000,
        expiresAt: voucherExpiry,
        isActive: true,
      },
      {
        eventId: event3.id,
        code: "BIZFORUM200",
        discountAmount: 200000,
        expiresAt: voucherExpiry,
        isActive: true,
      },
    ],
  });

  console.log("✅ Vouchers seeded");

  // ─── Coupons (system-wide) ────────────────────────────────────────────────
  await prisma.coupon.createMany({
    data: [
      {
        code: "NEWUSER10",
        discountPercent: 10,
        maxDiscount: 100000,
        expiresAt: threeMonthsLater,
        isActive: true,
      },
      {
        code: "WELCOME20",
        discountPercent: 20,
        maxDiscount: 200000,
        expiresAt: threeMonthsLater,
        isActive: true,
      },
      {
        code: "REFERRAL15",
        discountPercent: 15,
        maxDiscount: 150000,
        expiresAt: threeMonthsLater,
        isActive: true,
      },
    ],
  });

  console.log("✅ Coupons seeded");

  // ─── Transactions ─────────────────────────────────────────────────────────
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const expiresSoon = new Date(now.getTime() + 1 * 60 * 60 * 1000);

  await prisma.transaction.createMany({
    data: [
      {
        userId: customer1.id,
        eventId: event1.id,
        status: TransactionStatus.DONE,
        qty: 2,
        totalPrice: 970000,
        discountApplied: 50000,
        pointsUsed: 30000,
        paymentProof: "https://via.placeholder.com/400x300?text=Payment+Proof",
        expiresAt: twoHoursAgo,
      },
      {
        userId: customer1.id,
        eventId: event2.id,
        status: TransactionStatus.WAITING_ADMIN,
        qty: 1,
        totalPrice: 250000,
        discountApplied: 100000,
        pointsUsed: 0,
        paymentProof: "https://via.placeholder.com/400x300?text=Payment+Proof+2",
        expiresAt: expiresSoon,
      },
      {
        userId: customer2.id,
        eventId: event1.id,
        status: TransactionStatus.WAITING_PAYMENT,
        qty: 1,
        totalPrice: 500000,
        discountApplied: 0,
        pointsUsed: 0,
        expiresAt: expiresSoon,
      },
    ],
  });

  console.log("✅ Transactions seeded");

  // ─── Reviews ──────────────────────────────────────────────────────────────
  // Reviews only from events that are "done"
  await prisma.review.createMany({
    data: [
      {
        userId: customer1.id,
        eventId: event1.id,
        rating: 5,
        comment:
          "Event luar biasa! Pembicaranya sangat inspiratif dan networking-nya sangat berguna. Pasti datang lagi tahun depan!",
      },
    ],
  });

  console.log("✅ Reviews seeded");

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log("\n🎉 Seeding complete!");
  console.log("─────────────────────────────────────");
  console.log("📋 Akun yang tersedia:");
  console.log("  ORGANIZER  → organizer@loket.dev  / Password123!");
  console.log("  ORGANIZER  → organizer2@loket.dev / Password123!");
  console.log("  CUSTOMER   → customer@loket.dev   / Password123!");
  console.log("  CUSTOMER   → customer2@loket.dev  / Password123!");
  console.log("─────────────────────────────────────");
  console.log(`  Events   : 6`);
  console.log(`  Vouchers : 3`);
  console.log(`  Coupons  : 3`);
  console.log(`  Tx       : 3`);
  console.log(`  Reviews  : 1`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
