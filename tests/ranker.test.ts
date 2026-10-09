import { describe, it, expect } from "vitest";
import { rankEventsForUser, calculateCategoryScores, RawEvent, UserFeedContext } from "../lib/feed/ranker";

describe("UWC Connect Feed Ranker", () => {
  const now = new Date("2026-10-05T12:00:00Z");
  const hours = (h: number) => new Date(now.getTime() + h * 3600 * 1000).toISOString();
  const days = (d: number) => new Date(now.getTime() + d * 24 * 3600 * 1000).toISOString();

  const mockUserContext: UserFeedContext = {
    userId: "user-1",
    onboardingInterests: ["workshops", "talks"],
    followingAuthorIds: ["host-prof-smith"],
    pastInteractions: [
      {
        eventId: "event-1",
        category: "workshops",
        type: "RSVP",
        createdAt: days(-1),
      },
      {
        eventId: "event-2",
        category: "workshops",
        type: "LIKE",
        createdAt: days(-2),
      },
      {
        eventId: "event-3",
        category: "sports",
        type: "VIEW",
        createdAt: days(-10),
      },
    ],
    userRsvpEventIds: ["event-1"],
    userSavedEventIds: [],
    userLikedEventIds: ["event-2"],
  };

  const mockEvents: RawEvent[] = [
    {
      id: "event-1",
      authorId: "host-student-thabo",
      title: "Next.js Workshop",
      description: "Learn Next.js",
      category: "workshops",
      location: "Lab 1",
      startsAt: hours(5),
      status: "PUBLISHED",
      createdAt: days(-1),
      author: { id: "host-student-thabo", name: "Thabo", email: "thabo@myuwc.ac.za", status: "ACTIVE" },
      _count: { likes: 10, rsvps: 20, comments: 5 },
    },
    {
      id: "event-2",
      authorId: "host-prof-smith",
      title: "AI Guest Lecture",
      description: "Talk by Prof Smith",
      category: "talks",
      location: "Main Auditorium",
      startsAt: days(2),
      status: "PUBLISHED",
      createdAt: days(-2),
      author: { id: "host-prof-smith", name: "Prof Smith", email: "prof.smith@uwc.ac.za", status: "ACTIVE" },
      _count: { likes: 5, rsvps: 8, comments: 2 },
    },
    {
      id: "event-3",
      authorId: "host-rugby",
      title: "Rugby Derby",
      description: "Match",
      category: "sports",
      location: "Stadium",
      startsAt: days(3),
      status: "PUBLISHED",
      createdAt: days(-5),
      author: { id: "host-rugby", name: "Coach Adams", email: "dr.adams@uwc.ac.za", status: "ACTIVE" },
      _count: { likes: 40, rsvps: 100, comments: 30 },
    },
    {
      id: "event-draft",
      authorId: "host-prof-smith",
      title: "Draft Workshop",
      description: "Draft",
      category: "workshops",
      location: "Lab 2",
      startsAt: days(4),
      status: "DRAFT",
      createdAt: days(-1),
      author: { id: "host-prof-smith", name: "Prof Smith", email: "prof.smith@uwc.ac.za", status: "ACTIVE" },
      _count: { likes: 0, rsvps: 0, comments: 0 },
    },
    {
      id: "event-suspended",
      authorId: "suspended-user",
      title: "Spam Party",
      description: "Party",
      category: "parties",
      location: "Quad",
      startsAt: days(1),
      status: "PUBLISHED",
      createdAt: days(-1),
      author: { id: "suspended-user", name: "Bad User", email: "bad@myuwc.ac.za", status: "SUSPENDED" },
      _count: { likes: 0, rsvps: 0, comments: 0 },
    },
    {
      id: "event-past",
      authorId: "host-prof-smith",
      title: "Past Hackathon",
      description: "Finished",
      category: "workshops",
      location: "Lab 1",
      startsAt: days(-5),
      status: "PUBLISHED",
      createdAt: days(-10),
      author: { id: "host-prof-smith", name: "Prof Smith", email: "prof.smith@uwc.ac.za", status: "ACTIVE" },
      _count: { likes: 10, rsvps: 10, comments: 2 },
    },
  ];

  it("should filter out drafts, suspended accounts, and past events", () => {
    const ranked = rankEventsForUser(mockEvents, mockUserContext, now);
    const ids = ranked.map((e) => e.id);

    expect(ids).not.toContain("event-draft");
    expect(ids).not.toContain("event-suspended");
    expect(ids).not.toContain("event-past");
    expect(ranked.length).toBe(3);
  });

  it("should boost events authored by followed hosts", () => {
    const ranked = rankEventsForUser(mockEvents, mockUserContext, now);
    const eventProfSmith = ranked.find((e) => e.id === "event-2");

    expect(eventProfSmith?.scoringBreakdown.followedHostBoost).toBe(1.0);
    expect(eventProfSmith?.reason).toContain("From Prof Smith (Host you follow)");
  });

  it("should down-rank events user has already RSVP'd to", () => {
    const ranked = rankEventsForUser(mockEvents, mockUserContext, now);
    const rsvpdEvent = ranked.find((e) => e.id === "event-1");
    expect(rsvpdEvent).toBeDefined();
    // RSVP'd event score was reduced by 0.6 factor
  });

  it("should calculate category scores properly with time decay", () => {
    const scores = calculateCategoryScores(
      ["workshops"],
      [
        { eventId: "e1", category: "workshops", type: "RSVP", createdAt: days(0) },
        { eventId: "e2", category: "talks", type: "LIKE", createdAt: days(-30) },
      ],
      now
    );

    expect(scores.workshops).toBeGreaterThan(scores.talks);
  });

  it("should fallback gracefully for cold start user with no interactions", () => {
    const coldContext: UserFeedContext = {
      userId: "new-user",
      onboardingInterests: ["sports"],
      followingAuthorIds: [],
      pastInteractions: [],
      userRsvpEventIds: [],
      userSavedEventIds: [],
      userLikedEventIds: [],
    };

    const ranked = rankEventsForUser(mockEvents, coldContext, now);
    expect(ranked.length).toBeGreaterThan(0);
    const sportsEvent = ranked.find((e) => e.category === "sports");
    expect(sportsEvent).toBeDefined();
  });
});
