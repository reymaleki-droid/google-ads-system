export interface LeadFormData {
  full_name: string;
  email: string;
  phone_e164: string;
  phone_country: string;
  phone_calling_code: string;
  whatsapp_same_as_phone: boolean;
  whatsapp_e164?: string;
  whatsapp_country?: string;
  whatsapp_calling_code?: string;
  company_name?: string;
  website_url?: string;
  industry?: string;
  industry_other?: string;
  country: string;
  city: string;
  location_area: string;
  goal_primary: string;
  budget_currency: 'AED' | 'USD';
  monthly_budget_range: string;
  response_within_5_min: boolean;
  decision_maker: boolean;
  timeline: string;
  consent: boolean;
}

export type LeadGrade = 'A' | 'B' | 'C' | 'D';
export type RecommendedPackage = 'starter' | 'growth' | 'scale';

export interface LeadScore {
  score: number;
  grade: LeadGrade;
  recommended_package: RecommendedPackage;
}

export function calculateLeadScore(data: LeadFormData): LeadScore {
  let score = 0;

  // Budget scoring based on currency
  if (data.budget_currency === 'AED') {
    const budgetNumber = parseBudgetRange(data.monthly_budget_range);
    if (budgetNumber >= 5000) {
      score += 25;
    } else if (budgetNumber >= 2000) {
      score += 15;
    } else if (budgetNumber >= 1000) {
      score += 5;
    }
  } else if (data.budget_currency === 'USD') {
    const budgetNumber = parseBudgetRange(data.monthly_budget_range);
    if (budgetNumber >= 5000) {
      score += 25;
    } else if (budgetNumber >= 2000) {
      score += 15;
    } else if (budgetNumber >= 1000) {
      score += 5;
    }
  }

  // Decision maker
  if (data.decision_maker) {
    score += 20;
  }

  // Response within 5 minutes
  if (data.response_within_5_min) {
    score += 15;
  }

  // Timeline scoring
  if (data.timeline === 'immediate') {
    score += 10;
  } else if (data.timeline === '2weeks') {
    score += 5;
  }

  // Determine grade
  let grade: LeadGrade;
  if (score >= 75) {
    grade = 'A';
  } else if (score >= 55) {
    grade = 'B';
  } else if (score >= 35) {
    grade = 'C';
  } else {
    grade = 'D';
  }

  // Determine recommended package
  let recommended_package: RecommendedPackage;
  if (grade === 'A') {
    recommended_package = 'scale';
  } else if (grade === 'B') {
    recommended_package = 'growth';
  } else {
    recommended_package = 'starter';
  }

  return { score, grade, recommended_package };
}

function parseBudgetRange(range: string): number {
  // Extract the lower bound of the budget range
  const match = range.match(/(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 0;
}
