// Client-side wrappers proxying requests to the secure backend server.
// Client requests are proxied through the backend. Only health advice has a local knowledge fallback.
import { processOfflineQuery } from './offlineKnowledgeBase';

export const generateHealthAdvice = async (query: string, userContext: string) => {
  // If browser is offline, instantly return local knowledge engine result
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const offlineResult = processOfflineQuery(query);
    return offlineResult.response;
  }

  try {
    const response = await fetch('/api/gemini/advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, userContext })
    });
    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.warn("Using offline knowledge engine for health advice fallback:", error);
    const offlineResult = processOfflineQuery(query);
    return offlineResult.response;
  }
};

export const generateAdvocacyPetition = async (issue: string, region: string) => {
  try {
    const response = await fetch('/api/gemini/advocacy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issue, region })
    });
    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Gemini Advocacy proxy error:", error);
    return `Formal petition draft: Advocacy for ${issue} in ${region} is crucial to secure medication access and improve sickle cell services in the community.`;
  }
};

export const generateGameStory = async (conceptTitle: string) => {
  try {
    const response = await fetch('/api/gemini/game-story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conceptTitle })
    });
    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Gemini Game Story proxy error:", error);
    return "In a world where every oxygen molecule is a resource, you must defend the red cell pathway...";
  }
};

export const generateMoodAdvice = async (
  emotion: string,
  intensity: number,
  symptoms: string[],
  journalText: string
) => {
  try {
    const response = await fetch('/api/gemini/mood-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emotion, intensity, symptoms, journalText })
    });
    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Gemini Mood Response proxy error:", error);
    return `I hear you and honor what you're feeling right now. Navigating ${emotion || 'emotional burden'} alongside physical symptoms takes immense strength. Take a slow, comforting breath and know you are not alone on this warrior journey.`;
  }
};

export const generatePatternInsights = async (
  painLogs: any[],
  hydrationLogs: any[],
  moodLogs: any[],
  symptomLogs: any[],
  patientContext: any
) => {
  try {
    const response = await fetch('/api/gemini/pattern-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ painLogs, hydrationLogs, moodLogs, symptomLogs, patientContext })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Pattern insights error:", error);
    throw new Error('Generated pattern insights are unavailable.');
  }
};

export const generateDoctorReport = async (
  patientInfo: any,
  summaryStats: any,
  recentLogs: any
) => {
  try {
    const response = await fetch('/api/gemini/doctor-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientInfo, summaryStats, recentLogs })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.reportMarkdown;
  } catch (error) {
    console.error("Doctor report error:", error);
    throw new Error('Generated discussion summary is unavailable.');
  }
};
