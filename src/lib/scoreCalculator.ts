/**
 * Calculates a real composite SEO Health Score (0-100).
 * 
 * Formula:
 * 1. Compute baseline average of available Lighthouse metrics:
 *    - scorePerformance (always present, 0-100)
 *    - scoreSeoGoogle (if present, 0-100)
 *    - scoreAccessibility (if present, 0-100)
 *    - scoreBestPractices (if present, 0-100)
 * 2. Calculate a penalty for unresolved/pending issue AuditItems (non-opportunistic):
 *    - High severity issues: 'insecure_link', 'robots_sitemap', 'broken_link', 'meta_title'
 *      Each subtracts 5 points.
 *    - Medium/Low severity issues: 'meta_description', 'heading_structure', 'missing_alt', 'social_meta', 'duplicate_content', 'image_weight', 'canonical_tag'
 *      Each subtracts 2 points.
 * 3. Clamp final score between 0 and 100.
 */
export function calculateSeoHealthScore(audit: any): number {
  if (!audit) return 0;

  const scores: number[] = [audit.scorePerformance || 0];
  if (audit.scoreSeoGoogle !== null && audit.scoreSeoGoogle !== undefined) {
    scores.push(audit.scoreSeoGoogle);
  }
  if (audit.scoreAccessibility !== null && audit.scoreAccessibility !== undefined) {
    scores.push(audit.scoreAccessibility);
  }
  if (audit.scoreBestPractices !== null && audit.scoreBestPractices !== undefined) {
    scores.push(audit.scoreBestPractices);
  }

  const baseline = scores.reduce((sum, s) => sum + s, 0) / scores.length;

  const items = audit.items || [];
  let penalty = 0;

  for (const item of items) {
    if (item.status === "pending") {
      if (["insecure_link", "robots_sitemap", "broken_link", "meta_title"].includes(item.type)) {
        penalty += 5;
      } else if (
        [
          "meta_description",
          "heading_structure",
          "missing_alt",
          "social_meta",
          "duplicate_content",
          "image_weight",
          "canonical_tag"
        ].includes(item.type)
      ) {
        penalty += 2;
      }
    }
  }

  return Math.max(0, Math.min(100, Math.round(baseline - penalty)));
}

/**
 * Calculates a real trend indicator for Growth Score: "positive", "neutral", or "negative".
 * 
 * Formula:
 * 1. Calculate SEO Health Score change: current - previous.
 * 2. If GSC click trend is provided (difference in clicks):
 *    - Weight: SEO Health Score change (60%) + GSC clicks change trend (40%).
 * 3. If GSC trend is not provided:
 *    - Based solely on SEO Health Score change:
 *      - change > 0: "positive"
 *      - change < 0: "negative"
 *      - change === 0: "neutral"
 */
export function calculateGrowthScore(
  currentAudit: any,
  previousAudit?: any | null,
  gscTrend?: { clicksChange: number } | null
): "positive" | "neutral" | "negative" {
  if (!currentAudit) return "neutral";
  
  if (!previousAudit) {
    if (gscTrend) {
      if (gscTrend.clicksChange > 0) return "positive";
      if (gscTrend.clicksChange < 0) return "negative";
    }
    return "neutral";
  }

  const currentHealth = calculateSeoHealthScore(currentAudit);
  const previousHealth = calculateSeoHealthScore(previousAudit);
  const healthChange = currentHealth - previousHealth;

  let score = healthChange;

  if (gscTrend) {
    if (gscTrend.clicksChange > 0) {
      score += 2;
    } else if (gscTrend.clicksChange < 0) {
      score -= 2;
    }
  }

  if (score > 0) return "positive";
  if (score < 0) return "negative";
  return "neutral";
}
