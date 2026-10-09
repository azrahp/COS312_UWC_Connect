import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CATEGORIES = [
  "talks",
  "society",
  "sports",
  "workshops",
  "internships",
  "fundraisers",
  "parties",
  "careers",
  "other",
];

async function main() {
  console.log("🌱 Clearing existing data...");
  await prisma.report.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.interaction.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.share.deleteMany({});
  await prisma.save.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.rsvp.deleteMany({});
  await prisma.follow.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("👥 Creating users...");
  const hashedPassword = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@uwc.ac.za",
      passwordHash: hashedPassword,
      role: "ADMIN",
      name: "Dean Van Wyk",
      bio: "UWC Campus Administration & Student Affairs Moderator.",
      studentStaffNumber: "STF-9901",
      faculty: "Campus Administration",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      interests: JSON.stringify(["talks", "careers", "workshops"]),
    },
  });

  const staff1 = await prisma.user.create({
    data: {
      email: "prof.smith@uwc.ac.za",
      passwordHash: hashedPassword,
      role: "STAFF",
      name: "Prof. Sarah Smith",
      bio: "Professor of Computer Science & AI Researcher at UWC.",
      studentStaffNumber: "STF-2041",
      faculty: "Natural Sciences",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
      interests: JSON.stringify(["workshops", "talks", "careers"]),
    },
  });

  const staff2 = await prisma.user.create({
    data: {
      email: "dr.adams@uwc.ac.za",
      passwordHash: hashedPassword,
      role: "STAFF",
      name: "Dr. David Adams",
      bio: "Head of UWC Sports Bureau & Student Development Coach.",
      studentStaffNumber: "STF-1108",
      faculty: "Community & Health Sciences",
      avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80",
      interests: JSON.stringify(["sports", "fundraisers", "society"]),
    },
  });

  const student1 = await prisma.user.create({
    data: {
      email: "thabo@myuwc.ac.za",
      passwordHash: hashedPassword,
      role: "STUDENT",
      name: "Thabo Mokoena",
      bio: "Final year Computer Science student. Developer & Tech Society Chair 🚀",
      studentStaffNumber: "3981245",
      faculty: "Natural Sciences",
      yearOfStudy: 3,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
      interests: JSON.stringify(["workshops", "careers", "internships", "talks"]),
    },
  });

  const student2 = await prisma.user.create({
    data: {
      email: "chloe@myuwc.ac.za",
      passwordHash: hashedPassword,
      role: "STUDENT",
      name: "Chloe Hendricks",
      bio: "Law student | UWC Debate Society VP | Coffee enthusiast ☕",
      studentStaffNumber: "4019283",
      faculty: "Law",
      yearOfStudy: 2,
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
      interests: JSON.stringify(["talks", "society", "fundraisers"]),
    },
  });

  const student3 = await prisma.user.create({
    data: {
      email: "sibusiso@myuwc.ac.za",
      passwordHash: hashedPassword,
      role: "STUDENT",
      name: "Sibusiso Ndlovu",
      bio: "UWC Varsity Cup Rugby squad player & BCom Finance major 🏉📈",
      studentStaffNumber: "4102938",
      faculty: "Economic & Management Sciences",
      yearOfStudy: 3,
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
      interests: JSON.stringify(["sports", "parties", "fundraisers"]),
    },
  });

  const student4 = await prisma.user.create({
    data: {
      email: "anika@myuwc.ac.za",
      passwordHash: hashedPassword,
      role: "STUDENT",
      name: "Anika Patel",
      bio: "Biotechnology Postgraduate | Science & Innovation Advocate 🔬",
      studentStaffNumber: "3891024",
      faculty: "Natural Sciences",
      yearOfStudy: 4,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      interests: JSON.stringify(["workshops", "internships", "talks"]),
    },
  });

  const student5 = await prisma.user.create({
    data: {
      email: "luke@myuwc.ac.za",
      passwordHash: hashedPassword,
      role: "STUDENT",
      name: "Luke Petersen",
      bio: "Arts & Drama 1st Year. Campus DJ & Event Organiser 🎧🎉",
      studentStaffNumber: "4209182",
      faculty: "Arts & Humanities",
      yearOfStudy: 1,
      avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80",
      interests: JSON.stringify(["parties", "society", "other"]),
    },
  });

  console.log("🤝 Creating follow connections...");
  await prisma.follow.createMany({
    data: [
      { followerId: student1.id, followingId: staff1.id },
      { followerId: student1.id, followingId: student2.id },
      { followerId: student2.id, followingId: student1.id },
      { followerId: student3.id, followingId: staff2.id },
      { followerId: student4.id, followingId: staff1.id },
      { followerId: student5.id, followingId: student3.id },
      { followerId: student2.id, followingId: staff2.id },
    ],
  });

  console.log("🎉 Creating events...");
  const now = new Date();
  const hours = (h: number) => new Date(now.getTime() + h * 3600 * 1000);
  const days = (d: number) => new Date(now.getTime() + d * 24 * 3600 * 1000);

  const eventData = [
    {
      authorId: staff1.id,
      title: "AI & Machine Learning Bootcamp 2026",
      description: "Join Prof. Sarah Smith for an intensive hands-on workshop covering PyTorch, Large Language Models, and real-world AI applications built right here at UWC.",
      category: "workshops",
      location: "Computer Science Lab 3, Natural Sciences Building",
      startsAt: hours(6), // Today!
      capacity: 35,
      imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
      externalUrl: "https://uwc.ac.za/cs-ai-bootcamp",
    },
    {
      authorId: student1.id,
      title: "UWC Tech Hackathon: Code for Change",
      description: "24-hour hackathon for student developers, designers, and innovators! Prizes worth R15,000 up for grabs. Snacks and drinks provided.",
      category: "workshops",
      location: "Jakes Gerwel Hall, Main Campus",
      startsAt: days(2),
      capacity: 100,
      imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80",
      externalUrl: "https://uwctech.co.za/hackathon",
    },
    {
      authorId: staff2.id,
      title: "Varsity Cup Derby: UWC vs Maties Rugby Match",
      description: "Come paint the stadium blue and yellow! Support the UWC Rugby team in our biggest home match of the season. Gates open 16:00.",
      category: "sports",
      location: "UWC Sports Stadium",
      startsAt: days(1),
      capacity: 500,
      imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80",
    },
    {
      authorId: student2.id,
      title: "Inter-Faculty Law & Ethics Debate Championship",
      description: "Watch UWC's finest debaters tackle pressing Constitutional Law and AI Ethics questions. Audience voting for best speaker!",
      category: "talks",
      location: "Moot Court, Law Faculty Building",
      startsAt: days(3),
      capacity: 80,
      imageUrl: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80",
    },
    {
      authorId: student5.id,
      title: "UWC Spring Break Sunset Bash 🎶",
      description: "Live student DJs, food trucks, neon lights, and non-stop music at the Student Centre quad. Free entry for all UWC students with student ID!",
      category: "parties",
      location: "Student Centre Quad",
      startsAt: days(4),
      capacity: 250,
      imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80",
    },
    {
      authorId: staff1.id,
      title: "Amazon Web Services (AWS) Internship Info Session",
      description: "Recruiters from AWS Cape Town are visiting UWC to present 2027 Graduate Engineering & Product internships. Bring your CV!",
      category: "internships",
      location: "Auditorium A, Science Faculty",
      startsAt: days(5),
      capacity: 60,
      imageUrl: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&auto=format&fit=crop&q=80",
      externalUrl: "https://aws.amazon.com/university-recruiting",
    },
    {
      authorId: student4.id,
      title: "Biotech & Healthcare Career Expo",
      description: "Network with top South African pharmaceutical, medical device, and biotechnology firms offering bursaries and entry-level positions.",
      category: "careers",
      location: "Life Sciences Building Foyer",
      startsAt: days(6),
      capacity: 120,
      imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80",
    },
    {
      authorId: student2.id,
      title: "Campus Food Drive & Charity Fundraiser",
      description: "Help us collect non-perishable food items and funds for students facing food insecurity. Drop off points at all residence gates.",
      category: "fundraisers",
      location: "Student Union Plaza",
      startsAt: hours(12), // Today
      capacity: 300,
      imageUrl: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&auto=format&fit=crop&q=80",
    },
    {
      authorId: student3.id,
      title: "Inter-Res 5-a-Side Soccer Tournament",
      description: "Residences clash for campus bragging rights! Register your team of 5 players + 2 subs before Friday. Trophy and prizes for winners.",
      category: "sports",
      location: "UWC Futsal Courts",
      startsAt: days(7),
      capacity: 16,
      imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80",
    },
    {
      authorId: staff2.id,
      title: "Mental Health & Academic Wellness Talk",
      description: "Dr. Adams and the UWC Student Counselling Unit share actionable strategies for exam stress management and mental wellbeing.",
      category: "talks",
      location: "Great Hall, Main Campus",
      startsAt: days(8),
      capacity: 150,
      imageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80",
    },
    {
      authorId: student1.id,
      title: "Full-Stack Web Development with Next.js 14",
      description: "Master App Router, Server Actions, Prisma, and Tailwind CSS in this 3-hour student-led workshop. Perfect for beginners and intermediates.",
      category: "workshops",
      location: "Lab 102, Computer Science Dept",
      startsAt: days(9),
      capacity: 40,
      imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
    },
    {
      authorId: student5.id,
      title: "UWC Creative Arts & Photography Exhibition",
      description: "Explore breathtaking student artwork, digital illustrations, and photography. Live acoustic acoustic performances during open night.",
      category: "society",
      location: "Art Gallery, Humanities Complex",
      startsAt: days(10),
      capacity: 100,
      imageUrl: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&auto=format&fit=crop&q=80",
    },
    {
      authorId: staff1.id,
      title: "Cybersecurity & Ethical Hacking Seminar",
      description: "Guest speaker from CSIR shares practical insights into network security, vulnerability assessment, and careers in cyber defense.",
      category: "talks",
      location: "Auditorium 2, Science Faculty",
      startsAt: days(11),
      capacity: 90,
      imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80",
    },
    {
      authorId: student3.id,
      title: "Finance & Investment Society Meetup",
      description: "Learn how to start investing in SA stocks, index funds, and cryptocurrencies with financial advisors and student investors.",
      category: "society",
      location: "EMS Lecture Theatre 1",
      startsAt: days(12),
      capacity: 75,
      imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop&q=80",
    },
    {
      authorId: student4.id,
      title: "Women in STEM Networking Breakfast",
      description: "Celebrating UWC female scientists, engineers, and researchers. Keynote address, breakfast buffet, and mentorship matchmaking.",
      category: "careers",
      location: "Senate House Lounge",
      startsAt: days(13),
      capacity: 50,
      imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=80",
    },
    {
      authorId: student5.id,
      title: "Gaming & Esports Tournament: FIFA & Tekken",
      description: "Battle it out on PS5 screens! Console gaming, prizes, and live commentary. Registration free for all UWC students.",
      category: "society",
      location: "Student Centre Recreation Hall",
      startsAt: days(14),
      capacity: 64,
      imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80",
    },
    {
      authorId: staff2.id,
      title: "UWC Campus Marathon & Fun Run 5km/10km",
      description: "Run, jog, or walk around the beautiful UWC campus perimeter! Commemorative t-shirts and medals for all finishers.",
      category: "sports",
      location: "UWC Sports Complex Start Line",
      startsAt: days(15),
      capacity: 400,
      imageUrl: "https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?w=800&auto=format&fit=crop&q=80",
    },
    {
      authorId: student2.id,
      title: "Public Speaking & CV Workshop for Graduates",
      description: "Master interview techniques, elevator pitches, and resume structuring with career counsellors.",
      category: "workshops",
      location: "Law Library Seminar Room",
      startsAt: days(16),
      capacity: 30,
      imageUrl: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80",
    },
    {
      authorId: student1.id,
      title: "Open Source Software Contribution Sprint",
      description: "Collaborate with fellow students to build open-source tools for UWC campus life. All programming skill levels welcome.",
      category: "workshops",
      location: "Computer Lab 4",
      startsAt: days(17),
      capacity: 25,
      imageUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80",
    },
    {
      authorId: student3.id,
      title: "Spring Residence Talent Show & Braai 🥩🔥",
      description: "Singing, comedy, dance performances followed by a traditional UWC braai! Tickets R30 (includes meal voucher).",
      category: "parties",
      location: "Hector Peterson Residence Courtyard",
      startsAt: days(18),
      capacity: 180,
      imageUrl: "https://images.unsplash.com/photo-1555244162-803834f70033?w=800&auto=format&fit=crop&q=80",
    },
    {
      authorId: staff1.id,
      title: "Postgraduate Research Opportunities Showcase",
      description: "Discover Honours, Masters, and PhD funding, bursaries, and research projects across Science and Tech faculties.",
      category: "careers",
      location: "Life Sciences Seminar Room 2",
      startsAt: days(19),
      capacity: 70,
      imageUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80",
    },
    {
      authorId: student4.id,
      title: "Eco-UWC Tree Planting & Beach Cleanup Drive",
      description: "Join the Environmental Society to plant 50 indigenous trees on campus and clean up Monwabisi Beach.",
      category: "fundraisers",
      location: "Main Gate Bus Stop (Transport provided)",
      startsAt: days(20),
      capacity: 80,
      imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80",
    },
    {
      authorId: student5.id,
      title: "UWC Music Society Jam Session",
      description: "Brought your instrument or voice? Come jam live with fellow campus musicians across Jazz, Hip-Hop, Afrobeats, and Rock.",
      category: "society",
      location: "Arts Faculty Music Studio",
      startsAt: days(21),
      capacity: 45,
      imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
    },
    {
      authorId: staff2.id,
      title: "Yoga & Mindfulness Sunrise Session",
      description: "Start your morning with guided yoga and breathing exercises on the lush green lawns outside the library.",
      category: "other",
      location: "Library Lawns",
      startsAt: days(22),
      capacity: 40,
      imageUrl: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&auto=format&fit=crop&q=80",
    },
    {
      authorId: student1.id,
      title: "Draft Event: Student Hackathon Setup Meeting",
      description: "Internal planning meeting for committee members only.",
      category: "workshops",
      location: "Online Zoom",
      startsAt: days(25),
      capacity: 10,
      status: "DRAFT", // Draft event!
    },
  ];

  const createdEvents = [];
  for (const data of eventData) {
    const e = await prisma.event.create({ data });
    createdEvents.push(e);
  }

  console.log("❤️ Seed interactions, RSVPs, Likes, Comments, Shares, and Reports...");

  const users = [student1, student2, student3, student4, student5, staff1, staff2, admin];

  // Populate RSVPs and Likes
  for (let i = 0; i < createdEvents.length; i++) {
    const ev = createdEvents[i];
    if (ev.status === "DRAFT") continue;

    // Pick 2-5 random users to RSVP and like
    const rsvpUsers = users.slice(0, 2 + (i % 4));
    for (const u of rsvpUsers) {
      await prisma.rsvp.create({
        data: { userId: u.id, eventId: ev.id },
      });
      await prisma.interaction.create({
        data: { userId: u.id, eventId: ev.id, type: "RSVP" },
      });
    }

    const likeUsers = users.slice(1, 3 + (i % 5));
    for (const u of likeUsers) {
      await prisma.like.create({
        data: { userId: u.id, eventId: ev.id },
      });
      await prisma.interaction.create({
        data: { userId: u.id, eventId: ev.id, type: "LIKE" },
      });
    }

    // Add sample comments to top events
    if (i < 8) {
      await prisma.comment.create({
        data: {
          userId: student1.id,
          eventId: ev.id,
          content: "Super excited for this event! Can't wait! 🔥",
        },
      });
      await prisma.comment.create({
        data: {
          userId: student2.id,
          eventId: ev.id,
          content: "Will there be catering or certificates provided?",
        },
      });
      await prisma.interaction.create({
        data: { userId: student1.id, eventId: ev.id, type: "COMMENT" },
      });
    }

    // Add view interactions for student1 & student2 to test personalization
    if (ev.category === "workshops" || ev.category === "talks") {
      await prisma.interaction.create({
        data: { userId: student1.id, eventId: ev.id, type: "VIEW" },
      });
      await prisma.save.create({
        data: { userId: student1.id, eventId: ev.id },
      });
      await prisma.interaction.create({
        data: { userId: student1.id, eventId: ev.id, type: "SAVE" },
      });
    }

    if (ev.category === "sports" || ev.category === "parties") {
      await prisma.interaction.create({
        data: { userId: student3.id, eventId: ev.id, type: "VIEW" },
      });
      await prisma.interaction.create({
        data: { userId: student3.id, eventId: ev.id, type: "LIKE" },
      });
    }
  }

  // Create notifications
  await prisma.notification.create({
    data: {
      userId: student1.id,
      type: "FOLLOW_POST",
      message: "Prof. Sarah Smith posted a new event: AI & Machine Learning Bootcamp 2026",
      linkUrl: `/events/${createdEvents[0].id}`,
    },
  });

  await prisma.notification.create({
    data: {
      userId: student1.id,
      type: "EVENT_REMINDER",
      message: "Reminder: AI & Machine Learning Bootcamp 2026 starts in 6 hours!",
      linkUrl: `/events/${createdEvents[0].id}`,
    },
  });

  // Create 1 sample report for admin moderation queue test
  await prisma.report.create({
    data: {
      eventId: createdEvents[4].id, // Spring Break Sunset Bash
      reporterId: student2.id,
      reason: "Noise levels and timing concerns near residential campus areas.",
      status: "PENDING",
    },
  });

  console.log("✅ Database successfully seeded!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
