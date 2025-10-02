import {
  FundingProfile,
  GrantOpportunity,
  EligibilityReport,
  LifecycleStage,
  LifecycleInsights,
  GrantDraft,
  ApplicationReview,
  RedTeamReview,
  BudgetItem,
  FunderPersona,
  SuccessPatternAnalysis,
  DifferentiationAnalysis,
  CohesionAnalysis,
  CohesionFinding,
  FundingTrendReport,
  SemanticSearchResult,
  LessonsLearnedReport,
  LessonsLearnedFinding,
  ExtractedComplianceTask,
} from '../types';

const isoTimestamp = () => new Date().toISOString();

const sanitizeText = (value: string | undefined) =>
  (value && value.trim().length > 0 ? value.trim() : 'Not specified');

const pickConfidence = (profile: FundingProfile, grant: GrantOpportunity) => {
  const normalizedProfile = profile.industry.toLowerCase();
  const normalizedGrant = grant.industry.toLowerCase();
  if (normalizedGrant.includes(normalizedProfile) || normalizedProfile.includes(normalizedGrant)) {
    return 'High' as const;
  }
  if (grant.description.toLowerCase().includes(normalizedProfile)) {
    return 'Medium' as const;
  }
  return 'Low' as const;
};

export const generateMockGrantResults = (profile: FundingProfile) => {
  const baseUrl = 'https://grants.example.com';
  const sectors = [profile.industry, 'Innovation', 'Community Impact'];
  const opportunities: GrantOpportunity[] = sectors.map((sector, index) => ({
    name: `${sector} Catalyst Fund ${index + 1}`,
    description: `Funding initiative focused on ${sector.toLowerCase()} solutions led by ${profile.name}.`,
    fundingAmount: `$${(index + 2) * 50}k`,
    url: `${baseUrl}/${encodeURIComponent(sector.toLowerCase().replace(/\s+/g, '-'))}-${index + 1}`,
    industry: sector,
    deadline: new Date(Date.now() + (index + 1) * 14 * 24 * 60 * 60 * 1000).toISOString(),
  }));

  return {
    opportunities,
    sources: opportunities.map((opportunity) => ({
      web: {
        uri: opportunity.url,
        title: opportunity.name,
      },
    })),
  };
};

export const buildEligibilityReport = (
  profile: FundingProfile,
  grant: GrantOpportunity,
): EligibilityReport => ({
  confidenceScore: pickConfidence(profile, grant),
  deadlines: [
    {
      date: sanitizeText(grant.deadline),
      description: `Primary submission deadline for ${grant.name}`,
    },
    {
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Ideal date to finalize internal review materials',
    },
  ],
  strengths: [
    `${profile.name} operates in ${profile.industry}, aligning with the funder focus on ${grant.industry}.`,
    `Existing stage (${profile.stage}) demonstrates maturity for ${grant.name}.`,
  ],
  gaps: [
    `Clarify how requested funds (${grant.fundingAmount}) will translate into measurable outcomes.`,
    'Provide past performance metrics or testimonials to reinforce credibility.',
  ],
  advice: `Reframe the proposal to emphasize how ${profile.fundingNeeds} directly support the mission described in ${grant.description}.`,
});

export const buildLifecycleInsights = (
  grant: GrantOpportunity,
  stage: LifecycleStage,
): LifecycleInsights => {
  const sharedActivities = [
    'Confirm eligibility checks with the funder contact.',
    'Align internal stakeholders on timelines and responsibilities.',
    'Review historical submissions for lessons learned.',
  ];

  const stageSpecific: Record<LifecycleStage, LifecycleInsights> = {
    Discovery: {
      keyActivities: [...sharedActivities, `Map ${grant.name} requirements against your assets.`],
      typicalTimeline: '2-3 weeks of scoping and narrative framing.',
      insiderTips: 'Log funder conversations in your CRM to reference strategic priorities.',
    },
    Application: {
      keyActivities: [...sharedActivities, 'Draft proposal sections iteratively with reviewer feedback loops.'],
      typicalTimeline: '3-5 weeks from outline to final review.',
      insiderTips: 'Lock a red-team review at least 5 days before submission.',
    },
    'Submission & Review': {
      keyActivities: [...sharedActivities, 'Submit early to avoid last-minute portal outages.'],
      typicalTimeline: 'Funder response typically arrives within 8-12 weeks.',
      insiderTips: 'Send a thank you and clarification email 48 hours post-submission.',
    },
    Award: {
      keyActivities: [...sharedActivities, 'Negotiate milestones and disbursement schedules.'],
      typicalTimeline: '2-4 weeks to finalize agreement documents.',
      insiderTips: 'Request clear guidance on reporting cadence before signing.',
    },
    Reporting: {
      keyActivities: [...sharedActivities, 'Aggregate KPI evidence and beneficiary stories.'],
      typicalTimeline: 'Create a reporting sprint every quarter.',
      insiderTips: 'Pre-fill templates with executive summaries to speed approvals.',
    },
  };

  return stageSpecific[stage];
};

export const buildFunderPersona = (grant: GrantOpportunity): FunderPersona => ({
  funderName: `${grant.name} Committee`,
  coreMission: `Accelerate impact in ${grant.industry.toLowerCase()} initiatives.`,
  keyPriorities: [
    `Deploy capital to scalable ${grant.industry.toLowerCase()} programs.`,
    'Foster measurable community outcomes.',
    'Elevate underrepresented voices in solution design.',
  ],
  communicationStyle: 'Concise, data-forward updates accompanied by narrative context.',
  strategicAdvice: `Highlight how your solution stands out in the ${grant.industry.toLowerCase()} landscape and quantify expected outcomes.`,
  generatedAt: isoTimestamp(),
});

export const buildSuccessPatterns = (grant: GrantOpportunity): SuccessPatternAnalysis => ({
  commonThemes: [
    `Strong alignment with ${grant.industry.toLowerCase()} policy objectives.`,
    'Community partnerships demonstrating shared ownership.',
  ],
  fundedProjectTypes: [
    `${grant.industry} pilot programs`,
    'Cross-sector collaborations with measurable KPIs',
  ],
  fundingRangeInsights: `Typical awards cluster near ${grant.fundingAmount}.`,
  keywordPatterns: [
    grant.industry.toLowerCase(),
    'sustainability',
    'scalability',
    'evidence-based impact',
  ],
  strategicRecommendations: `Structure your narrative around 3 quantified outcomes and refresh letters of support to mirror ${grant.name} language.`,
  generatedAt: isoTimestamp(),
});

export const buildDifferentiation = (
  grant: GrantOpportunity,
  drafts: GrantDraft[],
): DifferentiationAnalysis => ({
  innovativeAngles: [
    `Pair ${grant.industry.toLowerCase()} innovation with bold community storytelling.`,
    'Bundle workforce development to strengthen funder ROI.',
  ],
  alternativeMetrics: [
    'Cost per beneficiary served',
    'Carbon intensity avoided per dollar invested',
  ],
  partnershipSuggestions: [
    'Academic research labs for longitudinal validation',
    'Local civic organizations to extend reach',
  ],
  generatedAt: isoTimestamp(),
});

const buildCohesionFindings = (
  drafts: GrantDraft[],
  budgetItems: BudgetItem[],
): CohesionFinding[] => {
  const findings: CohesionFinding[] = [];

  if (drafts.length === 0) {
    findings.push({
      finding: 'No drafts available – connect narrative development before requesting cohesion analysis.',
      sections: [],
      severity: 'Critical',
    });
    return findings;
  }

  const referencedBudget = budgetItems.length > 0;
  if (!referencedBudget) {
    findings.push({
      finding: 'Budget items are missing. Tie key activities to line items to prove feasibility.',
      sections: drafts.map((draft) => draft.section),
      severity: 'Warning',
    });
  }

  findings.push({
    finding: 'Ensure impact metrics in the summary match those promised in work-plan sections.',
    sections: drafts.map((draft) => draft.section),
    severity: 'Suggestion',
  });

  return findings;
};

export const buildCohesionAnalysis = (
  drafts: GrantDraft[],
  budgetItems: BudgetItem[],
): CohesionAnalysis => ({
  findings: buildCohesionFindings(drafts, budgetItems),
  generatedAt: isoTimestamp(),
});

export const draftSectionContent = (
  profile: FundingProfile,
  grant: GrantOpportunity,
  section: string,
  teamId?: number,
) => ({
  content: `## ${section}\n\n${profile.name} proposes a ${grant.industry.toLowerCase()} initiative tailored to the ${grant.name} program.\n\n- Team reference: ${teamId ?? 'Not linked to a team'}\n- Funding Request: ${grant.fundingAmount}\n- Stage: ${profile.stage}\n\nThe program will deploy funds toward ${profile.fundingNeeds.toLowerCase()} with measurable milestones every quarter.`,
});

export const buildApplicationReview = (
  grant: GrantOpportunity,
  drafts: GrantDraft[],
): ApplicationReview => ({
  overallScore: drafts.length > 2 ? 'Strong Contender' : 'Promising',
  strengths: [
    `Clear alignment with ${grant.industry.toLowerCase()} mission.`,
    'Solid theory of change with quantifiable KPIs.',
  ],
  recommendations: [
    'Expand letters of support to include community partners.',
    'Provide a contingency plan for budget variances.',
  ],
  generatedAt: isoTimestamp(),
});

export const buildRedTeamReview = (
  grant: GrantOpportunity,
  drafts: GrantDraft[],
): RedTeamReview => ({
  overallRisk: drafts.length < 2 ? 'Medium' : 'Low',
  vulnerabilities: [
    'Budget justification requires stronger linkage to outcomes.',
    'Need clearer articulation of post-grant sustainability.',
  ],
  probingQuestions: [
    'What happens if anticipated co-funding does not materialize?',
    'How will the team mitigate beneficiary churn?',
  ],
  generatedAt: isoTimestamp(),
});

export const buildBudgetJustification = (
  grant: GrantOpportunity,
  drafts: GrantDraft[],
  budgetItem: Pick<BudgetItem, 'description' | 'amount'>,
) => ({
  justification: `${budgetItem.description} ($${budgetItem.amount}) enables delivery of the ${grant.name} objectives with evidence-based spending. Connect the cost to milestones described in narrative sections.`,
});

export const buildGrantReport = (
  profile: FundingProfile,
  grant: GrantOpportunity,
  progressNotes: string,
) => ({
  report: `### Progress Update for ${grant.name}\n\n**Lead Organization:** ${profile.name}\n**Reporting Period:** ${isoTimestamp()}\n\n**Highlights**\n${progressNotes || 'Pending updates from project leads.'}\n\n**Next Steps**\n- Confirm budget utilization versus plan.\n- Capture beneficiary testimonials for the upcoming report.`,
});

export const buildComplianceTasks = (
  grantAgreementText: string,
): { tasks: ExtractedComplianceTask[] } => {
  const sentences = grantAgreementText
    .split(/\n|\.\s*/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const tasks: ExtractedComplianceTask[] = sentences.slice(0, 3).map((sentence, index) => ({
    description: sentence,
    dueDate: new Date(Date.now() + (index + 1) * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }));

  if (tasks.length === 0) {
    tasks.push({
      description: 'Review agreement clauses and extract compliance milestones.',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  return { tasks };
};

export const buildImpactStory = (dataPoints: string) => ({
  story: `Our initiative transformed the community by ${dataPoints}. Beneficiaries reported higher satisfaction and measurable quality-of-life gains.`,
});

export const buildFundingTrends = (sector: string): FundingTrendReport => ({
  sector,
  summary: `${sector} funding grew steadily last quarter with increased emphasis on data transparency and equity.`,
  emergingKeywords: ['equity', 'evidence', sector.toLowerCase(), 'sustainability'],
  shiftingPriorities: ['Multi-year commitments', 'Stronger governance metrics'],
  newAreasOfFocus: ['Digital infrastructure', 'Capacity building'],
  generatedAt: isoTimestamp(),
});

export const buildKnowledgeBaseAnswer = (
  query: string,
): SemanticSearchResult => ({
  answer: `Based on prior proposals, focus your response on ${query.toLowerCase()} with quantified impact metrics.`,
  sources: [
    { documentId: 1, documentName: 'EcoInnovate Climate Grant 2023 Application' },
    { documentId: 2, documentName: 'Water Conservation Proposal 2023' },
  ],
});

export const buildLessonsLearned = (teamId: number): LessonsLearnedReport => {
  const findings: LessonsLearnedFinding[] = [
    {
      theme: 'Early stakeholder alignment',
      suggestion: 'Run alignment workshops in the first project week to avoid pivoting late in the cycle.',
      supportingExcerpts: [
        'Teams that convened cross-functional kickoffs closed narrative gaps sooner.',
      ],
    },
    {
      theme: 'Quantified outcomes',
      suggestion: 'Tie each workstream to a KPI and capture leading indicators.',
      supportingExcerpts: [
        'Winning submissions included dashboards updated monthly.',
      ],
    },
  ];

  return {
    summary: `Team ${teamId} improved win rates when drafts were peer-reviewed two weeks earlier and when budgets highlighted leveraged funds.`,
    findings,
    generatedAt: isoTimestamp(),
  };
};

export const buildChatReply = (profile: FundingProfile, grant: GrantOpportunity, newMessage: string): string => {
  const trimmed = newMessage.trim();
  const focus = trimmed.length > 0 ? trimmed : 'Share additional context so I can help refine the proposal.';
  return `Here are next steps for ${grant.name}: ${focus}`;
};
