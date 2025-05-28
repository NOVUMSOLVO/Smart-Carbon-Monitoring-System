// Main JavaScript file for the Smart Carbon Monitoring Platform

// Constants and configuration
const API_URL = '/api/carbon';
const REFRESH_INTERVAL = 60000; // Refresh data every 60 seconds
let emissionsChart, buildingsChart;
let currentData = [];

// DOM elements
const todayTotalElement = document.getElementById('today-total');
const currentRateElement = document.getElementById('current-rate');
const vsYesterdayElement = document.getElementById('vs-yesterday');
const readingsTableBody = document.getElementById('readings-table-body');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeCharts();
  loadData();
  
  // Set up refresh intervals
  setInterval(loadData, REFRESH_INTERVAL);
  
  // Set up event listeners for period buttons
  document.querySelectorAll('[data-period]').forEach(button => {
    button.addEventListener('click', function() {
      const period = this.getAttribute('data-period');
      changeChartPeriod(period);
      
      // Update active button
      document.querySelectorAll('[data-period]').forEach(btn => {
        btn.classList.remove('active');
      });
      this.classList.add('active');
    });
  });
});

// Initialize charts
function initializeCharts() {
  // Emissions trend chart
  const emissionsChartCtx = document.getElementById('emissions-chart').getContext('2d');
  emissionsChart = new Chart(emissionsChartCtx, {
    type: 'line',
    data: {
      labels: generateTimeLabels(24),
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
  
  // Buildings distribution chart
  const buildingsChartCtx = document.getElementById('buildings-chart').getContext('2d');
  buildingsChart = new Chart(buildingsChartCtx, {
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

// Generate time labels for charts (e.g., last 24 hours)
function generateTimeLabels(count) {
  const labels = [];
  const now = new Date();
  
  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    labels.push(time.getHours() + ':00');
  }
  
  return labels;
}

// Generate date labels for charts (e.g., last 7 days)
function generateDateLabels(count) {
  const labels = [];
  const now = new Date();
  
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 86400000);
    labels.push(date.getDate() + '/' + (date.getMonth() + 1));
  }
  
  return labels;
}

// Load data from the API
async function loadData() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    currentData = data;
    
    updateDashboard(data);
    updateCharts(data);
    updateTable(data);
    
    console.log('Data refreshed successfully');
  } catch (error) {
    console.error('Error loading data:', error);
    
    // If no real data is available, use simulated data for demonstration
    if (currentData.length === 0) {
      const simulatedData = generateSimulatedData();
      currentData = simulatedData;
      
      updateDashboard(simulatedData);
      updateCharts(simulatedData);
      updateTable(simulatedData);
      
      console.log('Using simulated data for demonstration');
    }
  }
}

// Update dashboard metrics
function updateDashboard(data) {
  // Filter data for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayData = data.filter(item => {
    const itemDate = new Date(item.timestamp);
    return itemDate >= today;
  });
  
  // Calculate today's total emissions
  const todayTotal = todayData.reduce((sum, item) => sum + item.carbonEmissions, 0);
  todayTotalElement.textContent = `${todayTotal.toFixed(1)} kg`;
  
  // Calculate current emission rate (average of last hour)
  const lastHour = new Date(Date.now() - 3600000);
  const lastHourData = data.filter(item => {
    const itemDate = new Date(item.timestamp);
    return itemDate >= lastHour;
  });
  
  const currentRate = lastHourData.length > 0 
    ? lastHourData.reduce((sum, item) => sum + item.carbonEmissions, 0) 
    : 0;
  
  currentRateElement.textContent = `${currentRate.toFixed(1)} kg/hr`;
  
  // Calculate comparison with yesterday (simulated)
  const yesterdayDiff = Math.random() > 0.5 ? -1 : 1;
  const yesterdayPercent = (Math.random() * 15).toFixed(1);
  const diffClass = yesterdayDiff < 0 ? 'text-success' : 'text-danger';
  const diffSymbol = yesterdayDiff < 0 ? '-' : '+';
  
  vsYesterdayElement.innerHTML = `<span class="${diffClass}">${diffSymbol}${yesterdayPercent}%</span>`;
}

// Update the charts with new data
function updateCharts(data) {
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
  
  emissionsChart.data.datasets[0].data = emissionsData;
  emissionsChart.update();
  
  // Update buildings distribution chart
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
  
  buildingsChart.data.labels = buildingLabels;
  buildingsChart.data.datasets[0].data = buildingValues;
  buildingsChart.update();
}

// Change the time period for the charts
function changeChartPeriod(period) {
  let labels, data;
  
  switch (period) {
    case 'day':
      labels = generateTimeLabels(24);
      data = Array(24).fill(null).map(() => Math.random() * 50);
      break;
    case 'week':
      labels = generateDateLabels(7);
      data = Array(7).fill(null).map(() => Math.random() * 300);
      break;
    case 'month':
      labels = generateDateLabels(30);
      data = Array(30).fill(null).map(() => Math.random() * 800);
      break;
  }
  
  emissionsChart.data.labels = labels;
  emissionsChart.data.datasets[0].data = data;
  emissionsChart.update();
}

// Update the readings table
function updateTable(data) {
  // Sort data by timestamp, most recent first
  const sortedData = [...data].sort((a, b) => {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
  
  // Take only the 10 most recent readings
  const recentData = sortedData.slice(0, 10);
  
  // Clear existing rows
  readingsTableBody.innerHTML = '';
  
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
    
    readingsTableBody.appendChild(row);
  });
}

// Generate simulated data for demonstration purposes
function generateSimulatedData() {
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
