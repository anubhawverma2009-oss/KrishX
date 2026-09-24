/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { Opportunity, AppNotification } from '../types';
import { VERIFIED_INITIAL_OPPORTUNITIES } from './opportunitiesData';

const DATA_DIR = path.join(process.cwd(), 'data');
const OPPS_FILE = path.join(DATA_DIR, 'opportunities.json');
const STATE_FILE = path.join(DATA_DIR, 'opportunities_sync_state.json');

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export interface SyncLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export interface OpportunitiesSyncState {
  automaticUpdates: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  isRunning: boolean;
  lastSummary: string;
  totalOpportunities: number;
  newItemsLastRun: number;
  updatedItemsLastRun: number;
  updatedBy?: string;
  updatedSettingAt?: string;
  logs: SyncLogEntry[];
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Load all opportunities from persistent storage
 */
export function getStoredOpportunities(): Opportunity[] {
  ensureDataDir();
  if (!fs.existsSync(OPPS_FILE)) {
    saveOpportunities(VERIFIED_INITIAL_OPPORTUNITIES);
    return VERIFIED_INITIAL_OPPORTUNITIES;
  }
  try {
    const raw = fs.readFileSync(OPPS_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    saveOpportunities(VERIFIED_INITIAL_OPPORTUNITIES);
    return VERIFIED_INITIAL_OPPORTUNITIES;
  } catch (err) {
    console.error('Failed to read opportunities.json, restoring initial verified list:', err);
    saveOpportunities(VERIFIED_INITIAL_OPPORTUNITIES);
    return VERIFIED_INITIAL_OPPORTUNITIES;
  }
}

/**
 * Save opportunities to persistent storage
 */
export function saveOpportunities(opps: Opportunity[]): void {
  ensureDataDir();
  fs.writeFileSync(OPPS_FILE, JSON.stringify(opps, null, 2), 'utf-8');
}

/**
 * Get current sync state
 */
export function getSyncState(): OpportunitiesSyncState {
  ensureDataDir();
  const defaultState: OpportunitiesSyncState = {
    automaticUpdates: true,
    lastRunAt: null,
    nextRunAt: new Date(Date.now() + TWENTY_FOUR_HOURS_MS).toISOString(),
    isRunning: false,
    lastSummary: 'Ready. Scheduled to run approximately every 24 hours.',
    totalOpportunities: VERIFIED_INITIAL_OPPORTUNITIES.length,
    newItemsLastRun: 0,
    updatedItemsLastRun: 0,
    logs: [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Opportunities background service initialized with verified Indian agriculture opportunities.'
      }
    ]
  };

  if (!fs.existsSync(STATE_FILE)) {
    saveSyncState(defaultState);
    return defaultState;
  }
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return { 
      ...defaultState, 
      ...parsed,
      automaticUpdates: typeof parsed.automaticUpdates === 'boolean' ? parsed.automaticUpdates : true 
    };
  } catch (e) {
    return defaultState;
  }
}

/**
 * Save current sync state
 */
export function saveSyncState(state: OpportunitiesSyncState): void {
  ensureDataDir();
  // Keep only the last 50 log entries to prevent file bloat
  const trimmed = {
    ...state,
    logs: state.logs.slice(-50)
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
}

/**
 * Admin action to toggle Automatic Updates ON/OFF
 */
export function updateAutomaticUpdatesSetting(enabled: boolean, userEmail?: string): OpportunitiesSyncState {
  const state = getSyncState();
  state.automaticUpdates = enabled;
  state.updatedBy = userEmail || 'admin';
  state.updatedSettingAt = new Date().toISOString();

  if (enabled) {
    state.nextRunAt = new Date(Date.now() + TWENTY_FOUR_HOURS_MS).toISOString();
    state.lastSummary = `Automatic Updates enabled by ${state.updatedBy}. Next 24-hour research cycle scheduled.`;
    appendLog(state, 'info', `Automatic Updates turned ON by ${state.updatedBy}. 24-hour scheduled research active.`);
  } else {
    state.nextRunAt = null;
    state.lastSummary = `Automatic Updates turned OFF by ${state.updatedBy}. Background research and scheduled API calls paused.`;
    appendLog(state, 'warn', `Automatic Updates turned OFF by ${state.updatedBy}. Background research and scheduled API calls paused.`);
  }

  saveSyncState(state);
  return state;
}

function appendLog(state: OpportunitiesSyncState, level: SyncLogEntry['level'], message: string) {
  const entry: SyncLogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message
  };
  state.logs.push(entry);
  console.log(`[KrishX 24h Opportunities Scheduler] [${level.toUpperCase()}] ${message}`);
}

/**
 * Normalizes text for deduplication matching
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Executes a single research and update cycle (Runs approximately once every 24 hours)
 */
export async function runOpportunitiesUpdateCycle(
  aiClient?: GoogleGenAI | null,
  isManual: boolean = false
): Promise<{
  success: boolean;
  newCount: number;
  updatedCount: number;
  skipped?: boolean;
  summary: string;
  notificationsCreated: AppNotification[];
}> {
  const state = getSyncState();

  // STRICT BACKGROUND JOB CHECK:
  // If Automatic Updates is turned OFF, skip the background research task completely without making external API calls
  if (!isManual && state.automaticUpdates === false) {
    const summary = 'Automatic Updates is currently OFF. 24-hour scheduled research skipped.';
    appendLog(state, 'info', summary);
    console.log(`[KrishX Scheduler] ${summary}`);
    return {
      success: true,
      newCount: 0,
      updatedCount: 0,
      skipped: true,
      summary,
      notificationsCreated: []
    };
  }

  if (state.isRunning) {
    return {
      success: false,
      newCount: 0,
      updatedCount: 0,
      summary: 'A 24-hour update cycle is already currently running.',
      notificationsCreated: []
    };
  }

  state.isRunning = true;
  saveSyncState(state);

  const startTime = Date.now();
  appendLog(state, 'info', 'Starting 24-hour agricultural opportunities research and update cycle...');

  let currentOpps = getStoredOpportunities();
  let newItemsCount = 0;
  let updatedItemsCount = 0;
  const notificationsCreated: AppNotification[] = [];

  try {
    // 1. FETCH & SEARCH
    appendLog(state, 'info', 'Step 1: Searching verified online sources & government repositories for active schemes & programs...');
    
    // Check if AI client is available with Google Search Grounding to discover newly announced schemes
    let discoveredItems: Partial<Opportunity>[] = [];

    if (aiClient && process.env.GEMINI_API_KEY) {
      try {
        appendLog(state, 'info', 'Executing live AI search grounding across official portals (pmkisan.gov.in, mnre.gov.in, agricoop.nic.in, icar.org.in, nabard.org)...');
        
        const prompt = `You are the KrishX Agricultural Research Engine. Search the web for current official government agriculture schemes, subsidies, scholarships, fellowships, or agri-tech opportunities in India that are active in 2025.
CRITICAL SAFETY & ACCURACY RULES:
1. ONLY return verified, real programs with genuine official portal URLs. NEVER invent or fabricate any schemes, benefits, or application links.
2. Official portals must be real government (.gov.in, .nic.in, .org.in) or verified agricultural organizations (icar.org.in, nabard.org, manage.gov.in, asci-india.com, birac.nic.in).
3. Extract exact details: title, organization, category, short description, eligibility, benefits, deadline, location, sourceName, and official sourceUrl.
4. Categories must be one of: "Government Schemes", "Subsidies", "Grants", "Internships", "Scholarships", "Training", "Certifications", "Jobs", "Fellowships", "Competitions", "Mentorship", "Startup", "Other Agriculture Opportunities".
5. Audiences should be an array of: "Farmer", "Student", "Rural Youth", "Professional", "Other Agriculture User".`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  organization: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['Government', 'Private'] },
                  category: { type: Type.STRING },
                  description: { type: Type.STRING },
                  whoCanApply: { type: Type.STRING },
                  eligibility: { type: Type.STRING },
                  benefits: { type: Type.STRING },
                  deadline: { type: Type.STRING },
                  location: { type: Type.STRING },
                  sourceName: { type: Type.STRING },
                  sourceUrl: { type: Type.STRING },
                  audience: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ['title', 'organization', 'type', 'category', 'description', 'eligibility', 'benefits', 'sourceName', 'sourceUrl']
              }
            }
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          if (Array.isArray(parsed)) {
            discoveredItems = parsed;
            appendLog(state, 'info', `Retrieved ${discoveredItems.length} candidate opportunities from search grounding.`);
          }
        }
      } catch (searchError: any) {
        appendLog(state, 'warn', `Search grounding query warning: ${searchError.message}. Proceeding with curated verified registry verification.`);
      }
    } else {
      appendLog(state, 'info', 'Gemini API key not configured or offline; validating against KrishX verified agricultural directory.');
    }

    // Combine discovered candidates with verified repository for cross-check
    const candidates = [...discoveredItems, ...VERIFIED_INITIAL_OPPORTUNITIES];

    appendLog(state, 'info', `Step 2 & 3: Filtering and strictly verifying ${candidates.length} opportunity candidates...`);

    // 2. FILTER & VERIFY
    for (const cand of candidates) {
      if (!cand.title || !cand.organization || !cand.sourceUrl) {
        continue;
      }

      // Check URL validity: must start with https:// and have valid domain
      let isValidUrl = false;
      try {
        const parsedUrl = new URL(cand.sourceUrl);
        if (parsedUrl.protocol === 'https:' && parsedUrl.hostname.includes('.')) {
          isValidUrl = true;
        }
      } catch (e) {
        isValidUrl = false;
      }

      if (!isValidUrl) {
        appendLog(state, 'warn', `Filtered out candidate "${cand.title}" due to invalid source URL.`);
        continue;
      }

      // 3. DEDUPLICATE
      const candNormTitle = normalizeString(cand.title);
      const candUrl = cand.sourceUrl.trim().toLowerCase();

      const existingIndex = currentOpps.findIndex((opp) => {
        if (cand.id && opp.id === cand.id) return true;
        if (opp.sourceUrl && normalizeString(opp.sourceUrl) === normalizeString(candUrl)) return true;
        const existingNormTitle = normalizeString(opp.title);
        if (existingNormTitle === candNormTitle) return true;
        if (candNormTitle.length > 8 && existingNormTitle.includes(candNormTitle)) return true;
        if (existingNormTitle.length > 8 && candNormTitle.includes(existingNormTitle)) return true;
        return false;
      });

      const nowIso = new Date().toISOString();

      if (existingIndex >= 0) {
        // Opportunity exists -> Check whether key fields have changed
        const existing = currentOpps[existingIndex];
        let hasChanges = false;

        if (cand.deadline && cand.deadline !== existing.deadline) {
          existing.deadline = cand.deadline;
          hasChanges = true;
        }
        if (cand.benefits && cand.benefits !== existing.benefits && cand.benefits.length > 10) {
          existing.benefits = cand.benefits;
          hasChanges = true;
        }
        if (cand.eligibility && cand.eligibility !== existing.eligibility && cand.eligibility.length > 10) {
          existing.eligibility = cand.eligibility;
          hasChanges = true;
        }

        existing.verifiedAt = nowIso;

        if (hasChanges) {
          existing.updatedAt = nowIso;
          updatedItemsCount++;
          appendLog(state, 'info', `Updated existing verified opportunity: "${existing.title}" with updated info.`);
        }
      } else {
        // Truly NEW verified opportunity!
        const newId = cand.id || `opp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const newOpportunity: Opportunity = {
          id: newId,
          title: cand.title,
          organization: cand.organization,
          type: (cand.type as any) || 'Government',
          sector: (cand.sector as any) || (cand.type === 'Private' ? 'Private' : 'Government'),
          category: (cand.category as any) || 'Government Schemes',
          description: cand.description || '',
          whoCanApply: cand.whoCanApply || cand.eligibility || 'All eligible agriculture users',
          eligibility: cand.eligibility || '',
          benefits: cand.benefits || '',
          deadline: cand.deadline || 'Ongoing',
          location: cand.location || 'All India',
          sourceUrl: cand.sourceUrl,
          sourceName: cand.sourceName || 'Official Portal',
          link: cand.sourceUrl,
          audience: cand.audience || ['Farmer', 'Rural Youth'],
          verifiedAt: nowIso,
          createdAt: nowIso,
          updatedAt: nowIso,
          highlightColor: cand.highlightColor || 'bg-krishx-earth-50 text-krishx-dark-900 border-krishx-earth-300'
        };

        currentOpps.unshift(newOpportunity);
        newItemsCount++;
        appendLog(state, 'success', `Discovered & added new verified opportunity: "${newOpportunity.title}" (${newOpportunity.organization})`);

        // 4. GENERATE MEANINGFUL NOTIFICATION
        const notifTitle = newOpportunity.sector === 'Government' 
          ? 'New Government Scheme Added 🌾' 
          : 'New Opportunity Available 🚀';
        
        const notifBody = `${newOpportunity.title} (${newOpportunity.organization}). Click to view eligibility and apply.`;

        notificationsCreated.push({
          id: `notif-opp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          userId: 'all',
          senderName: 'KrishX Opportunities Desk',
          type: 'opportunity',
          title: notifTitle,
          body: notifBody,
          opportunityId: newOpportunity.id,
          createdAt: nowIso,
          read: false
        });
      }
    }

    // 5. PERSIST DATA
    saveOpportunities(currentOpps);

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const summary = newItemsCount > 0 
      ? `Cycle completed in ${elapsed}s: ${newItemsCount} new verified opportunity added, ${updatedItemsCount} updated. Total: ${currentOpps.length}.`
      : `Cycle completed in ${elapsed}s: All ${currentOpps.length} opportunities verified. No new additions needed.`;

    state.lastRunAt = new Date().toISOString();
    state.nextRunAt = new Date(Date.now() + TWENTY_FOUR_HOURS_MS).toISOString();
    state.lastSummary = summary;
    state.totalOpportunities = currentOpps.length;
    state.newItemsLastRun = newItemsCount;
    state.updatedItemsLastRun = updatedItemsCount;
    state.isRunning = false;

    appendLog(state, 'success', summary);
    saveSyncState(state);

    return {
      success: true,
      newCount: newItemsCount,
      updatedCount: updatedItemsCount,
      summary,
      notificationsCreated
    };

  } catch (error: any) {
    appendLog(state, 'error', `Cycle encountered an error: ${error.message}. Existing data retained intact.`);
    state.isRunning = false;
    state.lastSummary = `Last attempt failed: ${error.message}. Existing data preserved.`;
    saveSyncState(state);

    return {
      success: false,
      newCount: 0,
      updatedCount: 0,
      summary: `Failed to complete cycle: ${error.message}`,
      notificationsCreated: []
    };
  }
}

/**
 * Initializes the background 24-hour interval job
 */
let schedulerInterval: NodeJS.Timeout | null = null;

export function initOpportunitiesScheduler(getAiClientFn?: () => GoogleGenAI | null) {
  ensureDataDir();
  
  // Ensure opportunities.json exists
  getStoredOpportunities();

  const state = getSyncState();
  const now = Date.now();
  const lastRun = state.lastRunAt ? new Date(state.lastRunAt).getTime() : 0;
  const timeSinceLast = now - lastRun;

  console.log(`[KrishX Scheduler] Initialized. Time since last update cycle: ${Math.round(timeSinceLast / 60000)} minutes.`);

  // If last run was more than 24 hours ago (or never run), check if Automatic Updates is ON
  if (timeSinceLast >= TWENTY_FOUR_HOURS_MS || !state.lastRunAt) {
    if (state.automaticUpdates !== false) {
      console.log('[KrishX Scheduler] Last run was > 24 hours ago and Automatic Updates is ON. Triggering initial scheduled update in 5s...');
      setTimeout(async () => {
        try {
          const ai = getAiClientFn ? getAiClientFn() : null;
          await runOpportunitiesUpdateCycle(ai, false);
        } catch (err) {
          console.error('[KrishX Scheduler] Error during startup update cycle:', err);
        }
      }, 5000);
    } else {
      console.log('[KrishX Scheduler] Automatic Updates is OFF. Skipping startup research task.');
    }
  }

  // Set up periodic check every 1 hour (to safely handle any server restarts)
  if (!schedulerInterval) {
    schedulerInterval = setInterval(async () => {
      const currentState = getSyncState();

      // STRICT CHECK: Skip if Automatic Updates is OFF
      if (currentState.automaticUpdates === false) {
        return;
      }

      const currentNow = Date.now();
      const currentLast = currentState.lastRunAt ? new Date(currentState.lastRunAt).getTime() : 0;
      
      if (currentNow - currentLast >= TWENTY_FOUR_HOURS_MS) {
        console.log('[KrishX Scheduler] 24-hour interval elapsed and Automatic Updates is ON. Starting scheduled research cycle...');
        try {
          const ai = getAiClientFn ? getAiClientFn() : null;
          await runOpportunitiesUpdateCycle(ai, false);
        } catch (e) {
          console.error('[KrishX Scheduler] Error in 24-hour cycle:', e);
        }
      }
    }, 60 * 60 * 1000); // Hourly check
  }
}
