# UWC Connect 🎓

**UWC Connect** is a mobile-first, social-media-style web application for University of the Western Cape (UWC) students and staff to discover, post, and interact with campus events and opportunities (talks, society events, sports, workshops, internships, fundraisers, parties).

---

## Features
- **TikTok/Instagram-Style Feed**: Scrolling "For You" feed powered by an interest-based recommendation ranker engine with time decay, followed host boost, and exploration mix-in.
- **Role-Based Authentication**: Strict domain restriction (`@myuwc.ac.za` for Students, `@uwc.ac.za` for Staff/Admin) with bcrypt-hashed passwords and session cookies.
- **Event Management**: Create, edit, draft, and publish events with location, date/time, category, hero image, and external links.
- **Interactions**: Like, Comment, Share (Web Share API / Copy Link), Save/Bookmark, and RSVP with capacity counter & spots left.
- **Follow System**: Follow student hosts, lecturers, or society accounts.
- **Search & Filters**: Keyword search with category chips and time window filters ("Today", "This Week", "Saved").
- **Admin Moderation Portal**: Report queue for campus safety, post removal, report dismissal, and account suspension.
- **Owner Insights**: Detailed event analytics (views, likes, comments, saves, shares, RSVPs, and 7-day engagement chart).
- **Dark Mode & Responsive**: UWC Deep Navy (#002855) & Gold (#FFC72C) palette with mobile bottom navigation bar and desktop sidebar.

---

## Tech Stack
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + Lucide Icons
- **Database**: SQLite via Prisma ORM
- **Auth**: HTTP-only session cookies with bcryptjs
- **Testing**: Vitest for feed recommendation engine unit tests

---

## Quick Start & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database & Migration
```bash
npx prisma db push
```

### 3. Seed Database with Initial Data
```bash
npm run seed
```

### 4. Run Recommendation Unit Tests
```bash
npm run test
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Demo Login Credentials

All seeded user accounts share the password: **`Password123!`**

| Role | Name | Email | Focus / Bio |
| :--- | :--- | :--- | :--- |
| **Student** | Thabo Mokoena | `thabo@myuwc.ac.za` | Final year CS & Tech Society Chair |
| **Student** | Chloe Hendricks | `chloe@myuwc.ac.za` | Law Student & Debate Society VP |
| **Student** | Sibusiso Ndlovu | `sibusiso@myuwc.ac.za` | Varsity Cup Rugby player & Finance major |
| **Student** | Anika Patel | `anika@myuwc.ac.za` | Biotech Postgraduate |
| **Student** | Luke Petersen | `luke@myuwc.ac.za` | Arts & Drama 1st Year / Campus DJ |
| **Staff** | Prof. Sarah Smith | `prof.smith@uwc.ac.za` | Professor of Computer Science & AI Researcher |
| **Staff** | Dr. David Adams | `dr.adams@uwc.ac.za` | Head of UWC Sports Bureau |
| **Admin** | Dean Van Wyk | `admin@uwc.ac.za` | Campus Moderation & Student Affairs Admin |

---

## Recommendation Engine Formula
$$\text{score} = (\text{categoryAffinity} \times 0.40) + (\text{followedHostBoost} \times 0.25) + (\text{popularity} \times 0.15) + (\text{recency} \times 0.10) + (\text{urgency} \times 0.10)$$

Isolated in `lib/feed/ranker.ts` for clean scalability and pre-computation compatibility.

## Event Calendar

Open `/calendar` (sidebar: **Event Calendar**, or the calendar icon in the mobile header).

- Month grid (Monday first) with colour-coded categories and a legend
- Filter: **All events**, **Going** (your RSVPs) or **Saved** (log in required)
- Tap a day to see its events, with time, location, RSVP count and capacity
- **Add to calendar** button on each event downloads an `.ics` file (works with Google Calendar, Outlook and phone calendars)
- No extra packages required. Files: `app/calendar/page.tsx`, `app/api/calendar/route.ts`
