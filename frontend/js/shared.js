

// Common utility functions
const Utils = {
    // Format currency
    formatCurrency: (amount) => {
        return '₹' + amount.toLocaleString('en-IN');
    },

    // Format large numbers
    formatNumber: (num) => {
        return num.toLocaleString('en-IN');
    },

    // Generate random colors for charts
    generateColors: (count, opacity = 1) => {
        const colors = [];
        const baseColors = [
            `rgba(67, 97, 238, ${opacity})`,  // Blue
            `rgba(76, 201, 240, ${opacity})`, // Light Blue
            `rgba(247, 37, 133, ${opacity})`, // Pink
            `rgba(58, 12, 163, ${opacity})`,  // Deep Purple
            `rgba(114, 9, 183, ${opacity})`,  // Purple
            `rgba(72, 149, 239, ${opacity})`, // Sky Blue
            `rgba(76, 201, 240, ${opacity})`, // Cyan
            `rgba(181, 23, 158, ${opacity})`, // Magenta
            `rgba(72, 12, 168, ${opacity})`,  // Indigo
            `rgba(255, 77, 109, ${opacity})`, // Red
        ];

        for (let i = 0; i < count; i++) {
            colors.push(baseColors[i % baseColors.length]);
        }

        return colors;
    },

    // Show loading state
    showLoading: (elementId) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'flex';
        }
    },

    // Hide loading state
    hideLoading: (elementId) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'none';
        }
    },

    // Create a toast notification
    createToast: (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0 position-fixed bottom-0 end-0 m-3`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');

        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;

        document.body.appendChild(toast);

        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        // Remove the toast after it's hidden
        toast.addEventListener('hidden.bs.toast', () => {
            document.body.removeChild(toast);
        });
    },

    // Fetch data from API with error handling
    fetchData: async (endpoint) => {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching data from ${endpoint}:`, error);
            Utils.createToast(`Failed to fetch data: ${error.message}`, 'danger');
            return null;
        }
    },
    // Initialize form filters
    initializeFilters: async () => {
        try {
            // Fetch domains for filter
            const domainsResponse = await apiClient.getDomains();
            
            let domains = [];
            if (domainsResponse.status === 'success') {
                domains = domainsResponse.data;
                const domainFilters = document.querySelectorAll('#domainFilter');

                if (domains && domains.length > 0) {
                    domainFilters.forEach(filter => {
                        let options = '<option value="All">All Domains</option>';
                        domains.forEach(domain => {
                            options += `<option value="${domain}">${domain}</option>`;
                        });
                        filter.innerHTML = options;
                    });
                }
            }

            // Fetch locations for filter
            const locationsResponse = await apiClient.getLocations();
            
            if (locationsResponse.status === 'success') {
                const locations = locationsResponse.data;
                const locationFilters = document.querySelectorAll('#locationFilter');

                if (locations && locations.length > 0) {
                    locationFilters.forEach(filter => {
                        // Keep the "All Locations" option
                        let options = '<option value="All">All Locations</option>';

                        // Add location options
                        locations.forEach(location => {
                            options += `<option value="${location}">${location}</option>`;
                        });

                        filter.innerHTML = options;
                    });
                }
            }

            // Initialize domain comparison selects
            const domainSelects = document.querySelectorAll('#domain1, #domain2');

            if (domains && domains.length > 0 && domainSelects.length > 0) {
                domainSelects.forEach(select => {
                    // Keep the default option
                    let options = '<option value="">Select Domain</option>';

                    // Add domain options
                    domains.forEach(domain => {
                        options += `<option value="${domain}">${domain}</option>`;
                    });

                    select.innerHTML = options;
                });
            }
        } catch (error) {
            console.error('Error initializing filters:', error);
            Utils.createToast('Failed to initialize filters', 'danger');
        }
    },

    // Handle domain comparison
    initDomainComparison: () => {
        const compareBtn = document.getElementById('compareBtn');

        if (compareBtn) {
            compareBtn.addEventListener('click', async () => {
                const domain1 = document.getElementById('domain1').value;
                const domain2 = document.getElementById('domain2').value;

                if (!domain1 || !domain2) {
                    Utils.createToast('Please select two domains to compare', 'warning');
                    return;
                }

                try {
                    // Show loading state
                    compareBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Comparing...';
                    compareBtn.disabled = true;

                    // Fetch comparison data
                    const comparisonResponse = await apiClient.compareDomains(domain1, domain2);
                    
                    if (comparisonResponse.status === 'success') {
                        const comparisonData = comparisonResponse.data;

                        // Update comparison results
                        const results = document.getElementById('comparisonResults');

                        // Update domain titles
                        document.getElementById('domain1Title').textContent = comparisonData.domain1.name;
                        document.getElementById('domain2Title').textContent = comparisonData.domain2.name;

                        // Update domain 1 details
                        document.getElementById('domain1Salary').textContent = Utils.formatCurrency(comparisonData.domain1.avg_salary || 0);
                        document.getElementById('domain1Count').textContent = Utils.formatNumber(comparisonData.domain1.count || 0);

                        // Format top companies for domain 1
                        const domain1Companies = Object.entries(comparisonData.domain1.top_companies || {})
                            .map(([company, count]) => `${company} (${count})`)
                            .join(', ');
                        document.getElementById('domain1Companies').textContent = domain1Companies || 'No data';

                        // Format top locations for domain 1
                        const domain1Locations = Object.entries(comparisonData.domain1.top_locations || {})
                            .map(([location, count]) => `${location} (${count})`)
                            .join(', ');
                        document.getElementById('domain1Locations').textContent = domain1Locations || 'No data';

                        // Update domain 2 details
                        document.getElementById('domain2Salary').textContent = Utils.formatCurrency(comparisonData.domain2.avg_salary || 0);
                        document.getElementById('domain2Count').textContent = Utils.formatNumber(comparisonData.domain2.count || 0);

                        // Format top companies for domain 2
                        const domain2Companies = Object.entries(comparisonData.domain2.top_companies || {})
                            .map(([company, count]) => `${company} (${count})`)
                            .join(', ');
                        document.getElementById('domain2Companies').textContent = domain2Companies || 'No data';

                        // Format top locations for domain 2
                        const domain2Locations = Object.entries(comparisonData.domain2.top_locations || {})
                            .map(([location, count]) => `${location} (${count})`)
                            .join(', ');
                        document.getElementById('domain2Locations').textContent = domain2Locations || 'No data';

                        // Generate comparison analysis
                        const salaryDiff = comparisonData.domain1.avg_salary - comparisonData.domain2.avg_salary;
                        const countDiff = comparisonData.domain1.count - comparisonData.domain2.count;

                        let analysis = `<p><strong>${comparisonData.domain1.name}</strong> ${salaryDiff > 0 ? 'offers a higher average salary by' : 'has a lower average salary by'} ${Utils.formatCurrency(Math.abs(salaryDiff))} compared to <strong>${comparisonData.domain2.name}</strong>.</p>`;

                        analysis += `<p>In terms of demand, <strong>${comparisonData.domain1.name}</strong> ${countDiff > 0 ? 'has more openings with' : 'has fewer openings with'} ${Math.abs(countDiff)} ${countDiff > 0 ? 'more' : 'less'} listings compared to <strong>${comparisonData.domain2.name}</strong>.</p>`;

                        // Add recommendation based on data
                        if (salaryDiff > 0 && countDiff > 0) {
                            analysis += `<p class="text-success"><strong>Recommendation:</strong> <strong>${comparisonData.domain1.name}</strong> currently offers better opportunities with both higher demand and better compensation.</p>`;
                        } else if (salaryDiff > 0 && countDiff < 0) {
                            analysis += `<p class="text-warning"><strong>Recommendation:</strong> <strong>${comparisonData.domain1.name}</strong> offers better compensation but <strong>${comparisonData.domain2.name}</strong> has more openings. Consider your priorities between salary and job availability.</p>`;
                        } else if (salaryDiff < 0 && countDiff > 0) {
                            analysis += `<p class="text-warning"><strong>Recommendation:</strong> <strong>${comparisonData.domain1.name}</strong> has more openings but <strong>${comparisonData.domain2.name}</strong> offers better compensation. Consider your priorities between salary and job availability.</p>`;
                        } else {
                            analysis += `<p class="text-success"><strong>Recommendation:</strong> <strong>${comparisonData.domain2.name}</strong> currently offers better opportunities with both higher demand and better compensation.</p>`;
                        }

                        document.getElementById('comparisonAnalysis').innerHTML = analysis;

                        // Show results
                        results.classList.remove('d-none');
                        results.classList.add('show');
                    }
                } catch (error) {
                    console.error('Error comparing domains:', error);
                    Utils.createToast('Failed to compare domains', 'danger');
                } finally {
                    // Reset button state
                    compareBtn.innerHTML = '<i class="fas fa-chart-line me-2"></i>Compare Domains';
                    compareBtn.disabled = false;
                }
            });
        }
    }
};

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Initialize filters
    Utils.initializeFilters();

    // Initialize domain comparison
    Utils.initDomainComparison();

    // Range slider for minimum salary filter (if present)
    const minSalaryFilter = document.getElementById('minSalaryFilter');
    const minSalaryValue = document.getElementById('minSalaryValue');

    if (minSalaryFilter && minSalaryValue) {
        minSalaryFilter.addEventListener('input', () => {
            minSalaryValue.textContent = Utils.formatCurrency(parseInt(minSalaryFilter.value));
        });
    }
});
