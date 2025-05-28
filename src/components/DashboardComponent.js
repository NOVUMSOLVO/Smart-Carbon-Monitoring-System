/**
 * Dashboard Component for Smart Carbon Monitoring System
 * Provides a reusable component for displaying carbon metrics
 */

class DashboardComponent {
  constructor(elementId, options = {}) {
    this.container = document.getElementById(elementId);
    if (!this.container) {
      throw new Error(`Element with ID ${elementId} not found`);
    }
    
    this.options = {
      title: options.title || 'Carbon Emissions Dashboard',
      refreshInterval: options.refreshInterval || 60000, // 1 minute
      apiUrl: options.apiUrl || '/api/carbon',
      theme: options.theme || 'light',
      showHeader: options.showHeader !== undefined ? options.showHeader : true,
      showFooter: options.showFooter !== undefined ? options.showFooter : true,
      components: options.components || ['summary', 'chart', 'buildings', 'table']
    };
    
    this.data = [];
    this.charts = {};
    
    this.initialize();
  }
  
  /**
   * Initialize the dashboard
   */
  initialize() {
    this.render();
    this.loadData();
    
    // Set up auto refresh
    if (this.options.refreshInterval > 0) {
      this.refreshTimer = setInterval(() => {
        this.loadData();
      }, this.options.refreshInterval);
    }
  }
  
  /**
   * Render the dashboard structure
   */
  render() {
    this.container.innerHTML = '';
    this.container.classList.add('carbon-dashboard');
    
    if (this.options.theme === 'dark') {
      this.container.classList.add('theme-dark');
    }
    
    // Create header
    if (this.options.showHeader) {
      const header = document.createElement('div');
      header.className = 'dashboard-header';
      
      const title = document.createElement('h2');
      title.textContent = this.options.title;
      
      const refresh = document.createElement('button');
      refresh.className = 'refresh-btn';
      refresh.textContent = 'Refresh';
      refresh.addEventListener('click', () => this.loadData());
      
      header.appendChild(title);
      header.appendChild(refresh);
      this.container.appendChild(header);
    }
    
    // Create content container
    const content = document.createElement('div');
    content.className = 'dashboard-content';
    this.container.appendChild(content);
    
    // Render selected components
    this.options.components.forEach(component => {
      switch (component) {
        case 'summary':
          this.renderSummary(content);
          break;
        case 'chart':
          this.renderChart(content);
          break;
        case 'buildings':
          this.renderBuildingsPanel(content);
          break;
        case 'table':
          this.renderDataTable(content);
          break;
      }
    });
    
    // Create footer
    if (this.options.showFooter) {
      const footer = document.createElement('div');
      footer.className = 'dashboard-footer';
      
      const lastUpdate = document.createElement('div');
      lastUpdate.className = 'last-update';
      lastUpdate.textContent = 'Last update: Never';
      this.lastUpdateElement = lastUpdate;
      
      footer.appendChild(lastUpdate);
      this.container.appendChild(footer);
    }
  }
  
  /**
   * Render summary metrics panel
   */
  renderSummary(container) {
    const panel = document.createElement('div');
    panel.className = 'dashboard-panel summary-panel';
    
    const panelTitle = document.createElement('h3');
    panelTitle.textContent = 'Carbon Metrics';
    panel.appendChild(panelTitle);
    
    const metricsContainer = document.createElement('div');
    metricsContainer.className = 'metrics-container';
    
    // Create metrics
    const metrics = [
      { id: 'total-today', label: 'Today\'s Total', value: '0 kg', icon: '📊' },
      { id: 'current-rate', label: 'Current Rate', value: '0 kg/hr', icon: '⚡' },
      { id: 'vs-yesterday', label: 'vs Yesterday', value: '0%', icon: '📈' }
    ];
    
    metrics.forEach(metric => {
      const metricEl = document.createElement('div');
      metricEl.className = 'metric-item';
      metricEl.id = `metric-${metric.id}`;
      
      const icon = document.createElement('div');
      icon.className = 'metric-icon';
      icon.textContent = metric.icon;
      
      const content = document.createElement('div');
      content.className = 'metric-content';
      
      const label = document.createElement('div');
      label.className = 'metric-label';
      label.textContent = metric.label;
      
      const value = document.createElement('div');
      value.className = 'metric-value';
      value.textContent = metric.value;
      
      content.appendChild(label);
      content.appendChild(value);
      
      metricEl.appendChild(icon);
      metricEl.appendChild(content);
      metricsContainer.appendChild(metricEl);
      
      // Store reference for updates
      this[`${metric.id.replace('-', '')}Element`] = value;
    });
    
    panel.appendChild(metricsContainer);
    container.appendChild(panel);
  }
  
  /**
   * Render main chart panel
   */
  renderChart(container) {
    const panel = document.createElement('div');
    panel.className = 'dashboard-panel chart-panel';
    
    const panelHeader = document.createElement('div');
    panelHeader.className = 'panel-header';
    
    const panelTitle = document.createElement('h3');
    panelTitle.textContent = 'Emissions Trend';
    
    const periodSelector = document.createElement('div');
    periodSelector.className = 'period-selector';
    
    ['Day', 'Week', 'Month'].forEach(period => {
      const btn = document.createElement('button');
      btn.className = 'period-btn';
      if (period === 'Day') btn.classList.add('active');
      btn.textContent = period;
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.period-btn').forEach(el => el.classList.remove('active'));
        e.target.classList.add('active');
        this.updateChartPeriod(period.toLowerCase());
      });
      
      periodSelector.appendChild(btn);
    });
    
    panelHeader.appendChild(panelTitle);
    panelHeader.appendChild(periodSelector);
    panel.appendChild(panelHeader);
    
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    
    const canvas = document.createElement('canvas');
    canvas.id = 'emissions-trend-chart';
    chartContainer.appendChild(canvas);
    
    panel.appendChild(chartContainer);
    container.appendChild(panel);
    
    // Initialize chart (will happen after DOM is ready)
    setTimeout(() => {
      this.initializeCharts();
    }, 0);
  }
  
  /**
   * Render buildings panel
   */
  renderBuildingsPanel(container) {
    const panel = document.createElement('div');
    panel.className = 'dashboard-panel buildings-panel';
    
    const panelTitle = document.createElement('h3');
    panelTitle.textContent = 'Buildings Distribution';
    panel.appendChild(panelTitle);
    
    const chartContainer = document.createElement('div');
    chartContainer.className = 'buildings-chart-container';
    
    const canvas = document.createElement('canvas');
    canvas.id = 'buildings-chart';
    chartContainer.appendChild(canvas);
    
    panel.appendChild(chartContainer);
    container.appendChild(panel);
  }
  
  /**
   * Render data table panel
   */
  renderDataTable(container) {
    const panel = document.createElement('div');
    panel.className = 'dashboard-panel table-panel';
    
    const panelTitle = document.createElement('h3');
    panelTitle.textContent = 'Recent Readings';
    panel.appendChild(panelTitle);
    
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-responsive';
    
    const table = document.createElement('table');
    table.className = 'data-table';
    
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    ['Time', 'Building', 'Device', 'Energy (kWh)', 'CO2 (kg)'].forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    tbody.id = 'data-table-body';
    table.appendChild(tbody);
    
    tableContainer.appendChild(table);
    panel.appendChild(tableContainer);
    container.appendChild(panel);
    
    this.tableBodyElement = tbody;
  }
  
  /**
   * Initialize charts
   */
  initializeCharts() {
    if (!window.Chart) {
      console.error('Chart.js is not loaded');
      return;
    }
    
    // Emissions trend chart
    const trendChartCtx = document.getElementById('emissions-trend-chart');
    if (trendChartCtx) {
      this.charts.trend = new Chart(trendChartCtx, {
        type: 'line',
        data: {
          labels: this.generateTimeLabels(24),
          datasets: [{
            label: 'Carbon Emissions (kg CO2)',
            data: Array(24).fill(null),
            borderColor: '#1e88e5',
            backgroundColor: 'rgba(30, 136, 229, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'CO2 Emissions (kg)'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Time'
              }
            }
          }
        }
      });
    }
    
    // Buildings distribution chart
    const buildingsChartCtx = document.getElementById('buildings-chart');
    if (buildingsChartCtx) {
      this.charts.buildings = new Chart(buildingsChartCtx, {
        type: 'doughnut',
        data: {
          labels: ['City Hall', 'Community Center', 'Public Library', 'Police Station', 'Fire Station'],
          datasets: [{
            data: [30, 25, 15, 20, 10],
            backgroundColor: [
              '#1e88e5',
              '#43a047',
              '#ffb300',
              '#e53935',
              '#8e24aa'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    }
  }
  
  /**
   * Load data from API
   */
  async loadData() {
    try {
      const response = await fetch(this.options.apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.data = data;
      
      this.updateDashboard(data);
      this.updateLastUpdateTime();
      
      console.log('Dashboard data refreshed successfully');
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      
      // If no real data is available, use simulated data for demonstration
      if (this.data.length === 0) {
        const simulatedData = this.generateSimulatedData();
        this.data = simulatedData;
        
        this.updateDashboard(simulatedData);
        this.updateLastUpdateTime();
        
        console.log('Using simulated data for dashboard demonstration');
      }
    }
  }
  
  /**
   * Update dashboard with new data
   */
  updateDashboard(data) {
    this.updateSummaryMetrics(data);
    this.updateCharts(data);
    this.updateDataTable(data);
  }
  
  /**
   * Update summary metrics
   */
  updateSummaryMetrics(data) {
    if (!this.totaltodayElement) return;
    
    // Filter data for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayData = data.filter(item => {
      const itemDate = new Date(item.timestamp);
      return itemDate >= today;
    });
    
    // Calculate today's total emissions
    const todayTotal = todayData.reduce((sum, item) => sum + item.carbonEmissions, 0);
    this.totaltodayElement.textContent = `${todayTotal.toFixed(1)} kg`;
    
    // Calculate current emission rate (average of last hour)
    const lastHour = new Date(Date.now() - 3600000);
    const lastHourData = data.filter(item => {
      const itemDate = new Date(item.timestamp);
      return itemDate >= lastHour;
    });
    
    const currentRate = lastHourData.length > 0 
      ? lastHourData.reduce((sum, item) => sum + item.carbonEmissions, 0) 
      : 0;
    
    this.currentrateElement.textContent = `${currentRate.toFixed(1)} kg/hr`;
    
    // Calculate comparison with yesterday (simulated)
    const yesterdayDiff = Math.random() > 0.5 ? -1 : 1;
    const yesterdayPercent = (Math.random() * 15).toFixed(1);
    const diffClass = yesterdayDiff < 0 ? 'text-success' : 'text-danger';
    const diffSymbol = yesterdayDiff < 0 ? '-' : '+';
    
    this.vsyesterdayElement.innerHTML = `<span class="${diffClass}">${diffSymbol}${yesterdayPercent}%</span>`;
  }
  
  /**
   * Update charts with new data
   */
  updateCharts(data) {
    if (!this.charts.trend) return;
    
    // Update emissions trend chart
    const now = new Date();
    const emissions = Array(24).fill(0);
    const counts = Array(24).fill(0);
    
    // Group data by hour for the last 24 hours
    data.forEach(item => {
      const itemDate = new Date(item.timestamp);
      const hoursDiff = Math.floor((now - itemDate) / 3600000);
      
      if (hoursDiff >= 0 && hoursDiff < 24) {
        const index = 23 - hoursDiff;
        emissions[index] += item.carbonEmissions;
        counts[index]++;
      }
    });
    
    // Calculate averages
    const emissionsData = emissions.map((value, index) => 
      counts[index] > 0 ? value / counts[index] : null
    );
    
    this.charts.trend.data.datasets[0].data = emissionsData;
    this.charts.trend.update();
    
    // Update buildings distribution chart
    if (this.charts.buildings) {
      const buildingEmissions = {};
      const buildingNames = {
        'B-101': 'City Hall',
        'B-102': 'Community Center',
        'B-103': 'Public Library',
        'B-104': 'Police Station',
        'B-105': 'Fire Station'
      };
      
      data.forEach(item => {
        if (!buildingEmissions[item.buildingId]) {
          buildingEmissions[item.buildingId] = 0;
        }
        buildingEmissions[item.buildingId] += item.carbonEmissions;
      });
      
      const buildingLabels = Object.keys(buildingEmissions).map(id => buildingNames[id] || id);
      const buildingValues = Object.values(buildingEmissions);
      
      this.charts.buildings.data.labels = buildingLabels;
      this.charts.buildings.data.datasets[0].data = buildingValues;
      this.charts.buildings.update();
    }
  }
  
  /**
   * Update data table with recent readings
   */
  updateDataTable(data) {
    if (!this.tableBodyElement) return;
    
    // Sort data by timestamp, most recent first
    const sortedData = [...data].sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    // Take only the 10 most recent readings
    const recentData = sortedData.slice(0, 10);
    
    // Clear existing rows
    this.tableBodyElement.innerHTML = '';
    
    // Add new rows
    recentData.forEach(item => {
      const row = document.createElement('tr');
      
      const timeCell = document.createElement('td');
      const timestamp = new Date(item.timestamp);
      timeCell.textContent = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const buildingCell = document.createElement('td');
      buildingCell.textContent = item.metadata?.buildingName || item.buildingId;
      
      const deviceCell = document.createElement('td');
      deviceCell.textContent = item.metadata?.deviceType || item.deviceId;
      
      const energyCell = document.createElement('td');
      energyCell.textContent = item.energyConsumption.toFixed(2);
      
      const emissionsCell = document.createElement('td');
      emissionsCell.textContent = item.carbonEmissions.toFixed(2);
      
      row.appendChild(timeCell);
      row.appendChild(buildingCell);
      row.appendChild(deviceCell);
      row.appendChild(energyCell);
      row.appendChild(emissionsCell);
      
      this.tableBodyElement.appendChild(row);
    });
  }
  
  /**
   * Update chart period
   */
  updateChartPeriod(period) {
    if (!this.charts.trend) return;
    
    let labels, data;
    
    switch (period) {
      case 'day':
        labels = this.generateTimeLabels(24);
        data = Array(24).fill(null).map(() => Math.random() * 50);
        break;
      case 'week':
        labels = this.generateDateLabels(7);
        data = Array(7).fill(null).map(() => Math.random() * 300);
        break;
      case 'month':
        labels = this.generateDateLabels(30);
        data = Array(30).fill(null).map(() => Math.random() * 800);
        break;
    }
    
    this.charts.trend.data.labels = labels;
    this.charts.trend.data.datasets[0].data = data;
    this.charts.trend.update();
  }
  
  /**
   * Update last update timestamp
   */
  updateLastUpdateTime() {
    if (this.lastUpdateElement) {
      const now = new Date();
      this.lastUpdateElement.textContent = `Last update: ${now.toLocaleTimeString()}`;
    }
  }
  
  /**
   * Generate time labels for charts (e.g., last 24 hours)
   */
  generateTimeLabels(count) {
    const labels = [];
    const now = new Date();
    
    for (let i = count - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 3600000);
      labels.push(time.getHours() + ':00');
    }
    
    return labels;
  }
  
  /**
   * Generate date labels for charts (e.g., last 7 days)
   */
  generateDateLabels(count) {
    const labels = [];
    const now = new Date();
    
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 86400000);
      labels.push(date.getDate() + '/' + (date.getMonth() + 1));
    }
    
    return labels;
  }
  
  /**
   * Generate simulated data for demonstration
   */
  generateSimulatedData() {
    const simulatedData = [];
    const now = new Date();
    const buildings = [
      { id: 'B-101', name: 'City Hall', type: 'government' },
      { id: 'B-102', name: 'Community Center', type: 'public' },
      { id: 'B-103', name: 'Public Library', type: 'public' },
      { id: 'B-104', name: 'Police Station', type: 'government' },
      { id: 'B-105', name: 'Fire Station', type: 'government' },
    ];
    
    const deviceTypes = ['hvac', 'lighting', 'power', 'water'];
    
    // Generate 200 data points across the past 24 hours
    for (let i = 0; i < 200; i++) {
      const timestampOffset = Math.random() * 24 * 60 * 60 * 1000;
      const timestamp = new Date(now.getTime() - timestampOffset);
      
      const building = buildings[Math.floor(Math.random() * buildings.length)];
      const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
      const deviceId = `D-${Math.floor(Math.random() * 10).toString().padStart(3, '0')}`;
      
      let energyConsumption, carbonEmissions, temperature, humidity;
      
      switch(deviceType) {
        case 'hvac':
          energyConsumption = 10 + Math.random() * 40;
          carbonEmissions = energyConsumption * (0.2 + Math.random() * 0.3);
          temperature = 18 + Math.random() * 6;
          humidity = 40 + Math.random() * 20;
          break;
        case 'lighting':
          energyConsumption = 2 + Math.random() * 13;
          carbonEmissions = energyConsumption * (0.1 + Math.random() * 0.2);
          temperature = 20 + Math.random() * 5;
          humidity = 35 + Math.random() * 20;
          break;
        case 'power':
          energyConsumption = 30 + Math.random() * 70;
          carbonEmissions = energyConsumption * (0.3 + Math.random() * 0.3);
          temperature = 22 + Math.random() * 6;
          humidity = 30 + Math.random() * 20;
          break;
        case 'water':
          energyConsumption = 5 + Math.random() * 15;
          carbonEmissions = energyConsumption * (0.05 + Math.random() * 0.15);
          temperature = 15 + Math.random() * 7;
          humidity = 50 + Math.random() * 30;
          break;
      }
      
      simulatedData.push({
        id: `sim-${i}`,
        timestamp: timestamp.toISOString(),
        buildingId: building.id,
        deviceId: deviceId,
        energyConsumption: parseFloat(energyConsumption.toFixed(2)),
        carbonEmissions: parseFloat(carbonEmissions.toFixed(2)),
        temperature: parseFloat(temperature.toFixed(1)),
        humidity: parseFloat(humidity.toFixed(1)),
        metadata: {
          buildingName: building.name,
          buildingType: building.type,
          deviceType: deviceType
        }
      });
    }
    
    return simulatedData;
  }
  
  /**
   * Destroy the dashboard and clean up
   */
  destroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    // Destroy charts
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    
    this.container.innerHTML = '';
  }
}

// Export the component
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DashboardComponent;
}
