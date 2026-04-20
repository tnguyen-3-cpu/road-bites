const CHAIN_KEYWORDS = [
  "mcdonald", "burger king", "subway", "taco bell", "kfc", "wendy",
  "starbucks", "dunkin", "chipotle", "panera", "olive garden",
  "applebee", "ihop", "denny", "domino", "pizza hut", "papa john",
  "chick-fil-a", "chick fil a", "popeyes", "arby", "dairy queen",
  "sonic drive", "jack in the box", "whataburger", "in-n-out",
  "in n out", "raising cane", "cracker barrel", "red lobster",
  "outback", "chili's", "chilis", "tgi friday", "red robin",
  "buffalo wild wings", "hooters", "qdoba", "moe's southwest",
  "panda express", "five guys", "shake shack", "jimmy john",
  "potbelly", "quiznos", "jersey mike", "firehouse subs",
  "little caesars", "papa murphy", "cold stone", "baskin",
  "krispy kreme", "tim horton", "wingstop", "carl's jr",
  "carls jr", "hardee", "a&w", "long john silver",
  "cheesecake factory", "texas roadhouse", "longhorn steakhouse",
  "bonefish grill", "bj's restaurant", "ruby tuesday",
  "cracker barrel", "waffle house", "dennys",
];

export function isChain(name) {
  if (!name) return false;
  const lower = name.toLowerCase();
  return CHAIN_KEYWORDS.some((kw) => lower.includes(kw));
}

const MIN_RATING = 4.0;
const MIN_REVIEWS = 20;

/**
 * Hidden-gem score: rewards high ratings with moderate review counts.
 * Returns 0 if restaurant is a chain, below rating/review thresholds, or
 * missing signals. Higher = more gem-like.
 *
 * Formula: rating + popularityBonus, where the bonus is 1.0 for places
 * with few reviews and decays to 0 by ~3100 reviews.
 */
export function gemScore(r) {
  if (!r.rating || !r.reviewCount) return 0;
  if (r.rating < MIN_RATING) return 0;
  if (r.reviewCount < MIN_REVIEWS) return 0;
  if (isChain(r.name)) return 0;

  const popularityPenalty = Math.min(1, Math.log10(r.reviewCount) / 3.5);
  return r.rating + (1 - popularityPenalty);
}
