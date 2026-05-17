// Dashboard.js - Handles the main dashboard functionality

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize charts and fetch key insights
        await Promise.all([
            loadKeyMetrics(),
            initDomainDemandChart(),
            initSalaryRangeChart(),
            initTopCompaniesChart(),
            initTopCitiesChart(),
            initModals()
        ]);
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        Utils.createToast('Failed to initialize dashboard', 'danger');
    }
});

// Initialize modals
async function initModals() {
    // Quick Insights Modal
    const quickInsightsModal = document.getElementById('quickInsightsModal');
    if (quickInsightsModal) {
        quickInsightsModal.addEventListener('show.bs.modal', loadQuickInsights);
    }

    // Compare Domains Modal
    const compareDomainsModal = document.getElementById('compareDomainsModal');
    if (compareDomainsModal) {
        // Load domains for dropdowns
        const domainsResponse = await apiClient.getDomains();
        const domains = domainsResponse.status === 'success' ? domainsResponse.data : [];

        const domain1Select = document.getElementById('domain1');
        const domain2Select = document.getElementById('domain2');

        // Populate dropdowns
        domains.forEach(domain => {
            const option1 = new Option(domain, domain);
            const option2 = new Option(domain, domain);
            domain1Select.add(option1);
            domain2Select.add(option2);
        });

        // Add change event listeners
        domain1Select.addEventListener('change', updateComparison);
        domain2Select.addEventListener('change', updateComparison);
    }
}

// Load key metrics for the dashboard
async function loadKeyMetrics() {
    try {
        const response = await apiClient.getKeyInsights();
        const insights = response.status === 'success' ? response.data : {};

        if (insights) {
            // Update top domain
            document.getElementById('topDomain').textContent = insights.top_domain || 'N/A';

            // Update average salary
            document.getElementById('avgSalary').textContent = Utils.formatCurrency(insights.avg_salary || 0);

            // Update top company
            document.getElementById('topCompany').textContent = insights.top_company || 'N/A';

            // Update top location
            document.getElementById('topLocation').textContent = insights.top_location || 'N/A';
        }
    } catch (error) {
        console.error('Error loading key metrics:', error);
        Utils.createToast('Failed to load key metrics', 'danger');
    }
}

// Initialize domain demand chart
async function initDomainDemandChart() {
    try {
        Utils.showLoading('domainChartLoader');

        const response = await apiClient.getTopDomains();
        const data = response.status === 'success' ? response.data : [];

        if (data && data.length > 0) {
            const ctx = document.getElementById('domainDemandChart').getContext('2d');

            // Extract domain names and counts
            const domains = data.map(item => item.domain);
            const counts = data.map(item => item.count);
            const colors = Utils.generateColors(domains.length, 0.8);

            // Create chart
            const domainDemandChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: domains,
                    datasets: [{
                        label: 'Number of Listings',
                        data: counts,
                        backgroundColor: colors,
                        borderColor: colors.map(color => color.replace(', 0.8)', ', 1)')),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Listings: ${context.raw}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#adb5bd'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: '#adb5bd',
                                maxRotation: 45,
                                minRotation: 45
                            }
                        }
                    }
                }
            });
        } else {
            document.getElementById('domainDemandChart').innerHTML = '<div class="text-center p-4">No data available</div>';
        }
    } catch (error) {
        console.error('Error initializing domain demand chart:', error);
    } finally {
        Utils.hideLoading('domainChartLoader');
    }
}

// Initialize salary range chart
async function initSalaryRangeChart() {
    try {
        Utils.showLoading('salaryChartLoader');

        const response = await apiClient.getSalaryInsights();
        const data = response.status === 'success' ? response.data : [];

        if (data && data.length > 0) {
            const ctx = document.getElementById('salaryRangeChart').getContext('2d');

            // Extract top 5 domains and their average salaries
            const topDomains = data.slice(0, 5);
            const domains = topDomains.map(item => item.domain);
            const avgSalaries = topDomains.map(item => item.avg_salary);

            // Create chart
            const salaryRangeChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: domains,
                    datasets: [{
                        data: avgSalaries,
                        backgroundColor: Utils.generateColors(domains.length, 0.8),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                color: '#adb5bd',
                                font: {
                                    size: 11
                                },
                                boxWidth: 12
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: ${Utils.formatCurrency(context.raw)}`;
                                }
                            }
                        }
                    }
                }
            });
        } else {
            document.getElementById('salaryRangeChart').innerHTML = '<div class="text-center p-4">No data available</div>';
        }
    } catch (error) {
        console.error('Error initializing salary range chart:', error);
    } finally {
        Utils.hideLoading('salaryChartLoader');
    }
}

// Initialize top companies chart
async function initTopCompaniesChart() {
    try {
        Utils.showLoading('companiesChartLoader');

        const response = await apiClient.getCompanyHiring();
        const data = response.status === 'success' ? response.data : [];

        if (data && data.length > 0) {
            const ctx = document.getElementById('topCompaniesChart').getContext('2d');

            // Extract company names and counts
            const companies = data.slice(0, 7).map(item => item.company);
            const counts = data.slice(0, 7).map(item => item.count);

            // Create chart
            const topCompaniesChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: companies,
                    datasets: [{
                        label: 'Number of Openings',
                        data: counts,
                        backgroundColor: Utils.generateColors(companies.length, 0.8),
                        borderColor: 'rgba(76, 201, 240, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Openings: ${context.raw}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#adb5bd'
                            }
                        },
                        y: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: '#adb5bd'
                            }
                        }
                    }
                }
            });
        } else {
            document.getElementById('topCompaniesChart').innerHTML = '<div class="text-center p-4">No data available</div>';
        }
    } catch (error) {
        console.error('Error initializing top companies chart:', error);
    } finally {
        Utils.hideLoading('companiesChartLoader');
    }
}

// Initialize top cities chart
async function initTopCitiesChart() {
    try {
        Utils.showLoading('citiesChartLoader');

        const response = await apiClient.getJobsByCity();
        const data = response.status === 'success' ? response.data : [];

        if (data && data.length > 0) {
            const ctx = document.getElementById('topCitiesChart').getContext('2d');

            // Extract city names and counts
            const cities = data.slice(0, 6).map(item => item.city);
            const counts = data.slice(0, 6).map(item => item.count);
            const colors = Utils.generateColors(cities.length, 0.7);

            // Create chart
            const topCitiesChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: cities,
                    datasets: [{
                        data: counts,
                        backgroundColor: colors,
                        borderColor: colors.map(color => color.replace(', 0.7)', ', 1)')),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                color: '#adb5bd',
                                font: {
                                    size: 11
                                },
                                boxWidth: 12
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((context.raw / total) * 100);
                                    return `${context.label}: ${context.raw} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        } else {
            document.getElementById('topCitiesChart').innerHTML = '<div class="text-center p-4">No data available</div>';
        }
    } catch (error) {
        console.error('Error initializing top cities chart:', error);
    } finally {
        Utils.hideLoading('citiesChartLoader');
    }
}

// Load quick insights for the modal
async function loadQuickInsights() {
    try {
        const insightsResponse = await apiClient.getKeyInsights();
        const insights = insightsResponse.status === 'success' ? insightsResponse.data : null;
        
        const domainsResponse = await apiClient.getTopDomains();
        const domainData = domainsResponse.status === 'success' ? domainsResponse.data : [];
        
        const salaryResponse = await apiClient.getSalaryInsights();
        const salaryData = salaryResponse.status === 'success' ? salaryResponse.data : [];

        if (insights && domainData.length > 0 && salaryData.length > 0) {
            // Get the count for the top hiring domain
            const topDomainData = domainData.find(d => d.domain === insights.top_domain) || { count: 0 };

            // Highest paying domain
            document.getElementById('highestPayingDomain').textContent = `${insights.highest_paying_domain} (${Utils.formatCurrency(salaryData[0]?.avg_salary || 0)})`;

            // Most in-demand domain
            document.getElementById('mostInDemandDomain').textContent = `${insights.top_domain} with ${Utils.formatNumber(topDomainData.count)} openings`;

            // Top hiring company
            document.getElementById('topHiringCompany').textContent = insights.top_company || 'N/A';

            // Top hiring location
            document.getElementById('topHiringLocation').textContent = insights.top_location || 'N/A';
        }
    } catch (error) {
        console.error('Error loading quick insights:', error);
        Utils.createToast('Failed to load insights', 'danger');
    }
}

// Update domain comparison
async function updateComparison() {
    const domain1 = document.getElementById('domain1').value;
    const domain2 = document.getElementById('domain2').value;
    const resultsDiv = document.getElementById('comparisonResults');

    if (!domain1 || !domain2) {
        resultsDiv.classList.add('d-none');
        return;
    }

    try {
        const response = await apiClient.compareDomains(domain1, domain2);
        if (response.status === 'success') {
            const data = response.data;
            
            // Update domain 1 data
            document.getElementById('domain1Name').textContent = data.domain1.name;
            document.getElementById('domain1Salary').textContent = Utils.formatCurrency(data.domain1.avg_salary);
            document.getElementById('domain1Count').textContent = data.domain1.count;
            
            // Update domain 1 companies
            const companies1 = document.getElementById('domain1Companies');
            companies1.innerHTML = Object.entries(data.domain1.top_companies)
                .map(([company, count]) => `<li>${company}: ${count}</li>`)
                .join('');
            
            // Update domain 1 locations
            const locations1 = document.getElementById('domain1Locations');
            locations1.innerHTML = Object.entries(data.domain1.top_locations)
                .map(([location, count]) => `<li>${location}: ${count}</li>`)
                .join('');
            
            // Update domain 2 data
            document.getElementById('domain2Name').textContent = data.domain2.name;
            document.getElementById('domain2Salary').textContent = Utils.formatCurrency(data.domain2.avg_salary);
            document.getElementById('domain2Count').textContent = data.domain2.count;
            
            // Update domain 2 companies
            const companies2 = document.getElementById('domain2Companies');
            companies2.innerHTML = Object.entries(data.domain2.top_companies)
                .map(([company, count]) => `<li>${company}: ${count}</li>`)
                .join('');
            
            // Update domain 2 locations
            const locations2 = document.getElementById('domain2Locations');
            locations2.innerHTML = Object.entries(data.domain2.top_locations)
                .map(([location, count]) => `<li>${location}: ${count}</li>`)
                .join('');

            resultsDiv.classList.remove('d-none');
        } else {
            Utils.createToast('Failed to load comparison data', 'danger');
        }
    } catch (error) {
        console.error('Error comparing domains:', error);
        Utils.createToast('Failed to compare domains', 'danger');
    }
}
