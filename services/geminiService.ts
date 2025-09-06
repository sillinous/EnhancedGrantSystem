
import { GoogleGenAI, GenerateContentResponse, Chat, Type } from "@google/genai";
import { FundingProfile, GrantOpportunity, ChatMessage, EligibilityReport, LifecycleStage, LifecycleInsights, GrantDraft, ApplicationReview } from '../types';

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
