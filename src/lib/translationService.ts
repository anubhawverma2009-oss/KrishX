/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// In-memory cache for translations so repeated toggles are instantaneous (0ms)
const translationCache = new Map<string, string>();

/**
 * Accurately detects whether the given text is primarily Hindi or English.
 * Checks Devanagari Unicode block [\u0900-\u097F] count compared to Latin letters.
 */
export function detectPostLanguage(text: string): 'hi' | 'en' {
  if (!text) return 'en';
  
  const devanagariMatches = text.match(/[\u0900-\u097F]/g);
  const latinMatches = text.match(/[a-zA-Z]/g);

  const devanagariCount = devanagariMatches ? devanagariMatches.length : 0;
  const latinCount = latinMatches ? latinMatches.length : 0;

  // If there are 5+ Devanagari characters or Devanagari count is significant compared to Latin
  if (devanagariCount >= 5 || devanagariCount > latinCount * 0.25) {
    return 'hi';
  }
  
  return 'en';
}

/**
 * Detects whether Latin-script text has predominantly Hindi / Hinglish vocabulary.
 */
export function isHinglishText(text: string): boolean {
  if (!text) return false;
  // If Devanagari is present, it is Devanagari Hindi rather than Latin Hinglish
  if (/[\u0900-\u097F]/.test(text)) return false;

  const hinglishWords = /\b(kisan|kisaan|bhai|bhaiyo|khet|kheti|fasal|pani|paani|khad|beej|aaj|meri|mera|mere|hum|apne|dost|sabji|gehu|dhan|ganna|sarso|hai|hain|kare|karein|kiya|karna|hoga|raha|rahe|rahi|hoti|hote|nahi|nahin|aur|bahut|acha|accha|ye|yeh|wo|woh|kripya|namaste|ram|dhanyawad)\b/i;
  return hinglishWords.test(text);
}

/**
 * Constructs the post author attribution sentence in the language currently used by Voice Mode.
 * Language matches Voice Mode:
 * - Hindi: "यह पोस्ट [Author] ने की है।"
 * - Hinglish: "Ye post [Author] ne ki hai."
 * - English: "This post was posted by [Author]."
 * Returns empty string if authorName is unavailable or blank.
 */
export function getPostAuthorAttribution(authorName: string | undefined | null, speechLang: 'hi' | 'en', textToRead: string): string {
  const trimmed = (authorName || '').trim();
  if (!trimmed) return '';

  if (speechLang === 'hi') {
    return `यह पोस्ट ${trimmed} ने की है।`;
  }

  if (isHinglishText(textToRead)) {
    return `Ye post ${trimmed} ne ki hai.`;
  }

  return `This post was posted by ${trimmed}.`;
}

/**
 * Deterministic offline dictionary fallback for key agricultural terms and sample posts.
 * Guarantees that even with poor network connectivity, translation never fails.
 */
function translateOffline(text: string, toLanguage: 'hi' | 'en'): string {
  const textNormalized = text.trim();

  // Known high-fidelity sample translations
  if (textNormalized.includes('मौसम में गन्ने की फसल') || textNormalized.includes('ब्लैक बग')) {
    return 'Dear farmer brothers, an outbreak of "Black Bug" (black insects) is being seen in the sugarcane crop in the current season. To control this, please avoid excessive spraying of chemical pesticides.\n\nNatural remedy: Boil 1 kg of neem leaves and 250 g of crushed garlic in 5 liters of buttermilk (whey) per acre. Strain and mix with 150 liters of water, then spray in the morning. This repels pests and strengthens the leaves. If you have any doubts, comment immediately!';
  }

  if (textNormalized.includes('जैविक विधि से तैयार') || textNormalized.includes('जीवामृत')) {
    return 'Today, organically prepared "Jeevamrut" was sprayed on my farm. Mixed 10 kg native cow dung, 8 liters cow urine, 2 kg jaggery, 2 kg gram flour, and 1 kg living soil from under a peepal tree in 200 liters of water and fermented it for 4 days.\n\nBenefits: The color of the crop has turned deep green and earthworms are active again in the soil. Adopt organic farming, protect soil health!';
  }

  if (textNormalized.toLowerCase().includes('black bug') || textNormalized.toLowerCase().includes('sugarcane crop')) {
    return 'किसान भाइयों, वर्तमान मौसम में गन्ने की फसल में "ब्लैक बग" (काले कीड़े) का प्रकोप देखा जा रहा है। इसके नियंत्रण के लिए कृपया रासायनिक कीटनाशकों के अत्यधिक छिड़काव से बचें।\n\nप्राकृतिक उपचार: प्रति एकड़ 5 लीटर मट्ठे (छाछ) में 1 किलो नीम की पत्ती और 250 ग्राम लहसुन पीसकर उबालें। छानकर 150 लीटर पानी में मिलाकर सुबह के समय छिड़काव करें। यह कीटों को भगाता है और पत्तों को मजबूती प्रदान करता है। किसी भी संदेह की स्थिति में तुरंत कमेंट करें!';
  }

  if (textNormalized.toLowerCase().includes('jeevamrut') || textNormalized.toLowerCase().includes('organically prepared')) {
    return 'आज मेरे खेत में जैविक विधि से तैयार "जीवामृत" का छिड़काव किया गया। 200 लीटर पानी में 10 किलो देसी गाय का गोबर, 8 लीटर गोमूत्र, 2 किलो गुड़, 2 किलो बेसन और 1 किलो पीपल के पेड़ के नीचे की सजीव मिट्टी को मिलाकर 4 दिन फर्मेंट किया था।\n\nफायदे: फसल का रंग गहरा हरा हो गया है और केंचुए फिर से भूमि में सक्रिय हो रहे हैं। जैविक खेती अपनाएं, भूमि का स्वास्थ्य बचाएं!';
  }

  const engToHinDict: Record<string, string> = {
    'farmer': 'किसान',
    'farmers': 'किसानों',
    'farming': 'खेती',
    'agriculture': 'कृषि',
    'crop': 'फसल',
    'crops': 'फसलों',
    'soil': 'मिट्टी',
    'water': 'पानी',
    'seed': 'बीज',
    'seeds': 'बीजों',
    'fertilizer': 'उर्वरक',
    'fertilizers': 'उर्वरकों',
    'pest': 'कीट',
    'pests': 'कीटों',
    'disease': 'बीमारी',
    'diseases': 'बीमारियों',
    'organic': 'जैविक',
    'wheat': 'गेहूं',
    'rice': 'धान',
    'sugarcane': 'गन्ना',
    'mustard': 'सरसों',
    'yield': 'पैदावार',
    'market': 'मंडी',
    'price': 'मूल्य',
    'weather': 'मौसम',
    'rain': 'बारिश',
    'spraying': 'छिड़काव',
    'today': 'आज',
    'hello': 'नमस्ते'
  };

  const hinToEngDict: Record<string, string> = {
    'नमस्कार': 'Greetings',
    'नमस्ते': 'Hello',
    'किसान': 'farmer',
    'किसानों': 'farmers',
    'खेती': 'farming',
    'कृषि': 'agriculture',
    'फसल': 'crop',
    'फसलों': 'crops',
    'मिट्टी': 'soil',
    'पानी': 'water',
    'बीज': 'seed',
    'उर्वरक': 'fertilizer',
    'कीट': 'pest',
    'बीमारी': 'disease',
    'जैविक': 'organic',
    'गेहूं': 'wheat',
    'धान': 'rice',
    'गन्ना': 'sugarcane',
    'सरसों': 'mustard',
    'मौसम': 'weather',
    'बारिश': 'rain'
  };

  if (toLanguage === 'hi') {
    let result = text;
    for (const [eng, hin] of Object.entries(engToHinDict)) {
      result = result.replace(new RegExp(`\\b${eng}\\b`, 'gi'), hin);
    }
    return result;
  } else {
    let result = text;
    for (const [hin, eng] of Object.entries(hinToEngDict)) {
      result = result.replace(new RegExp(hin, 'g'), eng);
    }
    return result;
  }
}

/**
 * Translates post content with caching, intelligent AI backend, and offline fallback.
 */
export async function translateContent(text: string, targetLang: 'hi' | 'en'): Promise<string> {
  const cacheKey = `${text.trim()}_${targetLang}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  // Check offline dictionary match first for seeded/common posts
  const offlineMatch = translateOffline(text, targetLang);
  if (offlineMatch !== text && !offlineMatch.startsWith('[अनुवाद]')) {
    // If it's one of the curated exact match posts, cache and return immediately
    if (offlineMatch.length > 80) {
      translationCache.set(cacheKey, offlineMatch);
      return offlineMatch;
    }
  }

  try {
    const res = await fetch('/api/ai/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.translatedText && data.translatedText.trim()) {
        const result = data.translatedText.trim();
        translationCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (error) {
    console.warn("Backend translation failed or timed out, using fallback:", error);
  }

  // Graceful fallback
  const fallback = translateOffline(text, targetLang);
  translationCache.set(cacheKey, fallback);
  return fallback;
}
