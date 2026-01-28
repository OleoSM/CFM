/**
 * CEFIMAT API Service
 * Centralized service for all backend API communication
 */

const API_CONFIG = {
    // Backend URL - change this for production
    BASE_URL: 'http://localhost:3000',

    // Endpoints
    ENDPOINTS: {
        // Auth
        LOGIN: '/api/auth/login',
        REGISTER: '/api/auth/register',
        ME: '/api/auth/me',

        // Student
        UNITS: '/api/student/units',
        UNIT_QUIZZES: (unitKey) => `/api/student/units/${unitKey}/quizzes`,
        QUIZ_START: '/api/student/quiz/start',
        QUIZ_ANSWER: '/api/student/quiz/answer',
        PROGRESS: '/api/student/progress',
    }
};

/**
 * API Service Class
 */
class APIService {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
    }

    /**
     * Get JWT token from localStorage
     */
    getToken() {
        return localStorage.getItem('authToken');
    }

    /**
     * Set JWT token in localStorage
     */
    setToken(token) {
        localStorage.setItem('authToken', token);
    }

    /**
     * Remove JWT token from localStorage
     */
    removeToken() {
        localStorage.removeItem('authToken');
    }

    /**
     * Make HTTP request with automatic token inclusion
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = this.getToken();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);

            // Handle unauthorized - redirect to login
            if (response.status === 401) {
                this.removeToken();
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userData');
                window.location.href = 'auth.html';
                throw new Error('Unauthorized - redirecting to login');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // ==========================================
    // AUTHENTICATION ENDPOINTS
    // ==========================================

    /**
     * Login user
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<{user, token}>}
     */
    async login(email, password) {
        const data = await this.request(API_CONFIG.ENDPOINTS.LOGIN, {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        // Store token
        this.setToken(data.token);

        // Store user data for backward compatibility
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userData', JSON.stringify(data.user));
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('userGroup', data.user.groupName || 'A1');

        return data;
    }

    /**
     * Register new user
     * @param {Object} userData 
     * @returns {Promise<{user, token}>}
     */
    async register(userData) {
        const data = await this.request(API_CONFIG.ENDPOINTS.REGISTER, {
            method: 'POST',
            body: JSON.stringify({
                email: userData.email,
                password: userData.password,
                name: userData.name,
                groupName: userData.group || 'A1',
            }),
        });

        // Store token
        this.setToken(data.token);

        // Store user data for backward compatibility
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userData', JSON.stringify(data.user));
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('userGroup', data.user.groupName || 'A1');

        return data;
    }

    /**
     * Get current user info
     * @returns {Promise<{user}>}
     */
    async getMe() {
        return await this.request(API_CONFIG.ENDPOINTS.ME);
    }

    /**
     * Logout user
     */
    logout() {
        this.removeToken();
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userData');
        localStorage.removeItem('userName');
        localStorage.removeItem('userGroup');
        window.location.href = 'landing.html';
    }

    // ==========================================
    // STUDENT ENDPOINTS
    // ==========================================

    /**
     * Get all available units
     * @returns {Promise<{units: Array}>}
     */
    async getUnits() {
        return await this.request(API_CONFIG.ENDPOINTS.UNITS);
    }

    /**
     * Get quizzes for a specific unit
     * @param {string} unitKey - e.g., 'u1', 'u2'
     * @returns {Promise<{quizzes: Array}>}
     */
    async getUnitQuizzes(unitKey) {
        return await this.request(API_CONFIG.ENDPOINTS.UNIT_QUIZZES(unitKey));
    }

    /**
     * Start a quiz attempt
     * @param {string} quizId - Quiz UUID
     * @returns {Promise<{attemptId, quiz, question}>}
     */
    async startQuiz(quizId) {
        return await this.request(API_CONFIG.ENDPOINTS.QUIZ_START, {
            method: 'POST',
            body: JSON.stringify({ quizId }),
        });
    }

    /**
     * Submit an answer to a question
     * @param {string} attemptId - Attempt UUID
     * @param {string} questionId - Question UUID
     * @param {number} selectedIndex - Selected option index (0-3)
     * @returns {Promise<{isCorrect, correctIndex, nextQuestion}>}
     */
    async answerQuestion(attemptId, questionId, selectedIndex) {
        return await this.request(API_CONFIG.ENDPOINTS.QUIZ_ANSWER, {
            method: 'POST',
            body: JSON.stringify({
                attemptId,
                questionId,
                selectedIndex
            }),
        });
    }

    /**
     * Get user progress
     * @returns {Promise<{attempts: Array}>}
     */
    async getProgress() {
        return await this.request(API_CONFIG.ENDPOINTS.PROGRESS);
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return !!this.getToken();
    }

    /**
     * Validate token and redirect if invalid
     */
    async validateAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'auth.html';
            return false;
        }

        try {
            await this.getMe();
            return true;
        } catch (error) {
            console.error('Auth validation failed:', error);
            window.location.href = 'auth.html';
            return false;
        }
    }
}

// Create and export singleton instance
const api = new APIService();

// Make it available globally for inline HTML event handlers
window.api = api;
