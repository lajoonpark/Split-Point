// Keyword moderation system – expandable lists per rating level

const PROFANITY: string[] = [
  "fuck", "shit", "bitch", "asshole", "cunt", "damn", "bastard",
];

const INSULTS: string[] = [
  "idiot", "stupid", "dumb", "moron", "loser", "pathetic",
];

const SENSITIVE: string[] = [
  "gun", "suicide", "bomb", "terrorist", "drugs",
];

const NSFW: string[] = [
  "porn", "nsfw", "nude", "sex", "xxx",
  ...PROFANITY,
];

function containsAny(text: string, words: string[]): boolean {
  const lower = text.toLowerCase();
  return words.some((w) => lower.includes(w));
}

export type ModerationResult = {
  allowed: boolean;
  isNsfw: boolean;
  reason?: string;
};

export function moderateContent(
  content: string,
  level: "G" | "PG" | "M"
): ModerationResult {
  if (level === "G") {
    if (containsAny(content, PROFANITY))
      return { allowed: false, isNsfw: false, reason: "Profanity not allowed (G)" };
    if (containsAny(content, INSULTS))
      return { allowed: false, isNsfw: false, reason: "Insults not allowed (G)" };
    if (containsAny(content, SENSITIVE))
      return { allowed: false, isNsfw: false, reason: "Sensitive topic not allowed (G)" };
    return { allowed: true, isNsfw: false };
  }

  if (level === "PG") {
    if (containsAny(content, PROFANITY))
      return { allowed: false, isNsfw: false, reason: "Profanity not allowed (PG)" };
    if (containsAny(content, SENSITIVE))
      return { allowed: false, isNsfw: false, reason: "Sensitive topic not allowed (PG)" };
    return { allowed: true, isNsfw: false };
  }

  // M level – allow but flag NSFW
  const isNsfw = containsAny(content, NSFW);
  return { allowed: true, isNsfw };
}
