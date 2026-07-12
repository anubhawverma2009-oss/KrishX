import re

with open('src/components/AIAssistant.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace message bubbles
content = content.replace(
"""                    <div className={`p-5 rounded-3xl shadow-sm text-[14px] leading-relaxed border ${
                      isAi 
                        ? 'bg-krishx-earth-50/30 border-krishx-earth-200/50 text-krishx-dark-900 rounded-tl-sm' 
                        : 'bg-krishx-green-50/50 border-krishx-green-100 text-krishx-dark-900 rounded-tr-sm'
                    }`}>""",
"""                    <div className={`p-5 rounded-[2rem] shadow-premium-soft text-[15px] leading-relaxed border transition-all duration-300 ${
                      isAi 
                        ? 'bg-white border-krishx-earth-200/60 text-krishx-dark-900 rounded-tl-sm hover:shadow-md hover:border-krishx-earth-300' 
                        : 'bg-krishx-dark-900 border-krishx-dark-800 text-white rounded-tr-sm'
                    }`}>"""
)

# Upload Preview / Type block
content = content.replace(
"""            <div className="bg-krishx-earth-50 p-4 rounded-2xl border border-krishx-earth-200/50 shadow-sm space-y-3">""",
"""            <div className="bg-white p-4 rounded-[2rem] border border-krishx-earth-200/50 shadow-premium-soft space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">"""
)

# Input container polish
content = content.replace(
"""        <div className="p-4 bg-white border-t border-krishx-earth-200/50 space-y-4 shrink-0 rounded-b-[2.5rem]">""",
"""        <div className="p-5 md:p-6 bg-white/95 backdrop-blur-xl border-t border-krishx-earth-200/50 space-y-4 shrink-0 rounded-b-[2.5rem] relative z-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">"""
)

content = content.replace(
"""              className="p-4 bg-krishx-earth-50 text-krishx-dark-700/60 rounded-2xl border border-krishx-earth-200/50 hover:bg-krishx-earth-100 hover:text-krishx-dark-900 transition-colors shrink-0 flex items-center justify-center disabled:opacity-40\"""",
"""              className="p-4 bg-white text-krishx-dark-700/60 rounded-[1.5rem] border border-krishx-earth-200 shadow-sm hover:shadow-md hover:bg-krishx-earth-50 hover:text-krishx-dark-900 hover:scale-105 transition-all duration-300 shrink-0 flex items-center justify-center disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-sm\""""
)

content = content.replace(
"""              className="p-4 bg-krishx-dark-900 text-white rounded-2xl shadow-md hover:bg-krishx-dark-800 disabled:opacity-40 transition-all shrink-0 flex items-center justify-center cursor-pointer\"""",
"""              className="p-4 bg-krishx-dark-900 text-white rounded-[1.5rem] shadow-premium-soft hover:shadow-xl hover:-translate-y-0.5 hover:bg-krishx-dark-800 disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-premium-soft transition-all duration-300 shrink-0 flex items-center justify-center cursor-pointer\""""
)

content = content.replace(
"""              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleSendMessage(inputText)}
                placeholder={t.ai.inputPlaceholder}
                disabled={loading}
                className="premium-input w-full py-4 pl-5 pr-12 text-[14px]"
              />""",
"""              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleSendMessage(inputText)}
                placeholder={isRecording ? (language === 'hi' ? 'सुन रहा हूँ...' : language === 'hinglish' ? 'Sun raha hoon...' : 'Listening...') : t.ai.inputPlaceholder}
                disabled={loading}
                className={`premium-input w-full py-4 pl-6 pr-14 text-[15px] rounded-[1.5rem] shadow-sm transition-all duration-300 ${isRecording ? 'border-rose-300 ring-4 ring-rose-100 bg-rose-50' : 'focus:border-krishx-dark-900 focus:ring-krishx-dark-900/10'}`}
              />"""
)

# Render formatted text changes (more contrast/size)
content = content.replace(
"""      <p key={index} className="my-2 text-[13px] font-medium leading-relaxed text-krishx-dark-900/90">""",
"""      <p key={index} className="my-2 text-[15px] font-medium leading-relaxed text-krishx-dark-900/90">"""
)
content = content.replace(
"""        <div key={index} className="flex items-start gap-2.5 my-2 pl-2 text-[13px] font-medium text-krishx-dark-900/90">""",
"""        <div key={index} className="flex items-start gap-3 my-2.5 pl-2 text-[15px] font-medium text-krishx-dark-900/90">"""
)

# Empty state (if messages.length === 1)
content = content.replace(
"""            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="pt-8 border-t border-krishx-earth-200/50 max-w-xl mx-auto w-full"
            >""",
"""            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
              className="pt-10 border-t border-krishx-earth-200/50 max-w-xl mx-auto w-full mt-8 relative"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-4 text-xs font-bold text-krishx-dark-700/50 uppercase tracking-widest">
                Start a Conversation
              </div>"""
)

content = content.replace(
"""                  <button
                    key={action.id}
                    onClick={() => handleSendMessage(action.prompt)}
                    className="premium-card p-4 hover:shadow-xl hover:shadow-krishx-dark-900/5 hover:border-krishx-earth-300 text-left cursor-pointer transition-all duration-300 group flex items-start gap-3"
                  >""",
"""                  <button
                    key={action.id}
                    onClick={() => handleSendMessage(action.prompt)}
                    className="bg-white border border-krishx-earth-200/80 rounded-[1.5rem] p-5 hover:shadow-premium-soft hover:-translate-y-1 hover:border-krishx-dark-900/20 text-left cursor-pointer transition-all duration-300 group flex items-start gap-4"
                  >"""
)

with open('src/components/AIAssistant.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
