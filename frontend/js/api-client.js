/**
 * API Client for Internship Insights
 * Handles all API requests to the backend
 */

const API_BASE_URL = 'http://localhost:8000';  // Backend server URL

const apiClient = {
    /**
     * Get top domains by count
     * @returns {Promise<Array>} Array of top domains
     */
    async getTopDomains() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/top-domains`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return { status: 'success', data: await response.json() };
        } catch (error) {
            console.error('Error fetching top domains:', error);
            return { status: 'error', message: error.message };
        }
    },

    /**
     * Get salary insights by domain
     * @returns {Promise<Array>} Array of salary insights
     */
    async getSalaryInsights() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/salary-insights`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return { status: 'success', data: await response.json() };
        } catch (error) {
            console.error('Error fetching salary insights:', error);
            return { status: 'error', message: error.message };
        }
    },

    /**
     * Get jobs by city
     * @returns {Promise<Array>} Array of jobs by city
     */
    async getJobsByCity() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/jobs-by-city`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return { status: 'success', data: await response.json() };
        } catch (error) {
            console.error('Error fetching jobs by city:', error);
            return { status: 'error', message: error.message };
        }
    },

    /**
     * Get all domains
     * @returns {Promise<Array>} Array of all domains
     */
    async getDomains() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/domains`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return { status: 'success', data: await response.json() };
        } catch (error) {
            console.error('Error fetching domains:', error);
            return { status: 'error', message: error.message };
        }
    },

    /**
     * Get company hiring patterns
     * @returns {Promise<Array>} Array of company hiring patterns
     */
    async getCompanyHiring() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/company-hiring`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return { status: 'success', data: await response.json() };
        } catch (error) {
            console.error('Error fetching company hiring:', error);
            return { status: 'error', message: error.message };
        }
    },

    /**
     * Get salary ranges by domain
     * @returns {Promise<Array>} Array of salary ranges
     */
    async getSalaryRange() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/salary-ranges`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return { status: 'success', data: await response.json() };
        } catch (error) {
            console.error('Error fetching salary ranges:', error);
            return { status: 'error', message: error.message };
        }
    },

    /**
     * Get filtered data
     * @param {Object} filters Filter parameters
     * @returns {Promise<Array>} Array of filtered data
     */
    async getFilteredData(filters = {}) {
        try {
            const params = new URLSearchParams();
            
            if (filters.domain && filters.domain !== 'All') {
                params.append('domain', filters.domain);
            }
            
            if (filters.location && filters.location !== 'All') {
                params.append('location', filters.location);
            }
            
            if (filters.minSalary) {
                params.append('min_salary', filters.minSalary);
            }
            
            const url = `${API_BASE_URL}/api/filter-data${params.toString() ? `?${params.toString()}` : ''}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            return { status: 'success', data: await response.json() };
        } catch (error) {
            console.error('Error fetching filtered data:', error);
            return { status: 'error', message: error.message };
        }
    },

    /**
     * Compare domains
     * @param {string} domain1 First domain
     * @param {string} domain2 Second domain
     * @returns {Promise<Object>} Comparison data
     */
    async compareDomains(domain1, domain2) {
        try {
            const params = new URLSearchParams();
            params.append('domain1', domain1);
            params.append('domain2', domain2);
            
            const response = await fetch(`${API_BASE_URL}/api/compare-domains?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            return { status: 'success', data: await response.json() };
        } catch (error) {
            console.error('Error comparing domains:', error);
            return { status: 'error', message: error.message };
        }
    },

    /**
     * Get all locations
     * @returns {Promise<Array>} Array of all locations
     */
    async getLocations() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/locations`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return { status: 'success', data: await response.json() };
        } catch (error) {
            console.error('Error fetching locations:', error);
            return { status: 'error', message: error.message };
        }
    },

    /**
     * Get key insights
     * @returns {Promise<Object>} Key insights data
     */
    async getKeyInsights() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/key-insights`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return { status: 'success', data: await response.json() };
        } catch (error) {
            console.error('Error fetching key insights:', error);
            return { status: 'error', message: error.message };
        }
    },

    /**
     * Get salary statistics
     * @returns {Promise<Object>} Salary statistics
     */
    async getSalaryStats() {
        try {
            // Compute salary statistics from salary insights
            const salaryInsights = await this.getSalaryInsights();
            
            if (salaryInsights.status === 'error') {
                throw new Error(salaryInsights.message);
            }
            
            const salaries = salaryInsights.data.map(item => item.avg_salary);
            
            if (salaries.length === 0) {
                throw new Error('No salary data available');
            }
            
            // Calculate statistics
            const min = Math.min(...salaries);
            const max = Math.max(...salaries);
            const sum = salaries.reduce((a, b) => a + b, 0);
            const mean = sum / salaries.length;
            
            // Sort salaries for median
            const sortedSalaries = [...salaries].sort((a, b) => a - b);
            const mid = Math.floor(sortedSalaries.length / 2);
            const median = sortedSalaries.length % 2 === 0 
                ? (sortedSalaries[mid - 1] + sortedSalaries[mid]) / 2 
                : sortedSalaries[mid];
            
            return { 
                status: 'success', 
                data: { min, max, mean, median, count: salaries.length }
            };
        } catch (error) {
            console.error('Error calculating salary statistics:', error);
            return { status: 'error', message: error.message };
        }
    }
};

// Make apiClient available globally
window.apiClient = apiClient;