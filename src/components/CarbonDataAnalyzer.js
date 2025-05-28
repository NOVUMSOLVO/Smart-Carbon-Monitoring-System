/**
 * Carbon Data Analyzer
 * Analyzes carbon emissions data to provide insights and recommendations
 */

class CarbonDataAnalyzer {
  constructor(data = []) {
    this.data = data;
  }

  /**
   * Set or update the data
   * @param {Array} data - Carbon emission data to analyze
   */
  setData(data) {
    this.data = data || [];
  }

  /**
   * Get basic statistics for the dataset
   * @returns {Object} Statistical summary
   */
  getStatistics() {
    if (!this.data || this.data.length === 0) {
      return {
        count: 0,
        emissionsTotal: 0,
        emissionsAvg: 0,
        emissionsMin: 0,
        emissionsMax: 0,
        energyTotal: 0,
        energyAvg: 0,
        energyMin: 0,
        energyMax: 0,
        dateRange: { start: null, end: null }
      };
    }

    // Extract emissions and energy values
    const emissions = this.data.map(item => item.carbonEmissions);
    const energy = this.data.map(item => item.energyConsumption);
    
    // Calculate date range
    const timestamps = this.data.map(item => new Date(item.timestamp).getTime());
    const startDate = new Date(Math.min(...timestamps));
    const endDate = new Date(Math.max(...timestamps));
    
    return {
      count: this.data.length,
      emissionsTotal: emissions.reduce((sum, val) => sum + val, 0).toFixed(2),
      emissionsAvg: (emissions.reduce((sum, val) => sum + val, 0) / emissions.length).toFixed(2),
      emissionsMin: Math.min(...emissions).toFixed(2),
      emissionsMax: Math.max(...emissions).toFixed(2),
      energyTotal: energy.reduce((sum, val) => sum + val, 0).toFixed(2),
      energyAvg: (energy.reduce((sum, val) => sum + val, 0) / energy.length).toFixed(2),
      energyMin: Math.min(...energy).toFixed(2),
      energyMax: Math.max(...energy).toFixed(2),
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    };
  }

  /**
   * Detect anomalies in the dataset
   * @param {Number} threshold - Z-score threshold for anomaly detection (default: 2)
   * @returns {Array} Anomalies detected
   */
  detectAnomalies(threshold = 2) {
    if (!this.data || this.data.length < 5) {
      return [];
    }
    
    const anomalies = [];
    
    // Calculate mean and standard deviation for emissions
    const emissions = this.data.map(item => item.carbonEmissions);
    const emissionsMean = emissions.reduce((sum, val) => sum + val, 0) / emissions.length;
    const emissionsStdDev = Math.sqrt(
      emissions.reduce((sum, val) => sum + Math.pow(val - emissionsMean, 2), 0) / emissions.length
    );
    
    // Calculate mean and standard deviation for energy
    const energy = this.data.map(item => item.energyConsumption);
    const energyMean = energy.reduce((sum, val) => sum + val, 0) / energy.length;
    const energyStdDev = Math.sqrt(
      energy.reduce((sum, val) => sum + Math.pow(val - energyMean, 2), 0) / energy.length
    );
    
    // Check each data point for anomalies
    this.data.forEach(item => {
      const emissionsZScore = (item.carbonEmissions - emissionsMean) / emissionsStdDev;
      const energyZScore = (item.energyConsumption - energyMean) / energyStdDev;
      
      if (Math.abs(emissionsZScore) > threshold || Math.abs(energyZScore) > threshold) {
        anomalies.push({
          id: item.id,
          timestamp: item.timestamp,
          buildingId: item.buildingId,
          deviceId: item.deviceId,
          carbonEmissions: item.carbonEmissions,
          energyConsumption: item.energyConsumption,
          emissionsZScore: emissionsZScore.toFixed(2),
          energyZScore: energyZScore.toFixed(2),
          reason: Math.abs(emissionsZScore) > Math.abs(energyZScore) 
            ? `Unusual carbon emissions (${item.carbonEmissions} kg, z-score: ${emissionsZScore.toFixed(2)})` 
            : `Unusual energy consumption (${item.energyConsumption} kWh, z-score: ${energyZScore.toFixed(2)})`
        });
      }
    });
    
    return anomalies;
  }

  /**
   * Calculate carbon intensity
   * @returns {Object} Carbon intensity by building and device
   */
  calculateCarbonIntensity() {
    if (!this.data || this.data.length === 0) {
      return { buildings: [], average: 0 };
    }
    
    // Group by building and device
    const buildings = {};
    
    this.data.forEach(item => {
      if (!buildings[item.buildingId]) {
        buildings[item.buildingId] = {
          id: item.buildingId,
          name: item.metadata?.buildingName || item.buildingId,
          totalEmissions: 0,
          totalEnergy: 0,
          intensity: 0,
          devices: {}
        };
      }
      
      const building = buildings[item.buildingId];
      building.totalEmissions += item.carbonEmissions;
      building.totalEnergy += item.energyConsumption;
      
      if (!building.devices[item.deviceId]) {
        building.devices[item.deviceId] = {
          id: item.deviceId,
          type: item.metadata?.deviceType || 'unknown',
          totalEmissions: 0,
          totalEnergy: 0,
          intensity: 0
        };
      }
      
      const device = building.devices[item.deviceId];
      device.totalEmissions += item.carbonEmissions;
      device.totalEnergy += item.energyConsumption;
    });
    
    // Calculate intensity (emissions per unit of energy)
    let totalEmissions = 0;
    let totalEnergy = 0;
    
    Object.values(buildings).forEach(building => {
      building.intensity = building.totalEnergy > 0 
        ? building.totalEmissions / building.totalEnergy 
        : 0;
      
      Object.values(building.devices).forEach(device => {
        device.intensity = device.totalEnergy > 0 
          ? device.totalEmissions / device.totalEnergy 
          : 0;
      });
      
      // Convert devices object to sorted array
      building.devices = Object.values(building.devices)
        .map(device => ({
          ...device,
          totalEmissions: parseFloat(device.totalEmissions.toFixed(2)),
          totalEnergy: parseFloat(device.totalEnergy.toFixed(2)),
          intensity: parseFloat(device.intensity.toFixed(4))
        }))
        .sort((a, b) => b.intensity - a.intensity);
      
      totalEmissions += building.totalEmissions;
      totalEnergy += building.totalEnergy;
    });
    
    const averageIntensity = totalEnergy > 0 ? totalEmissions / totalEnergy : 0;
    
    // Convert to array and sort by intensity
    const buildingsArray = Object.values(buildings)
      .map(building => ({
        ...building,
        totalEmissions: parseFloat(building.totalEmissions.toFixed(2)),
        totalEnergy: parseFloat(building.totalEnergy.toFixed(2)),
        intensity: parseFloat(building.intensity.toFixed(4))
      }))
      .sort((a, b) => b.intensity - a.intensity);
    
    return {
      buildings: buildingsArray,
      average: parseFloat(averageIntensity.toFixed(4))
    };
  }

  /**
   * Identify trends in the data
   * @param {String} interval - Interval for grouping ('hour', 'day', 'week')
   * @returns {Object} Trend data
   */
  identifyTrends(interval = 'day') {
    if (!this.data || this.data.length === 0) {
      return { trends: [], hasSignificantTrend: false };
    }
    
    // Sort data by timestamp
    const sortedData = [...this.data].sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
    
    // Group data by interval
    const groupedData = {};
    
    sortedData.forEach(item => {
      const date = new Date(item.timestamp);
      let key;
      
      if (interval === 'hour') {
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:00`;
      } else if (interval === 'day') {
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      } else if (interval === 'week') {
        // Get the first day of the week (Sunday)
        const firstDayOfWeek = new Date(date);
        const day = date.getDay();
        firstDayOfWeek.setDate(date.getDate() - day);
        key = `Week of ${firstDayOfWeek.getFullYear()}-${(firstDayOfWeek.getMonth() + 1).toString().padStart(2, '0')}-${firstDayOfWeek.getDate().toString().padStart(2, '0')}`;
      }
      
      if (!groupedData[key]) {
        groupedData[key] = {
          interval: key,
          totalEmissions: 0,
          totalEnergy: 0,
          count: 0
        };
      }
      
      groupedData[key].totalEmissions += item.carbonEmissions;
      groupedData[key].totalEnergy += item.energyConsumption;
      groupedData[key].count++;
    });
    
    // Convert to array and calculate averages
    const trends = Object.values(groupedData).map(group => ({
      interval: group.interval,
      totalEmissions: parseFloat(group.totalEmissions.toFixed(2)),
      totalEnergy: parseFloat(group.totalEnergy.toFixed(2)),
      averageEmissions: parseFloat((group.totalEmissions / group.count).toFixed(2)),
      averageEnergy: parseFloat((group.totalEnergy / group.count).toFixed(2)),
      count: group.count
    }));
    
    // Calculate trend (simple linear regression for emissions)
    const n = trends.length;
    const xValues = Array.from({ length: n }, (_, i) => i); // 0, 1, 2, ...
    const yValues = trends.map(trend => trend.averageEmissions);
    
    // Calculate mean of x and y
    const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
    const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;
    
    // Calculate slope (m) and y-intercept (b)
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
      denominator += Math.pow(xValues[i] - xMean, 2);
    }
    
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const yIntercept = yMean - slope * xMean;
    
    // Calculate predicted values
    const predicted = xValues.map(x => slope * x + yIntercept);
    
    // Calculate R-squared
    let ssResidual = 0;
    let ssTotal = 0;
    
    for (let i = 0; i < n; i++) {
      ssResidual += Math.pow(yValues[i] - predicted[i], 2);
      ssTotal += Math.pow(yValues[i] - yMean, 2);
    }
    
    const rSquared = ssTotal !== 0 ? 1 - (ssResidual / ssTotal) : 0;
    
    // Add trend data to each interval
    trends.forEach((trend, i) => {
      trend.predicted = parseFloat(predicted[i].toFixed(2));
      trend.deviation = parseFloat((trend.averageEmissions - predicted[i]).toFixed(2));
    });
    
    // Determine if trend is significant
    const hasSignificantTrend = Math.abs(slope) > 0.1 && rSquared > 0.3;
    const trendDirection = slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable';
    const trendStrength = rSquared > 0.7 ? 'strong' : rSquared > 0.3 ? 'moderate' : 'weak';
    
    return {
      trends,
      analysis: {
        slope: parseFloat(slope.toFixed(4)),
        yIntercept: parseFloat(yIntercept.toFixed(4)),
        rSquared: parseFloat(rSquared.toFixed(4)),
        direction: trendDirection,
        strength: trendStrength,
        interpretation: `Carbon emissions show a ${trendStrength} ${trendDirection} trend over the ${interval}s analyzed.`
      },
      hasSignificantTrend
    };
  }

  /**
   * Generate recommendations based on data analysis
   * @returns {Array} Recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Skip if insufficient data
    if (!this.data || this.data.length < 10) {
      recommendations.push({
        type: 'general',
        priority: 'medium',
        text: 'Collect more data to enable comprehensive analysis and more specific recommendations.'
      });
      return recommendations;
    }
    
    // Get carbon intensity
    const intensityData = this.calculateCarbonIntensity();
    
    // Get trend analysis
    const trends = this.identifyTrends('day');
    
    // Analyze anomalies
    const anomalies = this.detectAnomalies();
    
    // High carbon intensity recommendations
    if (intensityData.buildings.length > 0) {
      const highestIntensity = intensityData.buildings[0];
      
      if (highestIntensity.intensity > intensityData.average * 1.5) {
        recommendations.push({
          type: 'efficiency',
          priority: 'high',
          target: highestIntensity.name,
          text: `${highestIntensity.name} has a carbon intensity ${(highestIntensity.intensity / intensityData.average).toFixed(1)}x higher than average. Consider energy efficiency improvements.`
        });
        
        // Device-specific recommendations
        if (highestIntensity.devices.length > 0) {
          const worstDevice = highestIntensity.devices[0];
          
          if (worstDevice.intensity > highestIntensity.intensity * 1.3) {
            recommendations.push({
              type: 'device',
              priority: 'high',
              target: `${worstDevice.type} in ${highestIntensity.name}`,
              text: `The ${worstDevice.type} in ${highestIntensity.name} has particularly high carbon intensity. Consider upgrading or optimizing this system.`
            });
          }
        }
      }
    }
    
    // Trend-based recommendations
    if (trends.hasSignificantTrend) {
      if (trends.analysis.slope > 0) {
        recommendations.push({
          type: 'trend',
          priority: 'high',
          text: `Carbon emissions are ${trends.analysis.strength} increasing over time. Review recent operational changes and consider implementing additional reduction measures.`
        });
      } else {
        recommendations.push({
          type: 'trend',
          priority: 'low',
          text: `Carbon emissions are ${trends.analysis.strength} decreasing over time. Current reduction measures appear to be effective.`
        });
      }
    }
    
    // Anomaly-based recommendations
    if (anomalies.length > 0) {
      // Group anomalies by building
      const buildingAnomalies = {};
      
      anomalies.forEach(anomaly => {
        if (!buildingAnomalies[anomaly.buildingId]) {
          buildingAnomalies[anomaly.buildingId] = [];
        }
        
        buildingAnomalies[anomaly.buildingId].push(anomaly);
      });
      
      // Generate recommendations for buildings with multiple anomalies
      Object.entries(buildingAnomalies).forEach(([buildingId, buildingAnomaliesList]) => {
        if (buildingAnomaliesList.length > 2) {
          const buildingName = buildingAnomaliesList[0].metadata?.buildingName || buildingId;
          
          recommendations.push({
            type: 'anomaly',
            priority: 'medium',
            target: buildingName,
            text: `${buildingName} shows ${buildingAnomaliesList.length} unusual readings. Consider investigating for potential equipment malfunctions or operational issues.`
          });
        }
      });
    }
    
    // General recommendations
    if (recommendations.length < 2) {
      recommendations.push({
        type: 'general',
        priority: 'medium',
        text: 'Consider implementing a regular energy audit program to identify further efficiency opportunities.'
      });
      
      recommendations.push({
        type: 'general',
        priority: 'medium',
        text: 'Develop a carbon reduction roadmap with specific targets and timelines for each building.'
      });
    }
    
    return recommendations;
  }

  /**
   * Forecast future emissions based on historical data
   * @param {Number} periods - Number of periods to forecast
   * @param {String} interval - Forecast interval ('day', 'week', 'month')
   * @returns {Object} Forecast data
   */
  forecast(periods = 7, interval = 'day') {
    if (!this.data || this.data.length < 10) {
      return {
        forecast: [],
        confidence: 'low',
        message: 'Insufficient historical data for accurate forecasting'
      };
    }
    
    // Group data by interval
    const trends = this.identifyTrends(interval);
    
    // Use simple exponential smoothing for forecasting
    const alpha = 0.3; // Smoothing factor
    const historicalValues = trends.trends.map(trend => trend.averageEmissions);
    const lastValue = historicalValues[historicalValues.length - 1];
    
    // Calculate forecast
    let currentForecast = lastValue;
    const forecast = [];
    
    for (let i = 0; i < periods; i++) {
      // Generate date for the forecast period
      const lastDate = new Date(trends.trends[trends.trends.length - 1].interval);
      let forecastDate;
      
      if (interval === 'day') {
        forecastDate = new Date(lastDate);
        forecastDate.setDate(lastDate.getDate() + i + 1);
        forecastDate = `${forecastDate.getFullYear()}-${(forecastDate.getMonth() + 1).toString().padStart(2, '0')}-${forecastDate.getDate().toString().padStart(2, '0')}`;
      } else if (interval === 'week') {
        forecastDate = new Date(lastDate);
        forecastDate.setDate(lastDate.getDate() + (i + 1) * 7);
        forecastDate = `Week of ${forecastDate.getFullYear()}-${(forecastDate.getMonth() + 1).toString().padStart(2, '0')}-${forecastDate.getDate().toString().padStart(2, '0')}`;
      } else {
        forecastDate = `Future ${interval} ${i + 1}`;
      }
      
      // Calculate forecast value with trend adjustment
      currentForecast = currentForecast + trends.analysis.slope;
      
      // Ensure forecast doesn't go below zero
      currentForecast = Math.max(0, currentForecast);
      
      forecast.push({
        interval: forecastDate,
        forecast: parseFloat(currentForecast.toFixed(2))
      });
    }
    
    // Determine confidence based on R-squared and data length
    let confidence = 'low';
    if (trends.analysis.rSquared > 0.7 && this.data.length > 30) {
      confidence = 'high';
    } else if (trends.analysis.rSquared > 0.4 && this.data.length > 20) {
      confidence = 'medium';
    }
    
    return {
      historical: trends.trends,
      forecast,
      confidence,
      slope: trends.analysis.slope,
      message: `This forecast has ${confidence} confidence based on ${this.data.length} data points and an R² of ${trends.analysis.rSquared.toFixed(2)}.`
    };
  }
}

// Export the analyzer
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CarbonDataAnalyzer;
}
