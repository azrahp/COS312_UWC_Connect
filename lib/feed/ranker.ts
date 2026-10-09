export interface UserFeedContext {
  userId: string;
  onboardingInterests: string[];
  followingAuthorIds: string[];
  pastInteractions: Array<{
    eventId: string;
    category: string;
    type: "VIEW" | "LIKE" | "COMMENT" | "SAVE" | "SHARE" | "RSVP" | "FOLLOW_HOST" | string;
    createdAt: Date | string;
  }>;
  userRsvpEventIds: string[];
  userSavedEventIds: string[];
  userLikedEventIds: string[];
}

export interface RawEvent {
  id: string;
  authorId: string;
  title: string;
  description: string;
  category: string;
  location: string;
  startsAt: Date | string;
  imageUrl?: string | null;
  capacity?: number | null;
  externalUrl?: string | null;
  status: "DRAFT" | "PUBLISHED" | "REMOVED" | string;
  createdAt: Date | string;
  author: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    status: "ACTIVE" | "SUSPENDED" | string;
  };
  _count: {
    likes: number;
    rsvps: number;
    comments: number;
    shares?: number;
    saves?: number;
  };
}

export interface RankedEvent extends RawEvent {
  score: number;
  reason: string;
  scoringBreakdown: {
    categoryAffinity: number;
    followedHostBoost: number;
    popularity: number;
    recency: number;
    urgency: number;
  };
}

const INTERACTION_WEIGHTS: Record<string, number> = {
  VIEW: 1,
  LIKE: 3,
  COMMENT: 4,
  SAVE: 5,
  SHARE: 5,
  RSVP: 8,
  FOLLOW_HOST: 6,
};

export function calculateCategoryScores(
  onboardingInterests: string[],
  interactions: UserFeedContext["pastInteractions"],
  now: Date = new Date()
): Record<string, number> {
  const categoryScores: Record<string, number> = {};

  // Initialize onboarding interests with a baseline affinity weight (6 pts)
  for (const cat of onboardingInterests) {
    categoryScores[cat.toLowerCase()] = 6.0;
  }

  // Accumulate scores from past interactions with time decay
  for (const interaction of interactions) {
    const cat = interaction.category.toLowerCase();
    const weight = INTERACTION_WEIGHTS[interaction.type.toUpperCase()] || 1;
    const interactionDate = new Date(interaction.createdAt);
    const diffDays = Math.max(0, (now.getTime() - interactionDate.getTime()) / (1000 * 3600 * 24));
    
    // Exponential time decay: 50% decay every 14 days
    const decayFactor = Math.exp(-0.05 * diffDays);
    const points = weight * decayFactor;

    categoryScores[cat] = (categoryScores[cat] || 0) + points;
  }

  return categoryScores;
}

export function rankEventsForUser(
  events: RawEvent[],
  userContext: UserFeedContext,
  now: Date = new Date()
): RankedEvent[] {
  const categoryScores = calculateCategoryScores(
    userContext.onboardingInterests,
    userContext.pastInteractions,
    now
  );

  // Find max category score for normalization
  const maxCatScore = Math.max(1, ...Object.values(categoryScores));

  const validEvents = events.filter((ev) => {
    // Hard Rule 1: Exclude removed posts
    if (ev.status === "REMOVED") return false;

    // Hard Rule 2: Exclude draft posts
    if (ev.status === "DRAFT") return false;

    // Hard Rule 3: Exclude suspended accounts
    if (ev.author.status === "SUSPENDED") return false;

    // Hard Rule 4: Exclude past events (events that already ended/started over 2 hours ago)
    const eventTime = new Date(ev.startsAt).getTime();
    const currentMs = now.getTime();
    if (eventTime < currentMs - 2 * 3600 * 1000) return false;

    return true;
  });

  const rankedList: RankedEvent[] = validEvents.map((event) => {
    const eventCategory = event.category.toLowerCase();
    const rawCatScore = categoryScores[eventCategory] || 0;
    const categoryAffinity = Math.min(1.0, rawCatScore / maxCatScore);

    // Followed Host Boost
    const isFollowed = userContext.followingAuthorIds.includes(event.authorId);
    const followedHostBoost = isFollowed ? 1.0 : 0.0;

    // Popularity score (Logarithmic scale)
    const popularityPoints =
      (event._count?.likes || 0) * 1 +
      (event._count?.rsvps || 0) * 2 +
      (event._count?.comments || 0) * 1.5;
    const popularity = Math.min(
      1.0,
      Math.log10(1 + popularityPoints) / Math.log10(100)
    );

    // Recency score (creation date relative to now)
    const createdAtTime = new Date(event.createdAt).getTime();
    const daysOld = Math.max(0, (now.getTime() - createdAtTime) / (1000 * 3600 * 24));
    const recency = Math.max(0, 1 - daysOld / 30);

    // Urgency score (events in next 7 days get boost)
    const eventStartsAt = new Date(event.startsAt).getTime();
    const hoursUntilEvent = (eventStartsAt - now.getTime()) / (1000 * 3600);
    const daysUntilEvent = hoursUntilEvent / 24;
    let urgency = 0;
    if (daysUntilEvent >= 0 && daysUntilEvent <= 7) {
      urgency = Math.max(0, 1 - daysUntilEvent / 7);
    }

    // Weighted Score formula
    let rawScore =
      categoryAffinity * 0.40 +
      followedHostBoost * 0.25 +
      popularity * 0.15 +
      recency * 0.10 +
      urgency * 0.10;

    // Down-ranking rules:
    // If user already RSVP'd to event, down-rank by 40% (0.6 multiplier) so new events appear first
    const isRsvped = userContext.userRsvpEventIds.includes(event.id);
    if (isRsvped) {
      rawScore *= 0.6;
    }

    // If user has viewed 3+ times without interacting (liked, rsvpd, saved, commented), down-rank by 50%
    const userEventViews = userContext.pastInteractions.filter(
      (i) => i.eventId === event.id && i.type.toUpperCase() === "VIEW"
    ).length;
    const userInteracted =
      isRsvped ||
      userContext.userLikedEventIds.includes(event.id) ||
      userContext.userSavedEventIds.includes(event.id);

    if (userEventViews >= 3 && !userInteracted) {
      rawScore *= 0.5;
    }

    // Determine "Why am I seeing this?" badge reason
    let reason = "Recommended for you";
    if (isFollowed) {
      reason = `From ${event.author.name} (Host you follow)`;
    } else if (categoryAffinity > 0.6) {
      const capCat = event.category.charAt(0).toUpperCase() + event.category.slice(1);
      reason = `Because you like ${capCat}`;
    } else if (urgency > 0.6) {
      reason = "Happening soon this week";
    } else if (popularity > 0.5) {
      reason = "Popular on UWC campus";
    } else if (userContext.onboardingInterests.map((c) => c.toLowerCase()).includes(eventCategory)) {
      reason = "Based on your selected interests";
    }

    return {
      ...event,
      score: Number(rawScore.toFixed(4)),
      reason,
      scoringBreakdown: {
        categoryAffinity: Number(categoryAffinity.toFixed(2)),
        followedHostBoost,
        popularity: Number(popularity.toFixed(2)),
        recency: Number(recency.toFixed(2)),
        urgency: Number(urgency.toFixed(2)),
      },
    };
  });

  // Sort descending by score
  rankedList.sort((a, b) => b.score - a.score);

  // Exploration Mix-in (~10-15%):
  // Check if we have events from categories user has NOT interacted with/selected
  const userKnownCategories = new Set([
    ...userContext.onboardingInterests.map((c) => c.toLowerCase()),
    ...userContext.pastInteractions.map((i) => i.category.toLowerCase()),
  ]);

  const explorationIndices: number[] = [];
  rankedList.forEach((item, index) => {
    if (!userKnownCategories.has(item.category.toLowerCase())) {
      explorationIndices.push(index);
    }
  });

  // If we have exploration candidates, promote one to slot 3 or 4
  if (explorationIndices.length > 0 && rankedList.length >= 4) {
    const candidateIdx = explorationIndices[0];
    if (candidateIdx >= 4) {
      const [explored] = rankedList.splice(candidateIdx, 1);
      explored.reason = "Explore something new";
      rankedList.splice(3, 0, explored);
    }
  }

  return rankedList;
}
