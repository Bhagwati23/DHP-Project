/**
 * Utility functions for the Internship Insights application
 */

const Utils = {
    /**
     * Fetch data from an API endpoint
     * @param {string} endpoint - The API endpoint to fetch data from
     * @returns {Promise<any>} - A promise that resolves to the JSON data
     */
    async fetchData(endpoint) {
        try {
            // Add api prefix to the endpoint if it doesn't start with it
            const url = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error fetching data from ${endpoint}:`, error);
            return null;
        }
    },
    
    /**
     * Format a number as currency
     * @param {number} amount - The amount to format
     * @param {string} currency - The currency symbol
     * @returns {string} - The formatted currency string
     */
    formatCurrency(amount, currency = '₹') {
        if (amount === null || amount === undefined) return `${currency}0`;
        
        return `${currency}${parseInt(amount).toLocaleString('en-IN')}`;
    },
    
    /**
     * Format a number with thousand separators
     * @param {number} num - The number to format
     * @returns {string} - The formatted number string
     */
    formatNumber(num) {
        if (num === null || num === undefined) return '0';
        
        return parseInt(num).toLocaleString('en-IN');
    },
    
    /**
     * Generate random colors for charts
     * @param {number} count - The number of colors to generate
     * @param {number} opacity - The opacity of the colors (0-1)
     * @returns {string[]} - An array of RGBA color strings
     */
    generateColors(count, opacity = 0.7) {
        const colors = [];
        const hueStep = 360 / count;
        
        for (let i = 0; i < count; i++) {
            const hue = (i * hueStep) % 360;
            colors.push(`hsla(${hue}, 70%, 60%, ${opacity})`);
        }
        
        return colors;
    },
    
    /**
     * Show a loading spinner
     * @param {string} elementId - The ID of the element to show
     */
    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'flex';
        }
    },
    
    /**
     * Hide a loading spinner
     * @param {string} elementId - The ID of the element to hide
     */
    hideLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'none';
        }
    },
    
    /**
     * Create a toast notification
     * @param {string} message - The message to display
     * @param {string} type - The type of toast (success, warning, danger)
     */
    createToast(message, type = 'info') {
        // Check if toast container exists, if not create it
        let toastContainer = document.querySelector('.toast-container');
        
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast element
        const toastId = `toast-${Date.now()}`;
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        toast.setAttribute('id', toastId);
        
        // Create toast content
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        // Add toast to container
        toastContainer.appendChild(toast);
        
        // Initialize and show the toast
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 5000
        });
        
        bsToast.show();
        
        // Remove toast after it's hidden
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
};

// Export the Utils object
window.Utils = Utils;