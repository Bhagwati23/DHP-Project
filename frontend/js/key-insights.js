// Key-insights.js - Handles the key insights page functionality

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize all components
        await Promise.all([
            loadMarketOverview(),
            initMarketOverviewChart(),
            initTopPayingDomainsChart(),
            initMostDemandDomainsChart(),
            generateDomainInsights(),
            generateRecommendations()
        ]);

        // Initialize scroll to recommendations
        initScrollToRecommendations();

        // Initialize comparison functionality for modal
        Utils.initDomainComparison();
    } catch (error) {
        console.error('Error initializing key insights page:', error);
        Utils.createToast('Failed to initialize key insights page', 'danger');
    }
});

// Load market overview data
async function loadMarketOverview() {
    try {
        const response = await apiClient.getKeyInsights();
        const insights = response.status === 'success' ? response.data : {};

        if (insights) {
            // Market overview cards
            if (document.getElementById('totalDomains')) document.getElementById('totalDomains').textContent = Utils.formatNumber(insights.total_domains || 0);
            if (document.getElementById('totalCompanies')) document.getElementById('totalCompanies').textContent = Utils.formatNumber(insights.total_companies || 0);
            if (document.getElementById('avgInternshipSalary')) document.getElementById('avgInternshipSalary').textContent = Utils.formatCurrency(insights.avg_salary || 0);
            if (document.getElementById('totalListings')) document.getElementById('totalListings').textContent = Utils.formatNumber(insights.total_listings || 0);

            // Highlight cards (Fixing the IDs to match key-insights.html exactly)
            if (document.getElementById('topDomainName')) {
                document.getElementById('topDomainName').textContent = insights.top_domain || 'N/A';
            }
            if (document.getElementById('topCompanyName')) {
                document.getElementById('topCompanyName').textContent = insights.top_company || 'N/A';
            }
            if (document.getElementById('highestPayingDomain')) {
                document.getElementById('highestPayingDomain').textContent = insights.highest_paying_domain || 'N/A';
            }
            if (document.getElementById('highestSalaryAmount')) {
                document.getElementById('highestSalaryAmount').textContent = Utils.formatCurrency(insights.highest_salary || 0);
            }
        }
    } catch (error) {
        console.error('Error loading market overview:', error);
    }
}

// Initialize market overview chart
async function initMarketOverviewChart() {
    try {
        Utils.showLoading('overviewChartLoader');

        // Get domain counts
        const response = await apiClient.getTopDomains();
        const domainData = response.status === 'success' ? response.data : [];

        if (domainData && domainData.length > 0) {
            const ctx = document.getElementById('marketOverviewChart').getContext('2d');

            // Extract top 5 domains and counts
            const domains = domainData.slice(0, 5).map(item => item.domain);
            const counts = domainData.slice(0, 5).map(item => item.count);

            // Create chart
            const marketOverviewChart = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: domains,
                    datasets: [{
                        label: 'Demand',
                        data: counts,
                        backgroundColor: 'rgba(76, 201, 240, 0.4)',
                        borderColor: 'rgba(76, 201, 240, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(76, 201, 240, 1)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgba(76, 201, 240, 1)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    elements: {
                        line: {
                            tension: 0.1
                        }
                    },
                    scales: {
                        r: {
                            angleLines: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            pointLabels: {
                                color: '#adb5bd',
                                font: {
                                    size: 11
                                }
                            },
                            ticks: {
                                backdropColor: 'transparent',
                                color: '#adb5bd'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });

            // Update trending domains in the UI
            if (domains.length >= 4) {
                document.getElementById('trendingDomain1').textContent = domains[0];
                document.getElementById('trendingDomain1Growth').textContent = '32%';

                document.getElementById('trendingDomain2').textContent = domains[1];
                document.getElementById('trendingDomain2Growth').textContent = '28%';

                document.getElementById('emergingDomain1').textContent = domains[2];
                document.getElementById('emergingDomain1Growth').textContent = '18%';

                // This is just for demonstration - in a real app this would be based on real trend data
                document.getElementById('decliningDomain1').textContent = 'Web Development';
                document.getElementById('decliningDomain1Growth').textContent = '5%';
            }
        } else {
            document.getElementById('marketOverviewChart').innerHTML = '<div class="text-center p-4">No data available</div>';
        }
    } catch (error) {
        console.error('Error initializing market overview chart:', error);
    } finally {
        Utils.hideLoading('overviewChartLoader');
    }
}

// Initialize top paying domains chart
async function initTopPayingDomainsChart() {
    try {
        Utils.showLoading('payingChartLoader');

        // Get salary data
        const response = await apiClient.getSalaryInsights();
        const salaryData = response.status === 'success' ? response.data : [];

        if (salaryData && salaryData.length > 0) {
            const ctx = document.getElementById('topPayingDomainsChart').getContext('2d');

            // Extract top 5 domains by salary
            const sortedData = [...salaryData].sort((a, b) => b.avg_salary - a.avg_salary).slice(0, 5);
            const domains = sortedData.map(item => item.domain);
            const salaries = sortedData.map(item => item.avg_salary);

            // Create chart
            const topPayingDomainsChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: domains,
                    datasets: [{
                        label: 'Average Salary (₹)',
                        data: salaries,
                        backgroundColor: 'rgba(247, 37, 133, 0.7)',
                        borderColor: 'rgba(247, 37, 133, 1)',
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
                                    return `Avg. Salary: ${Utils.formatCurrency(context.raw)}`;
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
                                callback: function(value) {
                                    return Utils.formatCurrency(value);
                                },
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
            document.getElementById('topPayingDomainsChart').innerHTML = '<div class="text-center p-4">No data available</div>';
        }
    } catch (error) {
        console.error('Error initializing top paying domains chart:', error);
    } finally {
        Utils.hideLoading('payingChartLoader');
    }
}

// Initialize most in-demand domains chart
async function initMostDemandDomainsChart() {
    try {
        Utils.showLoading('demandChartLoader');

        // Get domain counts
        const response = await apiClient.getTopDomains();
        const domainData = response.status === 'success' ? response.data : [];

        if (domainData && domainData.length > 0) {
            const ctx = document.getElementById('mostDemandDomainsChart').getContext('2d');

            // Extract top 5 domains by count
            const topDomains = domainData.slice(0, 5);
            const domains = topDomains.map(item => item.domain);
            const counts = topDomains.map(item => item.count);

            // Create chart
            const mostDemandDomainsChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: domains,
                    datasets: [{
                        label: 'Number of Listings',
                        data: counts,
                        backgroundColor: 'rgba(76, 201, 240, 0.7)',
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
                                    return `Listings: ${context.raw}`;
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
            document.getElementById('mostDemandDomainsChart').innerHTML = '<div class="text-center p-4">No data available</div>';
        }
    } catch (error) {
        console.error('Error initializing most demand domains chart:', error);
    } finally {
        Utils.hideLoading('demandChartLoader');
    }
}

// Generate domain insights
async function generateDomainInsights() {
    try {
        // Get salary data
        const salaryResponse = await apiClient.getSalaryInsights();
        const salaryData = salaryResponse.status === 'success' ? salaryResponse.data : [];
        // Get domain counts
        const domainResponse = await apiClient.getTopDomains();
        const domainCounts = domainResponse.status === 'success' ? domainResponse.data : [];

        if (salaryData && domainCounts && salaryData.length > 0 && domainCounts.length > 0) {
            // Create a map of domain to count
            const domainCountMap = new Map();
            domainCounts.forEach(item => {
                domainCountMap.set(item.domain, item.count);
            });

            // Create combined data for analysis
            const combinedData = salaryData.map(item => {
                return {
                    domain: item.domain,
                    avg_salary: item.avg_salary,
                    count: domainCountMap.get(item.domain) || 0
                };
            });

            // Sort by various metrics to find insights
            const sortedBySalary = [...combinedData].sort((a, b) => b.avg_salary - a.avg_salary);
            const sortedByDemand = [...combinedData].sort((a, b) => b.count - a.count);

            // Calculate average salary and demand
            const avgSalary = combinedData.reduce((sum, item) => sum + item.avg_salary, 0) / combinedData.length;
            const avgDemand = combinedData.reduce((sum, item) => sum + item.count, 0) / combinedData.length;

            // Generate insights
            const insights = [
                {
                    title: `${sortedBySalary[0].domain} offers highest average salary`,
                    description: `With an average of ${Utils.formatCurrency(sortedBySalary[0].avg_salary)}, ${sortedBySalary[0].domain} offers ${Math.round((sortedBySalary[0].avg_salary / avgSalary - 1) * 100)}% above the market average.`,
                    type: 'positive'
                },
                {
                    title: `${sortedByDemand[0].domain} has highest market demand`,
                    description: `With ${sortedByDemand[0].count} open positions, ${sortedByDemand[0].domain} leads the market in terms of opportunities.`,
                    type: 'positive'
                },
                {
                    title: 'Remote work opportunities are abundant',
                    description: 'Many companies offer "Work from home" options, providing flexibility for interns regardless of location.',
                    type: 'neutral'
                }
            ];

            // Find domains with high demand and high salary
            const highValueDomains = combinedData.filter(item => 
                item.avg_salary > avgSalary && item.count > avgDemand
            ).sort((a, b) => (b.avg_salary * b.count) - (a.avg_salary * a.count));

            if (highValueDomains.length > 0) {
                insights.push({
                    title: `${highValueDomains[0].domain} offers best value proposition`,
                    description: `With high demand (${highValueDomains[0].count} listings) and excellent compensation (${Utils.formatCurrency(highValueDomains[0].avg_salary)}), this domain offers the best balance.`,
                    type: 'positive'
                });
            }

            // Find domains with low demand but high salary
            const nicheDomains = combinedData.filter(item => 
                item.avg_salary > avgSalary && item.count < avgDemand
            ).sort((a, b) => b.avg_salary - a.avg_salary);

            if (nicheDomains.length > 0) {
                insights.push({
                    title: `${nicheDomains[0].domain} is a lucrative niche`,
                    description: `Despite fewer opportunities (${nicheDomains[0].count} listings), this domain offers excellent compensation (${Utils.formatCurrency(nicheDomains[0].avg_salary)}).`,
                    type: 'warning'
                });
            }

            // Update the domain insights section
            const domainInsightsContainer = document.getElementById('domainInsights');
            if (domainInsightsContainer) {
                let insightsHTML = '';

                insights.forEach(insight => {
                    insightsHTML += `
                        <div class="col-lg-6 mb-3">
                            <div class="card bg-dark-secondary insight-card ${insight.type}">
                                <div class="card-body">
                                    <h5 class="card-title">${insight.title}</h5>
                                    <p class="card-text">${insight.description}</p>
                                </div>
                            </div>
                        </div>
                    `;
                });

                domainInsightsContainer.innerHTML = insightsHTML;
            }
        }
    } catch (error) {
        console.error('Error generating domain insights:', error);
    }
}

// Generate recommendations
async function generateRecommendations() {
    try {
        // Get salary data
        const salaryData = await apiClient.getSalaryInsights().then(res => res.status === 'success' ? res.data : []);
        // Get domain counts
        const domainCounts = await apiClient.getTopDomains().then(res => res.status === 'success' ? res.data : []);
        // Get key insights
        const keyInsights = await apiClient.getKeyInsights().then(res => res.status === 'success' ? res.data : {});

        if (salaryData && domainCounts && keyInsights) {
            // Create recommendations based on data
            const recommendations = [
                {
                    title: 'Focus on High-Demand, High-Salary Domains',
                    description: `Data shows that ${keyInsights.highest_paying_domain} offers the highest average salary. Consider developing skills in this area to maximize earning potential.`,
                    icon: 'star',
                    color: 'success'
                },
                {
                    title: 'Consider Remote Opportunities',
                    description: 'Many companies offer remote internships, which provide flexibility and wider job access regardless of your location.',
                    icon: 'home',
                    color: 'info'
                },
                {
                    title: `Target Top Hiring Companies`,
                    description: `${keyInsights.top_company} leads with the most internship listings. Research their requirements and tailor your applications accordingly.`,
                    icon: 'building',
                    color: 'primary'
                },
                {
                    title: 'Develop Cross-Domain Skills',
                    description: 'Companies value interns with skills that span multiple domains. Consider learning complementary skills to increase your marketability.',
                    icon: 'code-branch',
                    color: 'warning'
                },
                {
                    title: 'Optimize for Growth Opportunities',
                    description: 'When comparing offers, consider not just the salary but also the learning potential and future career prospects.',
                    icon: 'chart-line',
                    color: 'danger'
                },
                {
                    title: 'Prepare for Technical Interviews',
                    description: 'Most high-paying domains require technical assessments. Practice problem-solving and prepare for domain-specific questions.',
                    icon: 'laptop-code',
                    color: 'secondary'
                }
            ];

            // Update the recommendations section
            const recommendationCards = document.getElementById('recommendationCards');
            if (recommendationCards) {
                let cardsHTML = '';

                recommendations.forEach(recommendation => {
                    cardsHTML += `
                        <div class="col-lg-4 col-md-6 mb-4">
                            <div class="card bg-dark-secondary h-100 shadow-sm">
                                <div class="card-body">
                                    <div class="d-flex align-items-center mb-3">
                                        <div class="icon-circle bg-${recommendation.color} text-white me-3">
                                            <i class="fas fa-${recommendation.icon}"></i>
                                        </div>
                                        <h5 class="card-title mb-0">${recommendation.title}</h5>
                                    </div>
                                    <p class="card-text">${recommendation.description}</p>
                                </div>
                            </div>
                        </div>
                    `;
                });

                recommendationCards.innerHTML = cardsHTML;

                // Add CSS for icon circles
                const style = document.createElement('style');
                style.textContent = `
                    .icon-circle {
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                `;
                document.head.appendChild(style);
            }
        }
    } catch (error) {
        console.error('Error generating recommendations:', error);
    }
}

// Initialize scroll to recommendations functionality
function initScrollToRecommendations() {
    const jumpButton = document.getElementById('jumpToRecommendations');
    const recommendationSection = document.getElementById('recommendationSection');

    if (jumpButton && recommendationSection) {
        jumpButton.addEventListener('click', () => {
            recommendationSection.scrollIntoView({ behavior: 'smooth' });
        });
    }
}
