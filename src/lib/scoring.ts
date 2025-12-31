import type { ScoreBreakdown, ValidationResult } from "./types";

type ValidationInput = {
  productText: string;
};

const commodityKeywords = [
  "phone case",
  "t-shirt",
  "tshirt",
  "hoodie",
  "mug",
  "water bottle",
  "bottle",
  "charger",
  "keychain",
  "sticker",
  "poster",
  "hat",
  "cap",
  "earbuds",
  "socks",
  "mouse pad",
];

const highCompetitionKeywords = [
  "phone case",
  "keychain",
  "t-shirt",
  "tshirt",
  "socks",
  "charger",
  "earbuds",
  "sticker",
  "poster",
];

const problemSolvingKeywords = [
  "ergonomic",
  "organizer",
  "organiser",
  "management",
  "tray",
  "holder",
  "stand",
  "support",
  "relief",
  "fix",
  "solution",
  "tangle",
  "storage",
  "organize",
  "organise",
];

const nicheKeywords = [
  "pet",
  "cat",
  "dog",
  "baby",
  "toddler",
  "travel",
  "camp",
  "outdoor",
  "fitness",
  "gym",
  "gamer",
  "gaming",
  "kitchen",
  "office",
  "desk",
  "teacher",
  "student",
  "beauty",
  "makeup",
  "bike",
  "cycling",
];

const differentiationKeywords = [
  "custom",
  "customized",
  "personalized",
  "engraved",
  "monogram",
  "handmade",
  "artisan",
  "limited",
  "bundle",
  "kit",
  "starter",
  "set",
];

const trendKeywords = [
  "tiktok",
  "viral",
  "trend",
  "trending",
  "instagram",
  "reel",
  "reels",
  "shorts",
  "fidget",
];

const seasonalKeywords = [
  "holiday",
  "christmas",
  "halloween",
  "summer",
  "winter",
  "seasonal",
  "valentine",
];

const fragileKeywords = [
  "glass",
  "ceramic",
  "porcelain",
  "fragile",
  "mirror",
  "vase",
  "lamp",
];

const bulkyKeywords = [
  "large",
  "bulky",
  "oversized",
  "furniture",
  "chair",
  "table",
  "desk",
  "sofa",
  "mattress",
];

const electronicKeywords = [
  "electronic",
  "electronics",
  "battery",
  "lithium",
  "bluetooth",
  "smart",
  "gadget",
  "charger",
  "powered",
  "usb",
  "led",
];

const baseScores: ScoreBreakdown = {
  demand: 5,
  competition: 5,
  margin: 5,
  shipping: 5,
  trend: 5,
  brandability: 5,
  total: 50,
};

const clampScore = (value: number) =>
  Math.max(0, Math.min(10, Math.round(value)));

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const hasKeyword = (text: string, keyword: string) => {
  if (keyword.includes(" ")) {
    return text.includes(keyword);
  }
  return new RegExp(`\\b${escapeRegExp(keyword)}\\b`).test(text);
};

const hasAny = (text: string, keywords: string[]) =>
  keywords.some((keyword) => hasKeyword(text, keyword));

const extractPrices = (text: string) => {
  const matches = [...text.matchAll(/\$ ?(\d+(?:\.\d+)?)/g)];
  return matches
    .map((match) => Number(match[1]))
    .filter((price) => !Number.isNaN(price));
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9$.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const addUnique = (list: string[], item: string) => {
  if (!list.includes(item)) {
    list.push(item);
  }
};

const summarizeSignals = (signals: string[]) => {
  if (signals.length === 0) {
    return "";
  }
  if (signals.length === 1) {
    return signals[0];
  }
  if (signals.length === 2) {
    return `${signals[0]} and ${signals[1]}`;
  }
  return `${signals[0]}, ${signals[1]}`;
};

export function validateProduct(input: ValidationInput): ValidationResult {
  const normalized = normalizeText(input.productText ?? "");

  if (!normalized) {
    return {
      decision: "red",
      summary:
        "Red: not enough product detail to evaluate demand, margins, or risk.",
      scores: {
        demand: 0,
        competition: 0,
        margin: 0,
        shipping: 0,
        trend: 0,
        brandability: 0,
        total: 0,
      },
      warnings: ["Provide a clear product description or URL."],
      reasons: ["Insufficient information to score the product fairly."],
    };
  }

  const scores: ScoreBreakdown = { ...baseScores };
  const warnings: string[] = [];
  const reasons: string[] = [];

  if (hasAny(normalized, problemSolvingKeywords)) {
    scores.demand += 2;
    scores.brandability += 2;
    addUnique(
      reasons,
      "Problem-solving positioning supports demand and brandability.",
    );
  }

  if (hasAny(normalized, nicheKeywords)) {
    scores.demand += 1;
    scores.brandability += 1;
    addUnique(reasons, "A clear niche audience makes targeting easier.");
  }

  if (hasAny(normalized, differentiationKeywords)) {
    scores.brandability += 2;
    scores.competition -= 1;
    addUnique(reasons, "Differentiation can reduce direct competition.");
  }

  if (hasAny(normalized, commodityKeywords)) {
    scores.competition += 3;
    scores.brandability -= 1;
    addUnique(reasons, "Commodity products typically face heavy competition.");
    addUnique(warnings, "Commodity category likely crowded with similar items.");
  }

  if (hasAny(normalized, highCompetitionKeywords)) {
    scores.competition += 2;
    addUnique(warnings, "High-competition category detected.");
  }

  const prices = extractPrices(normalized);
  if (prices.length > 0) {
    const minPrice = Math.min(...prices);
    if (minPrice < 10) {
      scores.margin -= 4;
      addUnique(warnings, "Price under $10 usually leaves thin margins.");
      addUnique(reasons, "Low price suggests limited margin headroom.");
    } else if (minPrice < 15) {
      scores.margin -= 3;
      addUnique(warnings, "Price under $15 can make margins tight.");
      addUnique(reasons, "Low price makes profitability harder.");
    } else if (minPrice >= 100) {
      scores.margin += 2;
      addUnique(reasons, "Higher ticket price supports healthier margins.");
    } else if (minPrice >= 50) {
      scores.margin += 1;
      addUnique(reasons, "Mid-ticket pricing can improve margin potential.");
    }
  }

  let shippingSignals = 0;
  if (hasAny(normalized, fragileKeywords)) {
    scores.shipping += 3;
    shippingSignals += 1;
    addUnique(warnings, "Fragile materials increase shipping risk.");
  }

  if (hasAny(normalized, bulkyKeywords)) {
    scores.shipping += 3;
    shippingSignals += 1;
    addUnique(warnings, "Large or bulky items raise fulfillment costs.");
  }

  if (hasAny(normalized, electronicKeywords)) {
    scores.shipping += 2;
    shippingSignals += 1;
    addUnique(warnings, "Electronics can trigger returns and carrier limits.");
  }

  if (shippingSignals > 0) {
    addUnique(reasons, "Shipping risk appears elevated for this product.");
  }

  if (hasAny(normalized, trendKeywords)) {
    scores.trend -= 2;
    scores.demand += 1;
    addUnique(warnings, "Trend-driven demand can fade quickly.");
    addUnique(reasons, "Trend signals boost demand but add volatility.");
  }

  if (hasAny(normalized, seasonalKeywords)) {
    scores.trend -= 1;
    addUnique(warnings, "Seasonal demand may limit year-round sales.");
  }

  const finalScoresBase = {
    demand: clampScore(scores.demand),
    competition: clampScore(scores.competition),
    margin: clampScore(scores.margin),
    shipping: clampScore(scores.shipping),
    trend: clampScore(scores.trend),
    brandability: clampScore(scores.brandability),
  };

  if (finalScoresBase.competition >= 7) {
    addUnique(reasons, "Competition looks crowded for this category.");
  }
  if (finalScoresBase.margin <= 3) {
    addUnique(reasons, "Margins look too thin to absorb ad and shipping costs.");
    addUnique(warnings, "Margin viability is a major risk.");
  }
  if (finalScoresBase.shipping >= 7) {
    addUnique(reasons, "Shipping risk is high relative to typical products.");
    addUnique(warnings, "Shipping risk could lead to returns or damage.");
  }
  if (finalScoresBase.trend <= 3) {
    addUnique(reasons, "Trend health appears unstable or short-lived.");
  }
  if (finalScoresBase.demand <= 3) {
    addUnique(reasons, "Demand signals appear weak based on the description.");
  }
  if (finalScoresBase.demand >= 7) {
    addUnique(reasons, "Demand signals look strong for this idea.");
  }
  if (finalScoresBase.brandability >= 7) {
    addUnique(reasons, "Brandability looks strong for a focused audience.");
  }

  const fatalCombination =
    finalScoresBase.margin <= 3 &&
    finalScoresBase.shipping >= 7 &&
    finalScoresBase.competition >= 7;

  const normalizedCompetition = 10 - finalScoresBase.competition;
  const normalizedShipping = 10 - finalScoresBase.shipping;
  const overallScore =
    (finalScoresBase.demand +
      finalScoresBase.margin +
      finalScoresBase.trend +
      finalScoresBase.brandability +
      normalizedCompetition +
      normalizedShipping) /
    6;
  const totalScore = Math.max(0, Math.min(100, Math.round(overallScore * 10)));
  const finalScores: ScoreBreakdown = {
    ...finalScoresBase,
    total: totalScore,
  };

  let decision: ValidationResult["decision"] = "yellow";
  if (fatalCombination || overallScore < 4.5) {
    decision = "red";
  } else if (overallScore >= 7) {
    decision = "green";
  }

  const positiveSignals: string[] = [];
  if (finalScores.demand >= 7) positiveSignals.push("strong demand");
  if (finalScores.brandability >= 7) positiveSignals.push("clear brandability");
  if (finalScores.margin >= 7) positiveSignals.push("healthy margins");
  if (finalScores.trend >= 7) positiveSignals.push("stable trend");
  if (finalScores.competition <= 3) positiveSignals.push("low competition");
  if (finalScores.shipping <= 3) positiveSignals.push("low shipping risk");

  const riskSignals: string[] = [];
  if (finalScores.competition >= 7) riskSignals.push("high competition");
  if (finalScores.shipping >= 7) riskSignals.push("high shipping risk");
  if (finalScores.margin <= 3) riskSignals.push("thin margins");
  if (finalScores.trend <= 3) riskSignals.push("trend volatility");
  if (finalScores.demand <= 3) riskSignals.push("weak demand");

  let summary = "";
  if (decision === "green") {
    const positives = summarizeSignals(positiveSignals);
    summary = positives
      ? `Green light: ${positives} support a viable launch.`
      : "Green light: overall signals are strong with manageable risk.";
  } else if (decision === "yellow") {
    const positives = summarizeSignals(positiveSignals) || "some positive signals";
    const risks = summarizeSignals(riskSignals) || "manageable risks";
    summary = `Yellow: ${positives} but ${risks} need attention.`;
  } else {
    if (fatalCombination) {
      summary =
        "Red: thin margins combined with high competition and shipping risk make this a poor candidate.";
    } else {
      const risks = summarizeSignals(riskSignals) || "insufficient viable signals";
      summary = `Red: ${risks} make this a weak candidate right now.`;
    }
  }

  return {
    decision,
    summary,
    scores: finalScores,
    warnings: warnings.slice(0, 6),
    reasons: reasons.slice(0, 6),
  };
}
