import re

with open('src/components/AIAssistant.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update handleSendMessage to inject structure format
format_instruction = r"""
    if (image) {
      const formatStr = `\n\nPlease analyze the image for crop diseases, leaf damage, pest attacks, nutrient deficiencies, and general crop health. Present your response EXACTLY in this structured format, using simple and easy-to-understand language for farmers:\n\n🌿 Problem Detected\n[Your findings here]\n\n📖 Possible Reason\n[Reasons here]\n\n✅ Recommended Solution\n[Solutions here]\n\n⚠ Prevention Tips\n[Tips here]`;
      if (!text) {
        finalQueryText += formatStr;
      } else {
        finalQueryText = text + formatStr;
      }
    }
"""

content = content.replace("    const newUserMessage: ChatMessage = {", format_instruction + "\n    const newUserMessage: ChatMessage = {")

with open('src/components/AIAssistant.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
