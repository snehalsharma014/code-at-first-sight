class WellnessApp {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
        this.savedPlans = this.loadSavedPlans();
        this.currentPlan = null;
        this.geminiApiKey = localStorage.getItem('geminiApiKey');
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthStatus();
        this.checkGeminiApiKey();
    }

    bindEvents() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Guest login
        document.getElementById('guestLogin').addEventListener('click', () => {
            this.handleGuestLogin();
        });

        // Show signup
        document.getElementById('showSignup').addEventListener('click', (e) => {
            e.preventDefault();
            this.showPage('signupPage');
        });

        // Signup form
        document.getElementById('signupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });

        // Personal details form
        document.getElementById('personalDetailsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePersonalDetails();
        });

        // Dashboard events
        document.getElementById('getSuggestion').addEventListener('click', () => {
            this.getSuggestions();
        });

        document.getElementById('moodInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.getSuggestions();
            }
        });

        document.querySelectorAll('.quick-mood').forEach(button => {
            button.addEventListener('click', (e) => {
                const mood = e.target.dataset.mood;
                document.getElementById('moodInput').value = mood;
                this.getSuggestions();
            });
        });

        document.getElementById('refreshSuggestions').addEventListener('click', () => {
            this.getSuggestions();
        });

        document.getElementById('saveSuggestions').addEventListener('click', () => {
            this.saveCurrentPlan();
        });
    }

    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show target page
        document.getElementById(pageId).classList.add('active');
    }

    checkAuthStatus() {
        const savedUser = localStorage.getItem('wellnessUser');
        const savedProfile = localStorage.getItem('wellnessProfile');
        
        if (savedUser && savedProfile) {
            this.currentUser = JSON.parse(savedUser);
            this.userProfile = JSON.parse(savedProfile);
            this.showPage('dashboardPage');
            this.updateUserDisplay();
        } else {
            this.showPage('landingPage');
        }
    }

    handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Simple validation
        if (!email || !password) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        // Simulate login process
        this.showLoadingState('loginForm');
        
        setTimeout(() => {
            // For demo purposes, accept any valid email format
            if (email.includes('@')) {
                this.currentUser = {
                    email: email,
                    name: email.split('@')[0],
                    isGuest: false
                };
                
                // Check if user has completed profile
                const savedProfile = localStorage.getItem('wellnessProfile');
                if (savedProfile) {
                    this.userProfile = JSON.parse(savedProfile);
                    this.showPage('dashboardPage');
                    this.updateUserDisplay();
                } else {
                    this.showPage('personalDetailsPage');
                }
                
                this.showNotification('Login successful!', 'success');
            } else {
                this.showNotification('Please enter a valid email', 'error');
            }
            this.hideLoadingState('loginForm');
        }, 1500);
    }

    handleGuestLogin() {
        this.currentUser = {
            email: 'guest@feelbetter.ai',
            name: 'Guest User',
            isGuest: true
        };
        
        this.showPage('personalDetailsPage');
        this.showNotification('Welcome, Guest!', 'success');
    }

    handleSignup() {
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!name || !email || !password || !confirmPassword) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            this.showNotification('Password must be at least 6 characters', 'error');
            return;
        }

        this.showLoadingState('signupForm');
        
        setTimeout(() => {
            this.currentUser = {
                email: email,
                name: name,
                isGuest: false
            };
            
            this.showPage('personalDetailsPage');
            this.showNotification('Account created successfully!', 'success');
            this.hideLoadingState('signupForm');
        }, 1500);
    }

    handlePersonalDetails() {
        const form = document.getElementById('personalDetailsForm');
        const formData = new FormData(form);
        const profile = {
            age: formData.get('age'),
            gender: formData.get('gender'),
            stressLevel: formData.get('stressLevel'),
            wellnessGoals: formData.getAll('wellnessGoals'),
            meditationExperience: formData.get('meditationExperience'),
            preferredActivities: formData.getAll('preferredActivities')
        };

        // Debug: log all values
        console.log('Profile:', profile);

        // Fallback: checkboxes/radios checked in DOM
        if (profile.wellnessGoals.length === 0) {
            profile.wellnessGoals = Array.from(form.querySelectorAll('input[name="wellnessGoals"]:checked')).map(cb => cb.value);
        }
        if (profile.preferredActivities.length === 0) {
            profile.preferredActivities = Array.from(form.querySelectorAll('input[name="preferredActivities"]:checked')).map(cb => cb.value);
        }
        if (!profile.stressLevel) {
            const checkedStress = form.querySelector('input[name="stressLevel"]:checked');
            if (checkedStress) profile.stressLevel = checkedStress.value;
        }

        // Debug: log after fallback
        console.log('Profile after fallback:', profile);

        // Validate required fields
        if (!profile.age || !profile.gender || !profile.stressLevel || 
            !profile.meditationExperience || profile.wellnessGoals.length === 0 || profile.preferredActivities.length === 0) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        this.userProfile = profile;
        
        // Save to localStorage
        localStorage.setItem('wellnessUser', JSON.stringify(this.currentUser));
        localStorage.setItem('wellnessProfile', JSON.stringify(this.userProfile));
        
        this.showPage('dashboardPage');
        this.updateUserDisplay();
        this.showNotification('Profile completed! Welcome to FeelBetter.AI', 'success');
        // Always show mood input on dashboard
        setTimeout(() => {
            const moodInput = document.getElementById('moodInput');
            if (moodInput) {
                moodInput.style.display = '';
                moodInput.focus();
            }
        }, 100);
    }

    updateUserDisplay() {
        if (this.currentUser) {
            document.getElementById('userName').textContent = `Welcome, ${this.currentUser.name}!`;
        }
    }

    checkGeminiApiKey() {
        if (!this.geminiApiKey) {
            this.showApiKeyPrompt();
        }
    }

    showApiKeyPrompt() {
        const apiKey = prompt('Please enter your Gemini API key to enable AI-powered suggestions:\n\nGet your free API key from: https://makersuite.google.com/app/apikey\n\n(You can skip this for now and use rule-based suggestions)');
        
        if (apiKey && apiKey.trim()) {
            this.geminiApiKey = apiKey.trim();
            localStorage.setItem('geminiApiKey', this.geminiApiKey);
            this.showNotification('Gemini API key saved! AI suggestions enabled.', 'success');
        } else if (apiKey !== null) {
            this.showNotification('Using rule-based suggestions. You can add your API key later in settings.', 'info');
        }
    }

    getSuggestions() {
        const moodInput = document.getElementById('moodInput');
        const mood = moodInput.value.trim().toLowerCase();

        if (!mood) {
            this.showNotification('Please enter how you\'re feeling', 'error');
            return;
        }

        this.showLoadingState('getSuggestion');

        if (this.geminiApiKey) {
            this.getGeminiSuggestions(mood);
        } else {
            // Fallback to rule-based suggestions
            setTimeout(() => {
                const suggestions = this.generateRuleBasedSuggestions(mood);
                this.displaySuggestions(suggestions);
                this.hideLoadingState('getSuggestion');
            }, 1500);
        }
    }

    async getGeminiSuggestions(mood) {
        try {
            const prompt = this.buildGeminiPrompt(mood);
            const response = await this.callGeminiAPI(prompt);
            
            if (response) {
                this.displaySuggestions(response);
            } else {
                // Fallback to rule-based if API fails
                const suggestions = this.generateRuleBasedSuggestions(mood);
                this.displaySuggestions(suggestions);
            }
        } catch (error) {
            console.error('Gemini API error:', error);
            this.showNotification('AI service temporarily unavailable. Using rule-based suggestions.', 'error');
            
            // Fallback to rule-based suggestions
            const suggestions = this.generateRuleBasedSuggestions(mood);
            this.displaySuggestions(suggestions);
        }
        
        this.hideLoadingState('getSuggestion');
    }

    buildGeminiPrompt(mood) {
        const userContext = this.userProfile ? `
User Profile:
- Age: ${this.userProfile.age}
- Gender: ${this.userProfile.gender}
- Stress Level: ${this.userProfile.stressLevel}/5
- Wellness Goals: ${this.userProfile.wellnessGoals.join(', ')}
- Meditation Experience: ${this.userProfile.meditationExperience}
- Preferred Activities: ${this.userProfile.preferredActivities.join(', ')}
` : '';

        return `You are a compassionate AI wellness coach. The user is feeling "${mood}". 

${userContext}

Please provide exactly 3 personalized wellness suggestions in this exact JSON format:
{
  "activity": "A specific, actionable physical or mental activity (1-2 sentences)",
  "tip": "A practical wellness tip or advice (1-2 sentences)", 
  "meditation": "A specific meditation or breathing technique (1-2 sentences)"
}

Make suggestions that are:
- Immediately actionable
- Personalized to their profile if available
- Scientifically sound
- Compassionate and supportive
- Specific and detailed

Respond with ONLY the JSON object, no additional text.`;
    }

    async callGeminiAPI(prompt) {
        const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 800
            }
        };

        try {
            const response = await fetch(`${url}?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const text = data.candidates[0].content.parts[0].text;
                
                // Try to parse JSON response
                try {
                    const suggestions = JSON.parse(text);
                    return {
                        mood: document.getElementById('moodInput').value.trim().toLowerCase(),
                        activity: suggestions.activity,
                        tip: suggestions.tip,
                        meditation: suggestions.meditation,
                        timestamp: new Date().toISOString(),
                        source: 'gemini'
                    };
                } catch (parseError) {
                    console.error('Failed to parse Gemini response:', parseError);
                    return null;
                }
            }
            
            return null;
        } catch (error) {
            console.error('Gemini API call failed:', error);
            throw error;
        }
    }

    generateRuleBasedSuggestions(mood) {
        const suggestions = {
            tired: {
                activity: 'Take a 20-minute power nap in a quiet, dark room. Set an alarm to avoid oversleeping and wake up feeling refreshed.',
                tip: 'Stay hydrated! Dehydration can cause fatigue. Drink a glass of water and consider a light snack with protein and complex carbs.',
                meditation: 'Try a 10-minute body scan meditation. Lie down comfortably and focus on each part of your body, releasing tension as you go.'
            },
            anxious: {
                activity: 'Go for a 15-minute walk in nature. Physical movement and fresh air can help reduce anxiety and clear your mind.',
                tip: 'Write down your worries in a journal. Getting them out of your head and onto paper can provide immediate relief.',
                meditation: 'Practice 4-7-8 breathing: inhale for 4 counts, hold for 7, exhale for 8. Repeat 4 times to activate your parasympathetic nervous system.'
            },
            stressed: {
                activity: 'Do some gentle stretching or yoga poses. Focus on deep breathing while holding each pose for 30 seconds.',
                tip: 'Take a 5-minute break to step away from your current task. Sometimes a brief mental reset is all you need.',
                meditation: 'Try progressive muscle relaxation. Tense each muscle group for 5 seconds, then release. Start from your toes and work up to your head.'
            },
            sad: {
                activity: 'Listen to your favorite uplifting music and dance around your room. Movement releases endorphins that can improve your mood.',
                tip: 'Reach out to a friend or family member for a quick chat. Social connection is one of the most powerful mood boosters.',
                meditation: 'Practice loving-kindness meditation. Send positive thoughts to yourself and others, starting with "May I be happy, may I be peaceful."'
            },
            happy: {
                activity: 'Channel your positive energy into a creative project. Paint, write, or create something that brings you joy.',
                tip: 'Share your happiness with others! Compliment someone, help a friend, or simply smile at strangers to spread positivity.',
                meditation: 'Practice gratitude meditation. Reflect on three things you\'re thankful for today and really feel the appreciation.'
            },
            energetic: {
                activity: 'Use your energy for a high-intensity workout or dance session. Channel that vitality into something productive and fun!',
                tip: 'Plan something exciting for later today or tomorrow. Having something to look forward to maintains positive momentum.',
                meditation: 'Try a dynamic meditation like walking meditation or mindful movement to match your energy level.'
            }
        };

        // Get suggestions for the mood
        let moodSuggestions = suggestions[mood];

        // If no exact match, find similar moods
        if (!moodSuggestions) {
            const similarMoods = this.findSimilarMoods(mood);
            if (similarMoods.length > 0) {
                moodSuggestions = suggestions[similarMoods[0]];
            }
        }

        // If still no suggestions, use general wellness tips
        if (!moodSuggestions) {
            moodSuggestions = {
                activity: 'Go for a short walk outside. Fresh air and movement can help with any mood or feeling.',
                tip: 'Take a moment to breathe deeply and check in with yourself. Sometimes just pausing can help clarify what you need.',
                meditation: 'Try a 5-minute mindfulness meditation. Focus on your breath and observe your thoughts without judgment.'
            };
        }

        return {
            mood: mood,
            activity: moodSuggestions.activity,
            tip: moodSuggestions.tip,
            meditation: moodSuggestions.meditation,
            timestamp: new Date().toISOString()
        };
    }

    findSimilarMoods(mood) {
        const moodSynonyms = {
            exhausted: ['tired'],
            sleepy: ['tired'],
            drained: ['tired'],
            worried: ['anxious'],
            nervous: ['anxious'],
            fearful: ['anxious'],
            overwhelmed: ['stressed'],
            pressured: ['stressed'],
            tense: ['stressed'],
            depressed: ['sad'],
            down: ['sad'],
            blue: ['sad'],
            joyful: ['happy'],
            excited: ['energetic'],
            pumped: ['energetic'],
            motivated: ['energetic']
        };

        return moodSynonyms[mood] || [];
    }

    displaySuggestions(suggestions) {
        this.currentPlan = suggestions;
        
        document.getElementById('activityText').textContent = suggestions.activity;
        document.getElementById('tipText').textContent = suggestions.tip;
        document.getElementById('meditationText').textContent = suggestions.meditation;
        
        // Update AI indicator
        const aiIndicator = document.querySelector('.ai-indicator');
        if (aiIndicator) {
            if (suggestions.source === 'gemini') {
                aiIndicator.innerHTML = '<i class="fas fa-robot"></i><span>AI-Powered by Gemini</span>';
            } else {
                aiIndicator.innerHTML = '<i class="fas fa-brain"></i><span>Rule-Based Intelligence</span>';
            }
        }
        
        document.getElementById('suggestionsSection').style.display = 'block';
        
        // Scroll to suggestions
        document.getElementById('suggestionsSection').scrollIntoView({ 
            behavior: 'smooth',
            block: 'center'
        });
    }

    showLoadingState(elementId) {
        const element = document.getElementById(elementId);
        if (element.tagName === 'BUTTON') {
            const originalText = element.innerHTML;
            element.innerHTML = '<div class="loading"></div> Processing...';
            element.disabled = true;
            element.dataset.originalText = originalText;
        } else if (element.tagName === 'FORM') {
            const submitBtn = element.querySelector('button[type="submit"]');
            if (submitBtn) {
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<div class="loading"></div> Processing...';
                submitBtn.disabled = true;
                submitBtn.dataset.originalText = originalText;
            }
        }
    }

    hideLoadingState(elementId) {
        const element = document.getElementById(elementId);
        if (element.tagName === 'BUTTON') {
            element.innerHTML = element.dataset.originalText;
            element.disabled = false;
        } else if (element.tagName === 'FORM') {
            const submitBtn = element.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = submitBtn.dataset.originalText;
                submitBtn.disabled = false;
            }
        }
    }

    saveCurrentPlan() {
        if (!this.currentPlan) {
            this.showNotification('No plan to save', 'error');
            return;
        }

        // Add to saved plans
        this.savedPlans.unshift(this.currentPlan);
        
        // Keep only last 10 saved plans
        if (this.savedPlans.length > 10) {
            this.savedPlans = this.savedPlans.slice(0, 10);
        }

        // Save to localStorage
        this.saveToLocalStorage();
        
        // Update display
        this.displaySavedPlans();
        
        // Show success message
        this.showNotification('Wellness plan saved successfully!', 'success');
        
        // Add success animation to save button
        const saveBtn = document.getElementById('saveSuggestions');
        saveBtn.classList.add('success');
        setTimeout(() => saveBtn.classList.remove('success'), 600);
    }

    displaySavedPlans() {
        const container = document.getElementById('savedPlans');
        
        if (this.savedPlans.length === 0) {
            container.innerHTML = '<p class="no-plans">No saved plans yet. Get your first suggestions!</p>';
            return;
        }

        container.innerHTML = this.savedPlans.map((plan, index) => `
            <div class="saved-plan">
                <button class="delete-plan" onclick="wellnessApp.deletePlan(${index})">
                    <i class="fas fa-times"></i>
                </button>
                <div class="saved-plan-header">
                    <span class="saved-plan-mood">${plan.mood.charAt(0).toUpperCase() + plan.mood.slice(1)}</span>
                    <span class="saved-plan-date">${this.formatDate(plan.timestamp)}</span>
                </div>
                <div class="saved-plan-content">
                    <div class="saved-plan-item">
                        <h5>Activity</h5>
                        <p>${plan.activity}</p>
                    </div>
                    <div class="saved-plan-item">
                        <h5>Tip</h5>
                        <p>${plan.tip}</p>
                    </div>
                    <div class="saved-plan-item">
                        <h5>Meditation</h5>
                        <p>${plan.meditation}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    deletePlan(index) {
        this.savedPlans.splice(index, 1);
        this.saveToLocalStorage();
        this.displaySavedPlans();
        this.showNotification('Plan deleted', 'success');
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    loadSavedPlans() {
        try {
            const saved = localStorage.getItem('wellnessPlans');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading saved plans:', error);
            return [];
        }
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('wellnessPlans', JSON.stringify(this.savedPlans));
        } catch (error) {
            console.error('Error saving plans:', error);
        }
    }

    showSettings() {
        const currentKey = this.geminiApiKey ? '••••••••' + this.geminiApiKey.slice(-4) : 'Not set';
        const newKey = prompt(`Gemini API Key Settings

Current key: ${currentKey}

Enter new API key (or leave empty to remove):
Get your free API key from: https://makersuite.google.com/app/apikey

Note: Your API key is stored locally and never shared.`);

        if (newKey !== null) {
            if (newKey.trim()) {
                this.geminiApiKey = newKey.trim();
                localStorage.setItem('geminiApiKey', this.geminiApiKey);
                this.showNotification('API key updated successfully!', 'success');
            } else {
                this.geminiApiKey = null;
                localStorage.removeItem('geminiApiKey');
                this.showNotification('API key removed. Using rule-based suggestions.', 'info');
            }
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ff6b6b' : type === 'success' ? '#4ecdc4' : '#667eea'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Global functions
function showPage(pageId) {
    wellnessApp.showPage(pageId);
}

function logout() {
    localStorage.removeItem('wellnessUser');
    localStorage.removeItem('wellnessProfile');
    wellnessApp.currentUser = null;
    wellnessApp.userProfile = null;
    wellnessApp.showPage('landingPage');
    wellnessApp.showNotification('Logged out successfully', 'success');
}

// Initialize the app
let wellnessApp;
document.addEventListener('DOMContentLoaded', () => {
    wellnessApp = new WellnessApp();
});

// Add some fun Easter eggs
document.addEventListener('keydown', (e) => {
    if (e.key === 'h' && e.ctrlKey) {
        wellnessApp.showNotification('🌟 You found the secret! You\'re awesome! 🌟', 'success');
    }
});

// Add dynamic background effects
document.addEventListener('mousemove', (e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    
    document.body.style.background = `
        linear-gradient(135deg, 
            hsl(${240 + x * 30}, 70%, 60%) 0%, 
            hsl(${280 + y * 30}, 70%, 60%) 100%)
    `;
});


