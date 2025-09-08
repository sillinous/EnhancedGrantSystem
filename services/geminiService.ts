
import { GoogleGenAI, GenerateContentResponse, Chat, Type } from "@google/genai";
import { FundingProfile, GrantOpportunity, ChatMessage, EligibilityReport, LifecycleStage, LifecycleInsights, GrantDraft, ApplicationReview, RedTeamReview, BudgetItem, FunderPersona, SuccessPatternAnalysis, DifferentiationAnalysis } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const chatModel = 'gemini-2.5-flash';
const searchModel = 'gemini-2.5-flash';

const parseJsonFromMarkdown = (text: string): any => {
  // First, look for a JSON block inside markdown fences.
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (fenceMatch && fenceMatch[1]) {
    try {
      return JSON.parse(fenceMatch[1]);
    } catch (e) {
      console.warn('Could not parse fenced JSON block. Falling back.', e);
    }
  }

  // If that fails, find the first brace or bracket and the last brace or bracket.
  const firstBracket = text.indexOf('[');
  const firstBrace = text.indexOf('{');
  
  if (firstBracket === -1 && firstBrace === -1) {
     try {
       // As a last resort, try to parse the whole trimmed string
       return JSON.parse(text.trim());
     } catch(e) {
        console.error("Could not find any JSON in the response text.");
        throw new Error("AI returned a response with no valid JSON content.");
     }
  }

  const startIndex = (firstBracket === -1 || (firstBrace !== -1 && firstBrace < firstBracket)) ? firstBrace : firstBracket;
  
  const lastBracket = text.lastIndexOf(']');
  const lastBrace = text.lastIndexOf('}');
  const endIndex = Math.max(lastBracket, lastBrace);

  if (startIndex === -1 || endIndex === -1) {
    console.error("Could not determine JSON boundaries in the response text.");
    throw new Error("AI returned a response in an unexpected format.");
  }

  const jsonStr = text.substring(startIndex, endIndex + 1);

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse extracted JSON substring:", jsonStr, e);
    throw new Error("AI returned a response in an unexpected format.");
  }
};

export const findGrants = async (profile: FundingProfile): Promise<{ opportunities: GrantOpportunity[], sources: any[] }> => {
  const prompt = `
    You are an expert grant sourcing analyst with comprehensive global search capabilities.
    Your task is to identify 7-10 of the most relevant and promising grants or funding opportunities available worldwide for the following profile.
    Tailor your search to the specific 'Profile Type' provided.

    Funding Profile:
    - Profile Type: ${profile.profileType}
    - Name: ${profile.name}
    - Industry / Area of Focus: ${profile.industry}
    - Stage: ${profile.stage}
    - Description: ${profile.description}
    - Funding Needs: ${profile.fundingNeeds}

    Return the result ONLY as a valid JSON array of objects. Each object must have these exact keys: "name", "description", "fundingAmount", and "url".
    Do not include any text, explanation, or markdown formatting outside of the JSON array itself.
  `;

  const response = await ai.models.generateContent({
    model: searchModel,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.2,
    },
  });
  
  const opportunities = parseJsonFromMarkdown(response.text);
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

  return { opportunities, sources };
};

export const checkEligibility = async (profile: FundingProfile, grant: GrantOpportunity): Promise<EligibilityReport> => {
  const prompt = `
    As an expert grant consultant, your task is to provide a detailed and honest eligibility analysis.
    
    1.  **Analyze Fit**: Meticulously compare the Funding Profile against the Grant Opportunity. Based on this analysis, provide a confidence score: "High", "Medium", or "Low".
    2.  **Find Deadlines**: Use your search tool to visit the Grant URL. Find and list all key application deadlines. If you cannot find specific dates, return an empty array for deadlines. Do not invent dates.
    3.  **Provide Insights**: Identify key strengths, potential gaps, and provide actionable advice for the applicant to improve their chances.

    The final output must be a single JSON object matching the provided schema.

    Funding Profile:
    - Type: ${profile.profileType}
    - Name: ${profile.name}
    - Industry: ${profile.industry}
    - Stage: ${profile.stage}
    - Description: ${profile.description}
    - Funding Needs: ${profile.fundingNeeds}

    Grant Opportunity:
    - Name: ${grant.name}
    - Description: ${grant.description}
    - URL: ${grant.url}
  `;

  const response = await ai.models.generateContent({
    model: chatModel,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.3,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          confidenceScore: {
            type: Type.STRING,
            description: 'The AI\'s confidence in the profile\'s match for the grant (High, Medium, or Low).'
          },
          deadlines: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING, description: "The specific date of the deadline." },
                description: { type: Type.STRING, description: "A brief description of what the deadline is for." }
              },
              required: ['date', 'description']
            },
            description: "A list of key application deadlines found on the grant's website. Returns an empty array if none are found."
          },
          strengths: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of key strengths and alignment points between the profile and the grant."
          },
          gaps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of potential gaps, risks, or areas needing clarification for eligibility."
          },
          advice: {
            type: Type.STRING,
            description: "A concise summary of actionable advice for the applicant."
          }
        },
        required: ["confidenceScore", "deadlines", "strengths", "gaps", "advice"]
      },
    },
  });

  return parseJsonFromMarkdown(response.text);
};

export const getLifecycleInsights = async (grant: GrantOpportunity, stage: LifecycleStage): Promise<LifecycleInsights> => {
  const prompt = `
    You are a seasoned grant program officer providing expert guidance to an applicant.
    Your task is to analyze the grant's official website and provide insights for the applicant on what to expect during the '${stage}' stage of the grant lifecycle.

    1.  **Use Search**: Use your search tool to thoroughly review the content at the provided Grant URL: ${grant.url}.
    2.  **Extract Information**: Based *only* on the information found on that website, identify the key activities, a typical timeline, and any specific tips or requirements for the '${stage}' stage.
    3.  **Format Output**: Return your findings as a single, valid JSON object that strictly adheres to the provided schema. If you cannot find specific information for a field, provide a helpful general statement (e.g., "The website does not specify a timeline for this stage, but it typically takes 4-6 weeks."). Do not invent specific facts.

    Grant Name: ${grant.name}
  `;

  const response = await ai.models.generateContent({
    model: searchModel,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          keyActivities: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of crucial tasks or actions the applicant should focus on during this stage."
          },
          typicalTimeline: {
            type: Type.STRING,
            description: "An estimated duration or key dates for this stage, as found on the website."
          },
          insiderTips: {
            type: Type.STRING,
            description: "A concise summary of strategic advice or important considerations for successfully navigating this stage."
          }
        },
        required: ["keyActivities", "typicalTimeline", "insiderTips"]
      }
    }
  });

  return parseJsonFromMarkdown(response.text);
};

export const analyzeFunderPersona = async (grant: GrantOpportunity): Promise<FunderPersona> => {
    const prompt = `
    You are a world-class grant strategy consultant. Your task is to perform a deep analysis of the funding organization behind a specific grant to create a "Funder Persona". This will give the applicant a strategic edge.

    **Core Directives:**
    1.  **Research Deeply**: Use your search tool to visit the provided Grant URL (${grant.url}) and navigate the funder's website. Go beyond the grant description. Look for their "About Us," "Mission," "Portfolio/Past Grantees," and "News/Press" sections.
    2.  **Synthesize Findings**: Based on your research, extract the following key intelligence points.
    3.  **Format Output**: Return your complete analysis as a single, valid JSON object that strictly adheres to the provided schema. Do not invent information; if a specific piece of information cannot be found, state that clearly in the relevant field.

    **Grant Opportunity:**
    - Name: ${grant.name}
    - URL: ${grant.url}
  `;

  const response = await ai.models.generateContent({
    model: searchModel,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          funderName: {
            type: Type.STRING,
            description: "The official name of the funding organization."
          },
          coreMission: {
            type: Type.STRING,
            description: "A concise summary of the funder's primary mission and purpose."
          },
          keyPriorities: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of the main areas, themes, or types of projects the funder consistently supports, based on their portfolio and language."
          },
          communicationStyle: {
            type: Type.STRING,
            description: "A description of the funder's tone and language (e.g., 'Formal and academic,' 'Innovative and disruptive,' 'Community-focused and grassroots')."
          },
          strategicAdvice: {
            type: Type.STRING,
            description: "Actionable advice for the applicant on how to tailor their proposal's tone, focus, and language to align perfectly with this funder's persona."
          }
        },
        required: ["funderName", "coreMission", "keyPriorities", "communicationStyle", "strategicAdvice"]
      }
    }
  });

  const personaData = parseJsonFromMarkdown(response.text);
  return { ...personaData, generatedAt: new Date().toISOString() };
};

export const analyzeSuccessPatterns = async (grant: GrantOpportunity): Promise<SuccessPatternAnalysis> => {
  const prompt = `
    You are an expert grant analyst. Your task is to analyze the success patterns of a funding organization by researching their previously funded projects. This provides a data-driven blueprint for what a winning proposal looks like.

    **Core Directives:**
    1.  **Identify the Funder**: From the Grant URL (${grant.url}), identify the primary funding organization.
    2.  **Research Past Winners**: Use your search tool to find examples of projects, companies, or individuals previously funded by this organization. Look for press releases, annual reports, or "Our Portfolio" sections on their website.
    3.  **Identify Patterns**: Analyze the information you find to identify recurring patterns. What do the winners have in common?
    4.  **Synthesize and Format**: Consolidate your findings and return them ONLY as a single, valid JSON object that strictly adheres to the provided schema. Do not invent information; if a specific piece of information cannot be found, state that in the relevant field (e.g., "Public data on specific keywords was not available.").

    **Grant Opportunity to Analyze:**
    - Name: ${grant.name}
    - URL: ${grant.url}
  `;

  const response = await ai.models.generateContent({
    model: searchModel,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          commonThemes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of the most common themes or subject areas that appear in funded projects (e.g., 'Youth Education', 'Water Conservation', 'AI for Social Good')."
          },
          fundedProjectTypes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "The typical types of initiatives that receive funding (e.g., 'Scientific Research', 'Community Outreach Programs', 'Technology Development', 'Documentary Films')."
          },
          fundingRangeInsights: {
            type: Type.STRING,
            description: "An insight into the typical size of grants awarded, based on announcements. (e.g., 'Awards are frequently in the $25,000 - $75,000 range, with larger amounts reserved for established institutions.')."
          },
          keywordPatterns: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of specific keywords or phrases that appear frequently in the descriptions of winning projects (e.g., 'Scalable', 'Data-Driven', 'Community-Led', 'Sustainable')."
          },
          strategicRecommendations: {
            type: Type.STRING,
            description: "A concise, actionable paragraph advising the applicant on how to leverage these patterns to strengthen their own proposal."
          }
        },
        required: ["commonThemes", "fundedProjectTypes", "fundingRangeInsights", "keywordPatterns", "strategicRecommendations"]
      }
    }
  });

  const analysisData = parseJsonFromMarkdown(response.text);
  return { ...analysisData, generatedAt: new Date().toISOString() };
};

export const analyzeDifferentiation = async (grant: GrantOpportunity, drafts: GrantDraft[]): Promise<DifferentiationAnalysis> => {
  const applicationContent = drafts.map(d => `--- ${d.section} ---\n${d.content}`).join('\n\n');

  const prompt = `
    You are a highly creative grant strategist and innovation consultant. Your task is to analyze a grant proposal and suggest ways to make it stand out from a competitive field of applicants. Do not critique the existing content for errors; instead, focus entirely on elevating its uniqueness and impact.

    **Core Directives:**
    1.  **Think Outside the Box**: Based on the grant's goals and the applicant's drafts, brainstorm innovative approaches or angles that other applicants might not consider.
    2.  **Suggest Novel Metrics**: Propose alternative or supplementary metrics for success that are more impactful or creative than standard measurements.
    3.  **Identify Strategic Partnerships**: Suggest potential types of organizations or specific entities the applicant could partner with to amplify their project's impact and credibility.
    4.  **Be Actionable**: Ensure all suggestions are concrete and actionable for the applicant.

    **Grant Opportunity:**
    - Name: ${grant.name}
    - Description: ${grant.description}

    **Applicant's Drafts:**
    ${applicationContent}

    **Your Task:**
    Return your analysis ONLY as a single, valid JSON object that strictly adheres to the provided schema.
  `;

  const response = await ai.models.generateContent({
    model: chatModel,
    contents: prompt,
    config: {
      temperature: 0.8,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          innovativeAngles: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 2-3 creative or innovative angles to make the project more unique."
          },
          alternativeMetrics: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 2-3 non-obvious or more impactful metrics to measure the project's success."
          },
          partnershipSuggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 2-3 strategic partnership ideas to enhance the project's scope and credibility."
          }
        },
        required: ["innovativeAngles", "alternativeMetrics", "partnershipSuggestions"]
      }
    }
  });

  const analysisData = parseJsonFromMarkdown(response.text);
  return { ...analysisData, generatedAt: new Date().toISOString() };
};

export const draftGrantSection = async (profile: FundingProfile, grant: GrantOpportunity, section: string): Promise<string> => {
  const prompt = `
    You are an elite grant writing consultant, recognized for crafting award-winning proposals that secure significant funding. Your task is to write a powerful and persuasive draft for the '${section}' section of a grant application.

    **Your Core Directives:**
    1.  **Adopt an Expert Persona:** Write with authority, clarity, and a persuasive tone. Use active voice and impactful language. Avoid generic statements and business jargon.
    2.  **Synthesize and Tailor:** Meticulously integrate the details from the Funding Profile and the Grant Opportunity. The draft MUST feel custom-written, directly addressing the grant's objectives and priorities using the applicant's strengths.
    3.  **Structure for Impact:** Ensure the draft is well-organized with a clear narrative flow. It should be compelling from the first sentence to the last.
    4.  **Be Action-Oriented:** Where specific data is needed, use clear placeholders like "[Insert specific data point or metric]" to guide the user.

    **Funding Profile:**
    - Type: ${profile.profileType}
    - Name: ${profile.name}
    - Industry: ${profile.industry}
    - Stage: ${profile.stage}
    - Description: ${profile.description}
    - Funding Needs: ${profile.fundingNeeds}

    **Grant Opportunity:**
    - Name: ${grant.name}
    - Description: ${grant.description}

    **Your Task:**
    Produce a draft for the '${section}' section. The output must be ONLY the text of the draft itself, with no introductory or concluding remarks.
  `;

  const response = await ai.models.generateContent({
    model: chatModel,
    contents: prompt,
    config: {
      temperature: 0.8,
      topK: 40,
      topP: 0.95
    }
  });

  return response.text;
};

export const reviewApplication = async (grant: GrantOpportunity, drafts: GrantDraft[]): Promise<ApplicationReview> => {
  const applicationContent = drafts.map(d => `--- ${d.section} ---\n${d.content}`).join('\n\n');

  const prompt = `
    You are an experienced member of a grant review committee. Your task is to provide a final, critical review of a grant application package before it is submitted. Be honest, insightful, and constructive.

    **Core Directives:**
    1.  **Analyze Holistically:** Read the entire application package in the context of the Grant Opportunity's description.
    2.  **Provide a Score:** Based on your analysis, provide an 'overallScore'. The possible scores are:
        - "Strong Contender": The application is compelling, well-aligned, and has a high chance of success.
        - "Promising": The application has a solid foundation but needs specific improvements to be truly competitive.
        - "Needs Revision": The application has significant gaps or misalignments that must be addressed before submission.
    3.  **Identify Strengths:** List the most compelling aspects of the application. What makes it stand out?
    4.  **Give Actionable Recommendations:** Provide a list of specific, actionable recommendations for improvement. Reference specific sections where possible.

    **Grant Opportunity:**
    - Name: ${grant.name}
    - Description: ${grant.description}

    **Applicant's Drafts:**
    ${applicationContent}

    **Your Task:**
    Return your analysis ONLY as a single, valid JSON object that strictly adheres to the provided schema. Do not include any text outside the JSON object.
  `;
  
  const response = await ai.models.generateContent({
    model: chatModel,
    contents: prompt,
    config: {
      temperature: 0.4,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallScore: {
            type: Type.STRING,
            description: 'The reviewer\'s final assessment of the application\'s competitiveness (Strong Contender, Promising, Needs Revision).'
          },
          strengths: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of the application's most compelling strengths."
          },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of specific, actionable recommendations for improvement."
          }
        },
        required: ["overallScore", "strengths", "recommendations"]
      }
    }
  });
  
  const reviewData = parseJsonFromMarkdown(response.text);
  return { ...reviewData, generatedAt: new Date().toISOString() };
};

export const runRedTeamReview = async (grant: GrantOpportunity, drafts: GrantDraft[]): Promise<RedTeamReview> => {
  const applicationContent = drafts.map(d => `--- ${d.section} ---\n${d.content}`).join('\n\n');

  const prompt = `
    You are a highly skeptical and critical member of a grant review committee's 'Red Team'. Your sole purpose is to find every potential flaw, logical gap, ambiguity, and weakness in this application before it gets submitted. Do not be encouraging or provide constructive suggestions; your job is to stress-test the proposal by being adversarial.

    **Core Directives:**
    1.  **Assess Risk**: Based on the vulnerabilities, provide an 'overallRisk' assessment: "High" (major, potentially fatal flaws), "Medium" (significant issues that need addressing), or "Low" (minor issues, but still worth noting).
    2.  **Identify Vulnerabilities**: List the most significant weaknesses, unspoken assumptions, or logical gaps in the proposal.
    3.  **Generate Probing Questions**: Create a list of tough, specific questions that a skeptical reviewer would ask during a Q&A or that would be raised in a closed-door review session. These questions should challenge the core assertions of the application.
    
    **Grant Opportunity:**
    - Name: ${grant.name}
    - Description: ${grant.description}

    **Applicant's Drafts:**
    ${applicationContent}

    **Your Task:**
    Return your analysis ONLY as a single, valid JSON object that strictly adheres to the provided schema. Do not include any text outside the JSON object.
  `;
  
  const response = await ai.models.generateContent({
    model: chatModel,
    contents: prompt,
    config: {
      temperature: 0.6,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallRisk: {
            type: Type.STRING,
            description: 'The overall risk assessment of the application being rejected due to its flaws (High, Medium, Low).'
          },
          vulnerabilities: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of the application's most significant weaknesses and logical gaps."
          },
          probingQuestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of tough, specific questions a skeptical reviewer would ask."
          }
        },
        required: ["overallRisk", "vulnerabilities", "probingQuestions"]
      }
    }
  });
  
  const reviewData = parseJsonFromMarkdown(response.text);
  return { ...reviewData, generatedAt: new Date().toISOString() };
};

export const generateBudgetJustification = async (grant: GrantOpportunity, drafts: GrantDraft[], budgetItem: Pick<BudgetItem, 'description' | 'amount'>): Promise<string> => {
  const relevantDrafts = drafts
    .filter(d => d.section.toLowerCase().includes('goals') || d.section.toLowerCase().includes('objectives') || d.section.toLowerCase().includes('activities') || d.section.toLowerCase().includes('summary'))
    .map(d => `--- ${d.section} ---\n${d.content}`)
    .join('\n\n');

  const prompt = `
    You are an expert grant writer tasked with creating a compelling 'Budget Narrative'. Your sole focus is to justify a single line item from the project budget.

    **Core Task:**
    Write a concise, persuasive justification paragraph for the following budget item. Your justification MUST directly connect the expense to the project's stated goals, objectives, or activities as detailed in the provided application drafts. Explain *how* this specific cost contributes to achieving a tangible project outcome.

    **Grant Context:**
    - Grant Name: ${grant.name}
    - Grant Description: ${grant.description}

    **Budget Line Item to Justify:**
    - Item: "${budgetItem.description}"
    - Amount: $${budgetItem.amount.toLocaleString()}

    **Relevant Application Draft Sections:**
    ${relevantDrafts.length > 0 ? relevantDrafts : "No specific 'Goals' or 'Objectives' drafts were provided. Base the justification on the overall grant description and the budget item's likely purpose."}

    **Output Requirements:**
    - Provide ONLY the text of the justification paragraph.
    - Do not include any introductory phrases like "Here is the justification:" or any markdown formatting.
    - The tone should be professional, clear, and confident.
  `;

  const response = await ai.models.generateContent({
    model: chatModel,
    contents: prompt,
    config: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95
    }
  });

  return response.text.trim();
};

export const draftGrantReport = async (profile: FundingProfile, grant: GrantOpportunity, progressNotes: string): Promise<string> => {
    const prompt = `
    You are an expert grant manager responsible for compliance and reporting. Your task is to draft a professional and data-driven Progress Report.

    **Core Directives:**
    1.  **Adopt a Professional Tone:** Write clearly, concisely, and formally. The report must be credible and respectful of the funder's time.
    2.  **Synthesize Information:**
        -   Reference the original **Grant Opportunity** to recall the project's stated goals.
        -   Integrate the user-provided **Progress Notes & Data** as the core evidence of your achievements.
        -   Use the **Funding Profile** for context on the organization.
    3.  **Structure for Clarity:** Organize the report logically. Start with a brief summary, then detail progress against each of the original goals using the provided notes.
    4.  **Be Data-Driven:** Directly incorporate any metrics, numbers, or key performance indicators from the progress notes. Use placeholders like "[Verify and insert final metric from records]" if a specific number seems needed but is missing.

    **Funding Profile:**
    - Type: ${profile.profileType}
    - Name: ${profile.name}
    - Description: ${profile.description}

    **Original Grant Opportunity:**
    - Name: ${grant.name}
    - Original Description/Goals: ${grant.description}

    **User-Provided Progress Notes & Data:**
    ${progressNotes}

    **Your Task:**
    Produce a draft for a Progress Report. The output must be ONLY the text of the draft itself, suitable for a formal submission. Do not include introductory or concluding remarks outside the report's content.
  `;

  const response = await ai.models.generateContent({
    model: chatModel,
    contents: prompt,
    config: {
      temperature: 0.6,
      topK: 40,
      topP: 0.95
    }
  });

  return response.text;
}

export const createChat = (profile: FundingProfile, grant: GrantOpportunity): Chat => {
  const systemInstruction = `You are an expert grant writing assistant named 'GrantBot'. 
  Your role is to help the user with questions about their grant application.
  You MUST be encouraging, helpful, and professional.
  
  You are assisting with the grant: "${grant.name}".
  
  The user's funding profile is:
  - Type: ${profile.profileType}
  - Name: ${profile.name}
  - Stage: ${profile.stage}
  - Industry: ${profile.industry}
  - Description: ${profile.description}
  - Specific Funding Needs: ${profile.fundingNeeds}
  
  Base your responses on this profile and grant context. Keep responses concise and focused on the user's request.`;

  return ai.chats.create({
    model: chatModel,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.7,
      thinkingConfig: { thinkingBudget: 0 } 
    }
  });
};

export const sendMessageToChat = async (chat: Chat, message: string): Promise<string> => {
    let fullResponse = "";
    const result = await chat.sendMessageStream({ message });
    for await (const chunk of result) {
      if (chunk.text) {
        fullResponse += chunk.text;
      }
    }
    return fullResponse;
};