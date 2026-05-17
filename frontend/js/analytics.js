// Analytics.js - Handles the analytics page functionality

// Utility function to calculate median of an array
function calculateMedian(arr) {
    if (arr.length === 0) return 0;
    
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize all charts
        await Promise.all([
            initSalaryByDomainChart(),
            initLocationDistributionChart(),
            initSalaryVsDemandChart(),
            initCompanyHiringChart(),
            loadSalaryStats(),
            initMarketQuadrants()
        ]);

        // Initialize filter functionality
        initFilterFunctionality();
    } catch (error) {
        console.error('Error initializing analytics page:', error);
        Utils.createToast('Failed to initialize analytics page', 'danger');
    }
});

// Initialize salary by domain chart
async function initSalaryByDomainChart() {
    try {
        Utils.showLoading('salaryChartLoader');
        
        const response = await apiClient.getSalaryInsights();
        const data = response.status === 'success' ? response.data : [];
        
        if (data && data.length > 0) {
            const ctx = document.getElementById('salaryByDomainChart').getContext('2d');
            
            // Extract domain names and average salaries
            const domains = data.slice(0, 10).map(item => item.domain);
            const salaries = data.slice(0, 10).map(item => item.avg_salary);
            
            // Create gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(76, 201, 240, 0.8)');
            gradient.addColorStop(1, 'rgba(76, 201, 240, 0.1)');
            
            // Create chart
            window.salaryByDomainChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: domains,
                    datasets: [{
                        label: 'Average Salary (₹)',
                        data: salaries,
                        backgroundColor: gradient,
                        borderColor: 'rgba(76, 201, 240, 1)',
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
                                    return `Average Salary: ${Utils.formatCurrency(context.raw)}`;
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
                                callback: function(value) {
                                    return Utils.formatCurrency(value);
                                },
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
            document.getElementById('salaryByDomainChart').innerHTML = '<div class="text-center p-4">No data available</div>';
        }
    } catch (error) {
        console.error('Error initializing salary by domain chart:', error);
    } finally {
        Utils.hideLoading('salaryChartLoader');
    }
}

// Initialize location distribution chart
async function initLocationDistributionChart() {
    try {
        Utils.showLoading('locationChartLoader');
        
        const response = await apiClient.getJobsByCity();
        const data = response.status === 'success' ? response.data : [];
        
        if (data && data.length > 0) {
            const ctx = document.getElementById('locationDistributionChart').getContext('2d');
            
            // Extract location names and counts
            const locations = data.slice(0, 8).map(item => item.city);
            const counts = data.slice(0, 8).map(item => item.count);
            const colors = Utils.generateColors(locations.length, 0.8);
            
            // Create chart
            window.locationDistributionChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: locations,
                    datasets: [{
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
                            position: 'right',
                            labels: {
                                color: '#adb5bd',
                                font: {
                                    size: 12
                                }
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
            
            // Update location table
            updateLocationTable(data);
        } else {
            document.getElementById('locationDistributionChart').innerHTML = '<div class="text-center p-4">No data available</div>';
        }
    } catch (error) {
        console.error('Error initializing location distribution chart:', error);
    } finally {
        Utils.hideLoading('locationChartLoader');
    }
}

// Update location table with data
async function updateLocationTable(locationData) {
    try {
        const tableBody = document.getElementById('locationTableBody');
        
        if (tableBody && locationData && locationData.length > 0) {
            // Get filtered data to calculate average salary per location
            const filteredResponse = await apiClient.getFilteredData();
            const filteredData = filteredResponse.status === 'success' ? filteredResponse.data : [];
            
            // Create a map of location to average salary
            const locationSalaryMap = new Map();
            
            if (filteredData && filteredData.length > 0) {
                // Group by location and calculate average salary
                filteredData.forEach(item => {
                    if (!locationSalaryMap.has(item.Location)) {
                        locationSalaryMap.set(item.Location, {
                            total: item.avg_salary,
                            count: 1
                        });
                    } else {
                        const current = locationSalaryMap.get(item.Location);
                        locationSalaryMap.set(item.Location, {
                            total: current.total + item.avg_salary,
                            count: current.count + 1
                        });
                    }
                });
            }
            
            // Clear table
            tableBody.innerHTML = '';
            
            // Add rows for top 5 locations
            locationData.slice(0, 5).forEach(location => {
                const row = document.createElement('tr');
                
                // Calculate average salary for this location
                const salaryInfo = locationSalaryMap.get(location.city);
                const avgSalary = salaryInfo ? (salaryInfo.total / salaryInfo.count) : 0;
                
                row.innerHTML = `
                    <td>${location.city}</td>
                    <td>${location.count}</td>
                    <td>${Utils.formatCurrency(avgSalary)}</td>
                `;
                
                tableBody.appendChild(row);
            });
            
            // Update location analysis
            const topLocation = locationData[0]?.city || 'N/A';
            const topLocationCount = locationData[0]?.count || 0;
            const topLocationPercentage = Math.round((topLocationCount / locationData.reduce((acc, loc) => acc + loc.count, 0)) * 100);
            
            const locationAnalysis = document.getElementById('locationAnalysis');
            if (locationAnalysis) {
                locationAnalysis.innerHTML = `
                    <strong>${topLocation}</strong> leads with ${topLocationCount} internship listings (${topLocationPercentage}% of total). 
                    Remote work ("Work from home") accounts for a significant portion of all opportunities, providing flexibility for interns.
                    Consider targeting companies in these top locations for better internship prospects.
                `;
            }
        }
    } catch (error) {
        console.error('Error updating location table:', error);
    }
}

// Initialize salary vs. demand scatter chart
async function initSalaryVsDemandChart() {
    try {
        Utils.showLoading('scatterChartLoader');
        
        // Get domain counts and salary data
        const [domainResponse, salaryResponse] = await Promise.all([
            apiClient.getTopDomains(),
            apiClient.getSalaryInsights()
        ]);
        
        if (domainResponse.status !== 'success' || salaryResponse.status !== 'success') {
            throw new Error('Failed to fetch domain or salary data');
        }
        
        const domainCounts = domainResponse.data;
        const salaryData = salaryResponse.data;
        
        if (domainCounts && salaryData && domainCounts.length > 0 && salaryData.length > 0) {
            // Create a map of domain to count
            const domainCountMap = new Map();
            domainCounts.forEach(item => {
                domainCountMap.set(item.domain, item.count);
            });
            
            // Create dataset for scatter plot
            const scatterData = [];
            
            salaryData.forEach(item => {
                if (domainCountMap.has(item.domain)) {
                    scatterData.push({
                        x: domainCountMap.get(item.domain), // demand (count)
                        y: item.avg_salary, // salary
                        domain: item.domain
                    });
                }
            });
            
            const ctx = document.getElementById('salaryVsDemandChart').getContext('2d');
            
            // Create chart
            window.salaryVsDemandChart = new Chart(ctx, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Domains',
                        data: scatterData,
                        backgroundColor: 'rgba(76, 201, 240, 0.7)',
                        borderColor: 'rgba(76, 201, 240, 1)',
                        borderWidth: 1,
                        pointRadius: 8,
                        pointHoverRadius: 10
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const point = context.raw;
                                    return [
                                        `Domain: ${point.domain}`,
                                        `Demand: ${point.x} listings`,
                                        `Avg. Salary: ${Utils.formatCurrency(point.y)}`
                                    ];
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            title: {
                                display: true,
                                text: 'Demand (Number of Listings)',
                                color: '#adb5bd'
                            },
                            ticks: {
                                color: '#adb5bd'
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            title: {
                                display: true,
                                text: 'Average Salary (₹)',
                                color: '#adb5bd'
                            },
                            ticks: {
                                callback: function(value) {
                                    return Utils.formatCurrency(value);
                                },
                                color: '#adb5bd'
                            }
                        }
                    }
                }
            });
            
            // Update the demand vs salary analysis
            updateDemandSalaryAnalysis(scatterData);
        } else {
            document.getElementById('salaryVsDemandChart').innerHTML = '<div class="text-center p-4">No data available</div>';
        }
    } catch (error) {
        console.error('Error initializing salary vs demand chart:', error);
    } finally {
        Utils.hideLoading('scatterChartLoader');
    }
}

// Update demand vs salary analysis
function updateDemandSalaryAnalysis(data) {
    if (!data || data.length === 0) return;
    
    // Calculate average values for demand and salary
    const avgDemand = data.reduce((sum, item) => sum + item.x, 0) / data.length;
    const avgSalary = data.reduce((sum, item) => sum + item.y, 0) / data.length;
    
    // Find domains in each quadrant
    const highDemandHighSalary = data
        .filter(item => item.x > avgDemand && item.y > avgSalary)
        .sort((a, b) => b.y - a.y);
        
    const lowDemandHighSalary = data
        .filter(item => item.x <= avgDemand && item.y > avgSalary)
        .sort((a, b) => b.y - a.y);
        
    const highDemandLowSalary = data
        .filter(item => item.x > avgDemand && item.y <= avgSalary)
        .sort((a, b) => b.x - a.x);
        
    const lowDemandLowSalary = data
        .filter(item => item.x <= avgDemand && item.y <= avgSalary)
        .sort((a, b) => a.y - b.y);
    
    // Generate analysis text
    let analysisText = '';
    
    if (highDemandHighSalary.length > 0) {
        const topDomain = highDemandHighSalary[0];
        analysisText += `<strong>${topDomain.domain}</strong> is in high demand with excellent compensation (${Utils.formatCurrency(topDomain.y)}). `;
    }
    
    if (lowDemandHighSalary.length > 0) {
        const topSpecialtyDomain = lowDemandHighSalary[0];
        analysisText += `<strong>${topSpecialtyDomain.domain}</strong> offers high pay (${Utils.formatCurrency(topSpecialtyDomain.y)}) despite fewer openings, indicating specialty skills are valued. `;
    }
    
    if (highDemandLowSalary.length > 0) {
        const topCompetitiveDomain = highDemandLowSalary[0];
        analysisText += `<strong>${topCompetitiveDomain.domain}</strong> has high demand but relatively lower pay, suggesting a competitive market. `;
    }
    
    analysisText += `Domains in the "High Opportunity" quadrant offer the best balance of demand and compensation.`;
    
    // Update the analysis element
    const demandSalaryAnalysis = document.getElementById('demandSalaryAnalysis');
    if (demandSalaryAnalysis) {
        demandSalaryAnalysis.innerHTML = analysisText;
    }
}

// Initialize company hiring chart
async function initCompanyHiringChart() {
    try {
        Utils.showLoading('companyChartLoader');
        
        const response = await apiClient.getCompanyHiring();
        const data = response.status === 'success' ? response.data : [];
        
        if (data && data.length > 0) {
            const ctx = document.getElementById('companyHiringChart').getContext('2d');
            
            // Get top 8 companies
            const topCompanies = data.slice(0, 8);
            
            // Prepare chart data
            const chartData = {
                labels: topCompanies.map(item => item.company),
                datasets: [{
                    label: 'Number of Openings',
                    data: topCompanies.map(item => item.count),
                    backgroundColor: Utils.generateColors(topCompanies.length, 0.7),
                    borderWidth: 1
                }]
            };
            
            // Create chart
            window.companyHiringChart = new Chart(ctx, {
                type: 'bar',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
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
            
            // Update company table
            updateCompanyTable(data);
        } else {
            document.getElementById('companyHiringChart').innerHTML = '<div class="text-center p-4">No data available</div>';
        }
    } catch (error) {
        console.error('Error initializing company hiring chart:', error);
    } finally {
        Utils.hideLoading('companyChartLoader');
    }
}
async function updateCompanyTable(companyData) {
    try {
        const tableBody = document.getElementById('companyTableBody');
        
        if (tableBody && companyData && companyData.length > 0) {
            // Get domain data
            const domainResponse = await apiClient.getTopDomains();
            if (domainResponse.status !== 'success' || !domainResponse.data) {
                throw new Error('Failed to fetch domain data');
            }
            const domainsData = domainResponse.data;
            
            // Create map of domains
            const domainMap = new Map();
            
            if (domainsData) {
                domainsData.forEach(item => {
                    domainMap.set(item.domain, item.count);
                });
            }
            
            // Get filtered data
            const response = await apiClient.getFilteredData();
            if (response.status !== 'success') {
                throw new Error('Failed to fetch filtered data');
            }
            const filteredData = response.data;
            
            // Create map of company to domains
            const companyDomainMap = new Map();
            
            if (filteredData) {
                filteredData.forEach(item => {
                    if (!companyDomainMap.has(item.Company)) {
                        companyDomainMap.set(item.Company, {});
                    }
                    
                    const domainCounts = companyDomainMap.get(item.Company);
                    if (!domainCounts[item['Job Title']]) {
                        domainCounts[item['Job Title']] = 1;
                    } else {
                        domainCounts[item['Job Title']]++;
                    }
                });
            }
            
            // Clear table
            tableBody.innerHTML = '';
            
            // Add rows for top 5 companies
            companyData.slice(0, 5).forEach(company => {
                const row = document.createElement('tr');
                
                // Find the top domain for this company
                const domainCounts = companyDomainMap.get(company.company) || {};
                let topDomain = 'Various';
                let maxCount = 0;
                
                for (const [domain, count] of Object.entries(domainCounts)) {
                    if (count > maxCount) {
                        maxCount = count;
                        topDomain = domain;
                    }
                }
                
                row.innerHTML = `
                    <td>${company.company}</td>
                    <td>${topDomain}</td>
                    <td>${company.count}</td>
                `;
                
                tableBody.appendChild(row);
            });
            
            // Update company analysis
            const topCompany = companyData[0]?.company || 'N/A';
            const topCompanyCount = companyData[0]?.count || 0;
            
            const companyAnalysis = document.getElementById('companyAnalysis');
            if (companyAnalysis) {
                companyAnalysis.innerHTML = `
                    <strong>${topCompany}</strong> is the top recruiter with ${topCompanyCount} internship listings.
                    The top companies focus primarily on tech domains, particularly in software development and data analysis.
                    Target these companies for the most internship opportunities in the market.
                `;
            }
        }
    } catch (error) {
        console.error('Error updating company table:', error);
    }
}

// Load salary statistics
async function loadSalaryStats() {
    try {
        // Fetch salary insights data
        const response = await apiClient.getSalaryInsights();
        const salaryInsights = response.status === 'success' ? response.data : [];
        
        if (salaryInsights && salaryInsights.length > 0) {
            // Sort by avg_salary
            const sortedInsights = [...salaryInsights].sort((a, b) => b.avg_salary - a.avg_salary);
            
            // Get highest and lowest paying domains
            const highestPayingDomain = sortedInsights[0];
            const lowestPayingDomain = sortedInsights[sortedInsights.length - 1];
            
            // Update UI
            document.getElementById('highestPayingDomain').textContent = `${highestPayingDomain.domain} (${Utils.formatCurrency(highestPayingDomain.avg_salary)})`;
            document.getElementById('lowestPayingDomain').textContent = `${lowestPayingDomain.domain} (${Utils.formatCurrency(lowestPayingDomain.avg_salary)})`;
            
            // Calculate salary statistics directly from salary insights data
            const salaryValues = salaryInsights.map(item => item.avg_salary);
            const salaryStats = {
                min: Math.min(...salaryValues),
                max: Math.max(...salaryValues),
                mean: salaryValues.reduce((sum, val) => sum + val, 0) / salaryValues.length,
                median: calculateMedian(salaryValues)
            };
            
            if (salaryStats) {
                document.getElementById('averageSalary').textContent = Utils.formatCurrency(salaryStats.mean);
                document.getElementById('medianSalary').textContent = Utils.formatCurrency(salaryStats.median);
                
                // Update salary analysis
                const salaryRange = salaryStats.max - salaryStats.min;
                const rangePct = Math.round((salaryRange / salaryStats.max) * 100);
                
                document.getElementById('salaryAnalysis').innerHTML = `
                    The internship salary range varies by ${rangePct}% from lowest to highest paying domains.
                    <strong>${highestPayingDomain.domain}</strong> offers ${Math.round((highestPayingDomain.avg_salary / salaryStats.median - 1) * 100)}% above the median salary.
                    Consider targeting high-paying domains for better compensation.
                `;
            }
        }
    } catch (error) {
        console.error('Error loading salary stats:', error);
    }
}

// Initialize market quadrants
async function initMarketQuadrants() {
    try {
        // Get domain counts and salary data
        const [domainResponse, salaryResponse] = await Promise.all([
            apiClient.getTopDomains(),
            apiClient.getSalaryInsights()
        ]);
        
        if (domainResponse.status !== 'success' || salaryResponse.status !== 'success') {
            throw new Error('Failed to fetch domain or salary data');
        }
        
        const domainCounts = domainResponse.data;
        const salaryData = salaryResponse.data;
        
        if (domainCounts && salaryData && domainCounts.length > 0 && salaryData.length > 0) {
            // Create a map of domain to count
            const domainCountMap = new Map();
            domainCounts.forEach(item => {
                domainCountMap.set(item.domain, item.count);
            });
            
            // Create combined data
            const combinedData = [];
            
            salaryData.forEach(item => {
                if (domainCountMap.has(item.domain)) {
                    combinedData.push({
                        domain: item.domain,
                        count: domainCountMap.get(item.domain),
                        salary: item.avg_salary
                    });
                }
            });
            
            // Calculate average values for demand and salary
            const avgDemand = combinedData.reduce((sum, item) => sum + item.count, 0) / combinedData.length;
            const avgSalary = combinedData.reduce((sum, item) => sum + item.salary, 0) / combinedData.length;
            
            // Find domains in each quadrant
            const highOpportunity = combinedData
                .filter(item => item.count > avgDemand && item.salary > avgSalary)
                .sort((a, b) => (b.salary / avgSalary + b.count / avgDemand) - (a.salary / avgSalary + a.count / avgDemand));
                
            const specialty = combinedData
                .filter(item => item.count <= avgDemand && item.salary > avgSalary)
                .sort((a, b) => b.salary - a.salary);
                
            const competitive = combinedData
                .filter(item => item.count > avgDemand && item.salary <= avgSalary)
                .sort((a, b) => b.count - a.count);
                
            const emerging = combinedData
                .filter(item => item.count <= avgDemand && item.salary <= avgSalary)
                .sort((a, b) => (b.count / avgDemand) - (a.count / avgDemand));
            
            // Update the lists
            updateQuadrantList('highOpportunityList', highOpportunity);
            updateQuadrantList('specialtyList', specialty);
            updateQuadrantList('competitiveList', competitive);
            updateQuadrantList('emergingList', emerging);
        }
    } catch (error) {
        console.error('Error initializing market quadrants:', error);
    }
}

// Update quadrant list
function updateQuadrantList(listId, domains) {
    const list = document.getElementById(listId);
    if (!list) return;
    
    // Clear list
    list.innerHTML = '';
    
    // Add list items
    if (domains.length === 0) {
        list.innerHTML = '<li class="list-group-item bg-transparent text-light">No domains in this quadrant</li>';
        return;
    }
    
    domains.slice(0, 3).forEach(domain => {
        const li = document.createElement('li');
        li.className = 'list-group-item bg-transparent text-light';
        li.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div><strong>${domain.domain}</strong></div>
                <div>${Utils.formatCurrency(domain.salary)}</div>
            </div>
            <div class="small text-light-muted">${domain.count} listings</div>
        `;
        list.appendChild(li);
    });
}

// Initialize filter functionality
function initFilterFunctionality() {
    // Get filter elements
    const domainFilter = document.getElementById('domainFilter');
    const locationFilter = document.getElementById('locationFilter');
    const minSalaryFilter = document.getElementById('minSalaryFilter');
    const minSalaryValue = document.getElementById('minSalaryValue');
    const applyFiltersBtn = document.getElementById('applyFilters');
    
    // Load filter options
    loadFilterOptions(domainFilter, locationFilter);
    
    // Update min salary value display
    minSalaryFilter.addEventListener('input', () => {
        minSalaryValue.textContent = Utils.formatCurrency(minSalaryFilter.value);
    });
    
    // Apply filters button click
    applyFiltersBtn.addEventListener('click', async () => {
        const domain = domainFilter.value;
        const location = locationFilter.value;
        const minSalary = parseInt(minSalaryFilter.value);
        
        await applyFilters(domain, location, minSalary);
    });
    
    // Floating filter button
    const filterButton = document.getElementById('filterButton');
    if (filterButton) {
        filterButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Load filter options
async function loadFilterOptions(domainFilter, locationFilter) {
    try {
        // Fetch domains and locations
        const [domainsResponse, locationsResponse] = await Promise.all([
            apiClient.getDomains(),
            apiClient.getLocations()
        ]);
        
        if (domainsResponse.status === 'success' && domainFilter) {
            const domains = domainsResponse.data || [];
            // Clear existing options except for 'All'
            while (domainFilter.options.length > 1) {
                domainFilter.remove(1);
            }
            
            // Add domain options
            domains.forEach(domain => {
                const option = document.createElement('option');
                option.value = domain;
                option.textContent = domain;
                domainFilter.appendChild(option);
            });
        }
        
        if (locationsResponse.status === 'success' && locationFilter) {
            const locations = locationsResponse.data || [];
            // Clear existing options except for 'All'
            while (locationFilter.options.length > 1) {
                locationFilter.remove(1);
            }
            
            // Add location options
            locations.forEach(location => {
                const option = document.createElement('option');
                option.value = location;
                option.textContent = location;
                locationFilter.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading filter options:', error);
    }
}

// Apply filters
async function applyFilters(domain, location, minSalary) {
    try {
        const filters = {};
        
        if (domain && domain !== 'All') {
            filters.domain = domain;
        }
        
        if (location && location !== 'All') {
            filters.location = location;
        }
        
        if (minSalary > 0) {
            filters.min_salary = minSalary;
        }
        
        // Fetch filtered data using apiClient
        const response = await apiClient.getFilteredData(filters);
        
        if (response.status === 'success') {
            // Update results section
            updateFilteredResults(response.data);
            
            // Show the filtered results section
            const resultsSection = document.getElementById('filteredResultsSection');
            if (resultsSection) {
                resultsSection.style.display = 'block';
                
                // Scroll to results
                resultsSection.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            throw new Error('Failed to fetch filtered data');
        }
    } catch (error) {
        console.error('Error applying filters:', error);
        Utils.createToast('Failed to apply filters', 'danger');
    }
}

// Update filtered results
function updateFilteredResults(data) {
    const resultCount = document.getElementById('resultCount');
    const resultsTable = document.getElementById('filteredResultsTable');
    
    if (resultCount) {
        resultCount.textContent = `${data.length} results`;
    }
    
    if (resultsTable) {
        // Clear table
        resultsTable.innerHTML = '';
        
        if (data.length === 0) {
            resultsTable.innerHTML = '<tr><td colspan="4" class="text-center">No results match your filter criteria</td></tr>';
            return;
        }
        
        // Add rows
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.Company}</td>
                <td>${item['Job Title']}</td>
                <td>${item.Location}</td>
                <td>${Utils.formatCurrency(item.avg_salary)}</td>
            `;
            resultsTable.appendChild(row);
        });
    }
}