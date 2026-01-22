class BloomMindChatbot {
    constructor() {
        this.messages = [];
        this.isTyping = false;
        this.settings = {
            darkMode: true,
            soundEffects: true,
            animations: true,
            calmMode: false
        };
        this.ttsEnabled = false;
        this.synth = window.speechSynthesis;
        this.currentMood = null;
        this.audioContext = null;
        this.init();
    }
    initAudio() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
            this.breathingAudio = new BreathingAudio(this.audioCtx);
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }
    init() {
        this.cacheElements();
        this.attachEventListeners();
        this.loadSettings();
        this.checkLoginStatus();
        this.updateMoodHistoryUI();
    }
    checkLoginStatus() {
        const username = localStorage.getItem('bloommind-username');
        if (username) {
            this.showChat(username, false);
        } else {
            this.showLogin();
        }
    }
    showLogin() {
        document.getElementById('login-screen').style.display = 'flex';
        document.querySelector('.app-container').style.display = 'none';
        const loginBtn = document.getElementById('login-btn');
        const usernameInput = document.getElementById('username-input');
        const handleLogin = () => {
            const name = usernameInput.value.trim();
            if (name) {
                localStorage.setItem('bloommind-username', name);
                this.showChat(name, true);
            }
        };
        loginBtn.onclick = handleLogin;
        usernameInput.onkeypress = (e) => {
            if (e.key === 'Enter') handleLogin();
        };
    }
    showChat(username, isNewLogin) {
        const loginScreen = document.getElementById('login-screen');
        const appContainer = document.querySelector('.app-container');
        loginScreen.style.opacity = '0';
        loginScreen.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            loginScreen.style.display = 'none';
            appContainer.style.display = 'flex';
            appContainer.style.opacity = '0';
            appContainer.style.transition = 'opacity 0.5s ease';
            requestAnimationFrame(() => {
                appContainer.style.opacity = '1';
                setTimeout(() => {
                    appContainer.style.removeProperty('display');
                }, 500);
            });
        }, 500);
        if (isNewLogin) {
            const welcomeMsg = `Hello ${username}! I'm BloomMind AI, your AI companion for emotional support and motivation. 🌟\n\nI'm here to listen, support you, and help you find your inner strength. How are you feeling today?`;
            this.chatMessages.innerHTML = '';
            this.addMessage(welcomeMsg, 'bot');
            this.playSound('open');
        } else {
            this.loadHistory();
            this.checkDailyAffirmation();
        }
        this.initializeSpeechRecognition();
    }
    cacheElements() {
        this.chatMessages = document.getElementById('chat-messages');
        this.messageInput = document.getElementById('message-input');
        this.sendBtn = document.getElementById('send-btn');
        this.quickActions = document.querySelectorAll('.quick-action-btn');
        this.voiceBtn = document.getElementById('voice-btn');
        this.breathingBtn = document.getElementById('breathing-btn');
        this.breathingModal = document.getElementById('breathing-modal');
        this.breathingSoundBtn = document.getElementById('breathing-sound-btn');
        this.closeBreathingModal = document.getElementById('close-breathing-modal');
        this.breathingCircle = document.querySelector('.breathing-circle');
        this.breathingText = document.querySelector('.breathing-text');
        this.moodModal = document.getElementById('mood-modal');
        this.settingsModal = document.getElementById('settings-modal');
        this.resourcesModal = document.getElementById('resources-modal');
        this.moodTrackerBtn = document.getElementById('mood-tracker-btn');
        this.ttsToggleBtn = document.getElementById('tts-toggle-btn');
        this.settingsBtn = document.getElementById('settings-btn');
        this.getHelpBtn = document.getElementById('get-help-btn');
        this.closeMoodModal = document.getElementById('close-mood-modal');
        this.closeSettingsModal = document.getElementById('close-settings-modal');
        this.closeResourcesModal = document.getElementById('close-resources-modal');
        this.moodBtns = document.querySelectorAll('.mood-btn');
        this.themeToggle = document.getElementById('theme-toggle');
        this.soundToggle = document.getElementById('sound-toggle');
        this.animationsToggle = document.getElementById('animations-toggle');
        this.calmModeToggle = document.getElementById('calm-mode-toggle');
    }
    attachEventListeners() {
        this.sendBtn.addEventListener('click', () => this.handleSendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });
        this.quickActions.forEach(btn => {
            btn.addEventListener('click', () => {
                const message = btn.dataset.message;
                if (message) {
                    this.sendMessage(message);
                }
            });
        });
        this.voiceBtn.addEventListener('click', () => this.toggleVoiceRecognition());
        this.moodTrackerBtn.addEventListener('click', () => this.openModal(this.moodModal));
        this.ttsToggleBtn.addEventListener('click', () => this.toggleTTS());
        this.settingsBtn.addEventListener('click', () => this.openModal(this.settingsModal));
        this.closeMoodModal.addEventListener('click', () => this.closeModal(this.moodModal));
        this.closeSettingsModal.addEventListener('click', () => this.closeModal(this.settingsModal));
        if (this.breathingBtn) {
            this.breathingBtn.addEventListener('click', () => this.startBreathing());
        }
        if (this.closeBreathingModal) {
            this.closeBreathingModal.addEventListener('click', () => this.stopBreathing());
        }
        if (this.breathingModal) {
            this.breathingModal.addEventListener('click', (e) => {
                if (e.target === this.breathingModal) {
                    this.stopBreathing();
                }
            });
        }
        if (this.breathingSoundBtn) {
            this.breathingSoundBtn.addEventListener('click', () => this.toggleBreathingSound());
        }
        if (this.getHelpBtn) {
            this.getHelpBtn.addEventListener('click', () => this.openModal(this.resourcesModal));
        }
        if (this.closeResourcesModal) {
            this.closeResourcesModal.addEventListener('click', () => this.closeModal(this.resourcesModal));
        }
        if (this.resourcesModal) {
            this.resourcesModal.addEventListener('click', (e) => {
                if (e.target === this.resourcesModal) {
                    this.closeModal(this.resourcesModal);
                }
            });
        }
        const clearHistoryBtn = document.getElementById('clear-history-btn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear your conversation history?')) {
                    this.clearHistory();
                }
            });
        }
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to log out? This will reset your session.')) {
                    this.logout();
                }
            });
        }
        [this.moodModal, this.settingsModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.closeModal(modal);
                    }
                });
            }
        });
        this.moodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const mood = btn.dataset.mood;
                this.handleMoodSelection(mood);
            });
        });
        if (this.themeToggle) this.themeToggle.addEventListener('change', () => this.toggleTheme());
        if (this.soundToggle) this.soundToggle.addEventListener('change', () => this.toggleSound());
        if (this.animationsToggle) this.animationsToggle.addEventListener('change', () => this.toggleAnimations());
        if (this.calmModeToggle) this.calmModeToggle.addEventListener('change', () => this.toggleCalmMode());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                [this.moodModal, this.settingsModal, this.resourcesModal, this.breathingModal].forEach(modal => {
                    if (modal && modal.classList.contains('active')) {
                        this.closeModal(modal);
                        if (modal === this.breathingModal) this.stopBreathing();
                    }
                });
            }
        });
    }
    handleSendMessage() {
        const message = this.messageInput.value.trim();
        if (message && !this.isTyping) {
            this.sendMessage(message);
            this.messageInput.value = '';
        }
    }
    async sendToGemini(systemPrompt, userText) {
        const API_KEY = "AIzaSyBCtV6pXAote_bs151SY2DahWH7jBA5EG8";
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        const makeRequest = async (model) => {
            const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
            const fullPrompt = `${systemPrompt}\nUser message: "${userText}"`;
            return fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: fullPrompt }] }]
                }),
                signal: controller.signal
            });
        };
        try {
            let response = await makeRequest('gemini-1.5-flash');
            if (response.status === 404) {
                console.warn("Gemini 1.5 Flash not found, falling back to Gemini Pro");
                response = await makeRequest('gemini-pro');
            }
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`Gemini API Error: ${response.status}`);
            }
            const data = await response.json();
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!reply) throw new Error("Empty response from Gemini");
            return reply;
        } catch (error) {
            clearTimeout(timeoutId);
            console.error("Gemini Request Failed:", error);
            return null;
        }
    }
    async sendMessage(text) {
        this.addMessage(text, 'user');
        this.messageInput.value = '';
        this.isTyping = true;
        this.sendBtn.classList.add('disabled');
        this.showTypingIndicator();
        const currentMood = this.currentMood || 'neutral';
        const recentMessages = this.messages.slice(-12).map(msg =>
            `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`
        ).join('\n');
        const systemInstruction = `You are BloomMind AI — a warm, empathetic mental wellness companion.

Core traits:
- Gentle, non-judgmental, validating
- Brief replies (under 120 words)
- Never give medical advice
- Focus on emotional support, not solutions
- Use natural, conversational language
- Acknowledge feelings before offering perspective

Current user mood: ${currentMood}

Recent conversation:
${recentMessages}

Respond to the user's latest message with compassion and clarity.`;
        try {
            const aiResponse = await this.sendToGemini(systemInstruction, text);
            this.hideTypingIndicator();
            if (aiResponse) {
                this.addMessage(aiResponse, 'bot');
                this.speakResponse(aiResponse);
            } else {
                throw new Error("Fallback needed");
            }
        } catch (err) {
            this.hideTypingIndicator();
            const fallbackMsg = this.generateMockResponse(text);
            this.addMessage(fallbackMsg, 'bot');
            this.speakResponse(fallbackMsg);
            this.addFallbackNotice();
        } finally {
            this.isTyping = false;
            this.sendBtn.classList.remove('disabled');
            this.playSound('message');
        }
    }
    addFallbackNotice() {
        const lastBubble = this.chatMessages.querySelector('.message:last-child .message-bubble');
        if (lastBubble && !lastBubble.querySelector('.fallback-indicator')) {
            const indicator = document.createElement('span');
            indicator.className = 'fallback-indicator';
            indicator.textContent = '⚠️ Offline mode';
            indicator.style.cssText = 'display:block;font-size:0.7rem;opacity:0.6;margin-top:6px;';
            lastBubble.appendChild(indicator);
        }
    }
    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        const time = new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
        if (sender === 'bot') {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <div class="avatar-gradient"></div>
                    <svg viewBox="0 0 26 26" fill="none" class="avatar-icon" xmlns="http://www.w3.org/2000/svg" style="width: 24px; height: 24px; z-index: 2; position: relative;">
                        <circle cx="13" cy="6" r="3" fill="#22c55e"/>
                        <circle cx="6" cy="13" r="3" fill="#22c55e" opacity="0.7"/>
                        <circle cx="20" cy="13" r="3" fill="#22c55e" opacity="0.7"/>
                        <circle cx="13" cy="20" r="3" fill="#22c55e"/>
                        <circle cx="13" cy="13" r="2" fill="#22c55e"/>
                    </svg>
                </div>
                <div class="message-content">
                    <div class="message-bubble">
                        <p>${this.formatMessage(text)}</p>
                    </div>
                    <div class="message-time">${time}</div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-avatar"></div>
                <div class="message-content">
                    <div class="message-bubble">
                        <p>${this.escapeHtml(text)}</p>
                    </div>
                    <div class="message-time">${time}</div>
                </div>
            `;
        }
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        this.messages.push({ text, sender, time });
        this.saveHistory();
    }
    showTypingIndicator() {
        this.isTyping = true;
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-message';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <div class="avatar-gradient"></div>
                <svg viewBox="0 0 26 26" fill="none" class="avatar-icon" xmlns="http://www.w3.org/2000/svg" style="width: 24px; height: 24px; z-index: 2; position: relative;">
                    <circle cx="13" cy="6" r="3" fill="#22c55e"/>
                    <circle cx="6" cy="13" r="3" fill="#22c55e" opacity="0.7"/>
                    <circle cx="20" cy="13" r="3" fill="#22c55e" opacity="0.7"/>
                    <circle cx="13" cy="20" r="3" fill="#22c55e"/>
                    <circle cx="13" cy="13" r="2" fill="#22c55e"/>
                </svg>
            </div>
            <div class="message-content">
                <div class="message-bubble">
                    <div class="typing-indicator">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            </div>
        `;
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }
    hideTypingIndicator() {
        this.isTyping = false;
        const typingMessage = this.chatMessages.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    }
    scrollToBottom() {
        if (!this.chatMessages) return;
        requestAnimationFrame(() => {
            this.chatMessages.scrollTo({
                top: this.chatMessages.scrollHeight,
                behavior: 'smooth'
            });
        });
    }
    loadHistory() {
        const history = localStorage.getItem('bloommind-history');
        if (history) {
            this.messages = JSON.parse(history);
            this.isRestoringHistory = true;
            this.messages.forEach(msg => {
                this.renderMessage(msg.text, msg.sender, msg.time);
            });
            this.isRestoringHistory = false;
        }
    }
    saveHistory() {
        try {
            localStorage.setItem('bloommind-history', JSON.stringify(this.messages));
        } catch (e) {
            console.warn('Storage quota exceeded. Clearing old messages.');
            this.messages = this.messages.slice(-20);
            try {
                localStorage.setItem('bloommind-history', JSON.stringify(this.messages));
            } catch (e2) {
                console.error('Unable to save history');
            }
        }
    }
    clearHistory() {
        this.messages = [];
        localStorage.removeItem('bloommind-history');
        this.chatMessages.innerHTML = '';
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.style.cssText = 'padding:40px 20px;text-align:center;opacity:0.6;';
        emptyState.innerHTML = `
            <p style="font-size:2rem;margin-bottom:12px;">🌱</p>
            <p style="color:var(--text-secondary);">Your conversation has been cleared.</p>
            <p style="color:var(--text-muted);font-size:0.9rem;margin-top:8px;">Start fresh whenever you're ready.</p>
        `;
        this.chatMessages.appendChild(emptyState);
        this.playSound('click');
    }
    logout() {
        localStorage.removeItem('bloommind-username');
        localStorage.removeItem('bloommind-history');
        localStorage.removeItem('bloommind-mood-history');
        localStorage.removeItem('bloommind-settings');
        localStorage.removeItem('bloommind-last-affirmation-date');
        window.location.reload();
    }
    renderMessage(text, sender, time) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        const displayTime = time || new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
        if (sender === 'bot') {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <div class="avatar-gradient"></div>
                    <svg viewBox="0 0 26 26" fill="none" class="avatar-icon" xmlns="http://www.w3.org/2000/svg" style="width: 24px; height: 24px; z-index: 2; position: relative;">
                        <circle cx="13" cy="6" r="3" fill="#22c55e"/>
                        <circle cx="6" cy="13" r="3" fill="#22c55e" opacity="0.7"/>
                        <circle cx="20" cy="13" r="3" fill="#22c55e" opacity="0.7"/>
                        <circle cx="13" cy="20" r="3" fill="#22c55e"/>
                        <circle cx="13" cy="13" r="2" fill="#22c55e"/>
                    </svg>
                </div>
                <div class="message-content">
                    <div class="message-bubble ${this.isRestoringHistory ? 'no-anim' : ''}">
                        <p>${this.formatMessage(text)}</p>
                    </div>
                    <div class="message-time">${displayTime}</div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-avatar"></div>
                <div class="message-content">
                    <div class="message-bubble ${this.isRestoringHistory ? 'no-anim' : ''}">
                        <p>${this.escapeHtml(text)}</p>
                    </div>
                    <div class="message-time">${displayTime}</div>
                </div>
            `;
        }
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }
    checkDailyAffirmation() {
        const lastAffirmationDate = localStorage.getItem('bloommind-last-affirmation-date');
        const today = new Date().toDateString();
        if (lastAffirmationDate !== today) {
            const reflections = [
                "What is one small thing you are grateful for today?",
                "How can you be kind to yourself today?",
                "What is a challenge you've overcome recently that you're proud of?",
                "Who is someone that makes you feel safe and loved?",
                "What is one thing you can do today to bring yourself joy?",
                "If you could say one encouraging thing to yourself right now, what would it be?",
                "What is a goal you are working towards, big or small?",
                "How do you recharge your energy when you feel drained?",
                "What is a happy memory that makes you smile?",
                "What is one thing you appreciate about your personality?"
            ];
            const randomReflection = reflections[Math.floor(Math.random() * reflections.length)];
            setTimeout(() => {
                this.addMessage(`🌟 **Daily Reflection** 🌟\n\n${randomReflection}`, 'bot');
                localStorage.setItem('bloommind-last-affirmation-date', today);
            }, 1500);
        }
    }
    generateMockResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        const responses = {
            sad: [
                "I hear you, and I want you to know that it's okay to feel sad. 💙 Your feelings are valid. Remember, even the darkest nights end with a beautiful sunrise. What's weighing on your heart right now?",
                "I'm here with you. 🌟 Sadness is a natural part of being human, and it shows that you care deeply. Would you like to talk about what's making you feel this way?",
                "Thank you for sharing how you're feeling. 💜 It takes courage to acknowledge sadness. Remember, this feeling is temporary, and brighter days are ahead. How can I support you right now?"
            ],
            stressed: [
                "I can sense you're feeling overwhelmed. 🌊 Let's take a deep breath together. Remember: you don't have to carry everything at once. What's the biggest source of stress for you right now?",
                "Stress can feel heavy, but you're stronger than you know. 💪 Let's break things down into smaller, manageable pieces. What's one thing we can tackle together?",
                "I'm here to help you find calm in the chaos. 🧘♀️ Sometimes, the best thing we can do is pause and breathe. What would help you feel more at ease right now?"
            ],
            anxious: [
                "Anxiety can feel overwhelming, but you're not alone in this. 🤝 Let's ground ourselves in the present moment. Can you name 5 things you can see around you right now?",
                "I understand that anxiety can make everything feel uncertain. 🌈 But remember: you've overcome challenges before, and you can do it again. What's making you feel anxious?",
                "Your feelings are valid, and it's okay to feel anxious. 💚 Let's work through this together. What would help you feel more secure right now?"
            ],
            motivation: [
                "You've got this! 🚀 Every great achievement starts with the decision to try. What goal are you working towards? Let's break it down together!",
                "I believe in you! 💫 Remember, progress isn't always linear, but every step forward counts. What's one small action you can take today?",
                "Your potential is limitless! 🌟 The fact that you're here seeking motivation shows your commitment to growth. What dream are you chasing?"
            ],
            happy: [
                "That's wonderful! 🎉 Your joy is contagious! What's bringing you happiness today? I'd love to celebrate with you!",
                "I'm so glad to hear that! 😊 Happiness looks beautiful on you. What's making your day special?",
                "Amazing! 🌈 Keep riding that positive wave! What's putting that smile on your face?"
            ],
            grateful: [
                "Gratitude is such a powerful emotion! 🙏 It's beautiful that you're taking time to appreciate the good things. What are you grateful for today?",
                "That's wonderful! 💖 Practicing gratitude can transform our perspective. What blessings are you counting today?",
                "I love your positive mindset! ✨ Gratitude opens the door to more abundance. What's filling your heart with thankfulness?"
            ],
            lonely: [
                "I'm here with you, and you're not alone. 🤗 Loneliness can be difficult, but remember that connection is always possible. Would you like to talk about what you're feeling?",
                "Thank you for reaching out. 💙 Even in moments of loneliness, you have the strength within you. I'm here to listen and support you.",
                "You're never truly alone. 🌟 I'm here, and there are people who care about you. What would help you feel more connected right now?"
            ],
            default: [
                "I'm here to listen and support you. 💜 Tell me more about what's on your mind. Your thoughts and feelings matter.",
                "Thank you for sharing with me. 🌟 I'm here to help you navigate whatever you're going through. What would be most helpful for you right now?",
                "I appreciate you opening up. 💙 Remember, every challenge is an opportunity for growth. How can I best support you today?",
                "You're taking a positive step by reaching out. ✨ I'm here to walk alongside you. What's the most important thing you'd like to talk about?"
            ]
        };
        let category = 'default';
        if (lowerMessage.includes('sad') || lowerMessage.includes('down') || lowerMessage.includes('depressed')) {
            category = 'sad';
        } else if (lowerMessage.includes('stress') || lowerMessage.includes('overwhelm') || lowerMessage.includes('pressure')) {
            category = 'stressed';
        } else if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety') || lowerMessage.includes('worried') || lowerMessage.includes('nervous')) {
            category = 'anxious';
        } else if (lowerMessage.includes('motivat') || lowerMessage.includes('inspire') || lowerMessage.includes('goal')) {
            category = 'motivation';
        } else if (lowerMessage.includes('happy') || lowerMessage.includes('great') || lowerMessage.includes('amazing') || lowerMessage.includes('wonderful')) {
            category = 'happy';
        } else if (lowerMessage.includes('grateful') || lowerMessage.includes('thankful') || lowerMessage.includes('blessed')) {
            category = 'grateful';
        } else if (lowerMessage.includes('lonely') || lowerMessage.includes('alone') || lowerMessage.includes('isolated')) {
            category = 'lonely';
        }
        const categoryResponses = responses[category];
        const response = categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
        return response;
    }
    saveMood(mood) {
        const history = JSON.parse(localStorage.getItem('bloommind-mood-history') || '[]');
        history.push({
            mood,
            date: new Date().toISOString()
        });
        if (history.length > 10) history.shift();
        try {
            localStorage.setItem('bloommind-mood-history', JSON.stringify(history));
        } catch (e) {
            console.warn('Could not save mood history');
        }
        this.updateMoodHistoryUI();
    }
    updateMoodHistoryUI() {
        const historyList = document.getElementById('mood-history-list');
        if (!historyList) return;
        const history = JSON.parse(localStorage.getItem('bloommind-mood-history') || '[]');
        if (history.length === 0) {
            historyList.innerHTML = '<span style="color: var(--text-muted); font-size: 0.9rem;">No mood history yet.</span>';
            return;
        }
        const moodEmojis = {
            amazing: '🤩', happy: '😊', okay: '😐', sad: '😔', anxious: '😰'
        };
        historyList.innerHTML = history.reverse().map(entry => `
                <div style="display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 8px; min-width: 60px;">
                <span style="font-size: 1.5rem;">${moodEmojis[entry.mood] || '❓'}</span>
                <span style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px;">${new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short' })}</span>
            </div>
                `).join('');
    }
    formatMessage(text) {
        let formatted = this.escapeHtml(text);
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
        formatted = formatted.replace(/\n/g, '<br>');
        return formatted;
    }
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    initializeSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            if (this.voiceBtn) this.voiceBtn.style.display = 'none';
            return;
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.messageInput.value = transcript;
            if (this.voiceBtn) this.voiceBtn.classList.remove('recording');
        };
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (this.voiceBtn) this.voiceBtn.classList.remove('recording');
        };
        this.recognition.onend = () => {
            if (this.voiceBtn) this.voiceBtn.classList.remove('recording');
        };
    }
    toggleVoiceRecognition() {
        if (!this.recognition) return;
        if (this.voiceBtn.classList.contains('recording')) {
            this.recognition.stop();
            this.voiceBtn.classList.remove('recording');
        } else {
            this.recognition.start();
            this.voiceBtn.classList.add('recording');
            this.playSound('start');
        }
    }
    startBreathing() {
        if (this.breathingInterval) clearInterval(this.breathingInterval);
        this.openModal(this.breathingModal);
        this.initAudio();
        this.breathingAudio.start();
        if (this.breathingSoundBtn) {
            this.breathingSoundBtn.classList.add('active');
            const icon = this.breathingSoundBtn.querySelector('svg');
            icon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>';
        }
        const runCycle = () => {
            this.breathingText.textContent = "Inhale";
            this.breathingCircle.className = 'breathing-circle inhale';
            this.breathingAudio.rampTo('inhale');
            setTimeout(() => {
                if (!this.breathingModal.classList.contains('active')) return;
                this.breathingText.textContent = "Hold";
                this.breathingCircle.className = 'breathing-circle hold';
                this.breathingAudio.rampTo('hold');
                setTimeout(() => {
                    if (!this.breathingModal.classList.contains('active')) return;
                    this.breathingText.textContent = "Exhale";
                    this.breathingCircle.className = 'breathing-circle exhale';
                    this.breathingAudio.rampTo('exhale');
                }, 4000);
            }, 4000);
        };
        runCycle();
        this.breathingInterval = setInterval(runCycle, 12000);
    }
    stopBreathing() {
        this.closeModal(this.breathingModal);
        clearInterval(this.breathingInterval);
        this.breathingCircle.className = 'breathing-circle';
        this.breathingText.textContent = "Inhale";
        if (this.breathingAudio) {
            this.breathingAudio.stop();
        }
    }
    toggleBreathingSound() {
        if (!this.breathingAudio) return;
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        const isMuted = this.breathingAudio.toggleMute();
        const icon = this.breathingSoundBtn.querySelector('svg');
        if (isMuted) {
            icon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>';
            this.breathingSoundBtn.classList.remove('active');
        } else {
            icon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>';
            this.breathingSoundBtn.classList.add('active');
        }
    }
    handleMoodSelection(mood) {
        this.currentMood = mood;
        const moodMessages = {
            amazing: "That's fantastic! 🤩 I'm so happy you're feeling amazing! What's making today so special?",
            happy: "Wonderful! 😊 It's great to see you in good spirits! What's bringing you joy?",
            okay: "I hear you. 😐 Some days are just okay, and that's perfectly fine. Want to talk about anything?",
            sad: "I'm here for you. 😔 It's okay to feel sad. Would you like to share what's on your mind?",
            anxious: "I understand. 😰 Anxiety can be tough. Let's work through this together. What's worrying you?"
        };
        const response = moodMessages[mood];
        this.closeModal(this.moodModal);
        this.saveMood(mood);
        setTimeout(() => {
            this.addMessage(response, 'bot');
            this.speakResponse(response);
            this.playSound('message');
        }, 300);
    }
    toggleTTS() {
        this.ttsEnabled = !this.ttsEnabled;
        const icon = this.ttsToggleBtn.querySelector('svg');
        if (this.ttsEnabled) {
            this.ttsToggleBtn.classList.add('active');
            icon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>';
            this.playSound('click');
        } else {
            this.ttsToggleBtn.classList.remove('active');
            this.synth.cancel();
            icon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>';
        }
    }
    speakResponse(text) {
        if (!this.ttsEnabled) return;
        const cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        const voices = this.synth.getVoices();
        const preferredVoice = voices.find(voice => voice.name.includes('Google US English') || voice.name.includes('Female'));
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }
        this.synth.speak(utterance);
    }
    openModal(modal) {
        modal.classList.add('active');
        this.playSound('open');
    }
    closeModal(modal) {
        modal.classList.remove('active');
    }
    loadSettings() {
        const savedSettings = localStorage.getItem('bloommind-settings');
        if (savedSettings) {
            this.settings = JSON.parse(savedSettings);
            this.applySettings();
        }
    }
    saveSettings() {
        try {
            localStorage.setItem('bloommind-settings', JSON.stringify(this.settings));
        } catch (e) {
            console.warn('Could not save settings');
        }
    }
    applySettings() {
        this.themeToggle.checked = this.settings.darkMode;
        this.soundToggle.checked = this.settings.soundEffects;
        this.animationsToggle.checked = this.settings.animations;
        if (this.calmModeToggle) this.calmModeToggle.checked = this.settings.calmMode;
        if (this.settings.calmMode) {
            document.body.classList.add('calm-mode');
        } else {
            document.body.classList.remove('calm-mode');
        }
        if (!this.settings.darkMode) {
            document.body.classList.add('light-theme');
        }
        if (!this.settings.animations) {
            document.body.style.setProperty('--transition-fast', '0ms');
            document.body.style.setProperty('--transition-base', '0ms');
            document.body.style.setProperty('--transition-slow', '0ms');
        }
    }
    toggleTheme() {
        this.settings.darkMode = this.themeToggle.checked;
        document.body.classList.toggle('light-theme', !this.settings.darkMode);
        this.saveSettings();
        this.playSound('click');
    }
    toggleSound() {
        this.settings.soundEffects = this.soundToggle.checked;
        this.saveSettings();
    }
    toggleAnimations() {
        this.settings.animations = this.animationsToggle.checked;
        if (this.settings.animations) {
            document.body.style.removeProperty('--transition-fast');
            document.body.style.removeProperty('--transition-base');
            document.body.style.removeProperty('--transition-slow');
        } else {
            document.body.style.setProperty('--transition-fast', '0ms');
            document.body.style.setProperty('--transition-base', '0ms');
            document.body.style.setProperty('--transition-slow', '0ms');
        }
        this.saveSettings();
        this.playSound('click');
    }
    toggleCalmMode() {
        this.settings.calmMode = this.calmModeToggle.checked;
        if (this.settings.calmMode) {
            document.body.classList.add('calm-mode');
        } else {
            document.body.classList.remove('calm-mode');
        }
        this.saveSettings();
        this.playSound('click');
    }
    playSound(type) {
        if (!this.settings.soundEffects) return;
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        const sounds = {
            message: { frequency: 800, duration: 0.1 },
            click: { frequency: 600, duration: 0.05 },
            open: { frequency: 700, duration: 0.1 },
            start: { frequency: 900, duration: 0.15 }
        };
        const sound = sounds[type] || sounds.click;
        oscillator.frequency.value = sound.frequency;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + sound.duration);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + sound.duration);
    }
}
document.addEventListener('DOMContentLoaded', () => {
    window.bloomMindBot = new BloomMindChatbot();
});
class BreathingAudio {
    constructor(audioCtx) {
        this.ctx = audioCtx;
        this.masterGain = null;
        this.oscillators = [];
        this.isMuted = false;
        this.isPlaying = false;
    }
    setup() {
        if (this.masterGain) return;
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
        const freqs = [65.41, 98.00, 123.47, 164.81];
        freqs.forEach(freq => {
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(400, this.ctx.currentTime);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            osc.start();
            this.oscillators.push({ osc, gain, filter });
        });
    }
    start() {
        this.setup();
        this.isPlaying = true;
        if (!this.isMuted) {
            this.fadeIn();
        }
    }
    stop() {
        if (!this.masterGain) return;
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        this.isPlaying = false;
        setTimeout(() => {
            if (!this.isPlaying) {
                this.oscillators.forEach(o => {
                    o.osc.stop();
                    o.osc.disconnect();
                });
                this.oscillators = [];
                this.masterGain.disconnect();
                this.masterGain = null;
            }
        }, 1600);
    }
    fadeIn() {
        if (!this.masterGain) return;
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(0.001, now);
        this.masterGain.gain.linearRampToValueAtTime(0.2, now + 3);
    }
    rampTo(state) {
        if (!this.masterGain || this.isMuted) return;
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        if (state === 'inhale') {
            this.masterGain.gain.linearRampToValueAtTime(0.3, now + 3.8);
            this.oscillators.forEach(o => {
                o.filter.frequency.linearRampToValueAtTime(600, now + 3.8);
            });
        } else if (state === 'hold') {
            this.masterGain.gain.linearRampToValueAtTime(0.28, now + 3.8);
        } else if (state === 'exhale') {
            this.masterGain.gain.linearRampToValueAtTime(0.05, now + 3.8);
            this.oscillators.forEach(o => {
                o.filter.frequency.linearRampToValueAtTime(200, now + 3.8);
            });
        }
    }
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            if (this.isMuted) {
                this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
                this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
            } else {
                this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
                this.masterGain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.5);
            }
        }
        return this.isMuted;
    }
}
