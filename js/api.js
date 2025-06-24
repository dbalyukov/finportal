// API Client for Financial Portal
class ApiClient {
    constructor() {
        this.baseUrl = '/api';
        this.token = localStorage.getItem('authToken');
    }

    // Set auth token
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    // Clear auth token
    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    // Make API request
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add auth token if available
        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Network error' }));
                throw new Error(error.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Authentication
    async login(username, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        if (response.token) {
            this.setToken(response.token);
        }
        
        return response;
    }

    async verifyToken() {
        return await this.request('/auth/verify');
    }

    // Projects
    async getProjects(userRole = null, userName = null) {
        const params = new URLSearchParams();
        if (userRole) params.append('userRole', userRole);
        if (userName) params.append('userName', userName);
        
        const query = params.toString() ? `?${params.toString()}` : '';
        return await this.request(`/projects${query}`);
    }

    async getProject(projectId) {
        return await this.request(`/projects/${projectId}`);
    }

    async getFullProject(projectId) {
        return await this.request(`/projects/${projectId}/full`);
    }

    async createProject(projectData) {
        return await this.request('/projects', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });
    }

    async updateProject(projectId, projectData) {
        return await this.request(`/projects/${projectId}`, {
            method: 'PUT',
            body: JSON.stringify(projectData)
        });
    }

    async saveProjectDraft(projectId, projectData) {
        return await this.request(`/projects/${projectId}/draft`, {
            method: 'POST',
            body: JSON.stringify(projectData)
        });
    }

    async deleteProject(projectId) {
        return await this.request(`/projects/${projectId}`, {
            method: 'DELETE'
        });
    }

    // Costs
    async getProjectCosts(projectId) {
        return await this.request(`/costs/${projectId}`);
    }

    async saveProjectCosts(projectId, costs) {
        return await this.request(`/costs/${projectId}`, {
            method: 'POST',
            body: JSON.stringify({ costs })
        });
    }

    async addStage(projectId, stageData) {
        return await this.request(`/costs/${projectId}/stages`, {
            method: 'POST',
            body: JSON.stringify(stageData)
        });
    }

    async deleteStage(projectId, stageNumber) {
        return await this.request(`/costs/${projectId}/stages/${stageNumber}`, {
            method: 'DELETE'
        });
    }

    // Constants
    async getConstants() {
        return await this.request('/constants');
    }

    async getConstant(constantId) {
        return await this.request(`/constants/${constantId}`);
    }

    async createConstant(constantData) {
        return await this.request('/constants', {
            method: 'POST',
            body: JSON.stringify(constantData)
        });
    }

    async updateConstant(constantId, constantData) {
        return await this.request(`/constants/${constantId}`, {
            method: 'PUT',
            body: JSON.stringify(constantData)
        });
    }

    async deleteConstant(constantId) {
        return await this.request(`/constants/${constantId}`, {
            method: 'DELETE'
        });
    }

    async initConstants() {
        return await this.request('/constants/init', {
            method: 'POST'
        });
    }

    // Health check
    async healthCheck() {
        return await this.request('/health');
    }
}

// Create global API instance
window.apiClient = new ApiClient(); 