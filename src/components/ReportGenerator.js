/**
 * Report Generator Component
 * Generates carbon emission reports for different time periods
 */

class ReportGenerator {
  constructor(carbonData) {
    this.carbonData = carbonData || [];
  }

  /**
   * Set or update carbon data
   * @param {Array} data - Carbon emission data
   */
  setData(data) {
    this.carbonData = data || [];
  }

  /**
   * Generate daily report
   * @param {Date} date - Date for the report (defaults to today)
   * @returns {Object} Report data
   */
  generateDailyReport(date = new Date()) {
    const reportDate = new Date(date);
    reportDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(reportDate);
    nextDay.setDate(reportDate.getDate() + 1);
    
    // Filter data for the specified day
    const dailyData = this.carbonData.filter(item => {
      const itemDate = new Date(item.timestamp);
      return itemDate >= reportDate && itemDate < nextDay;
    });
    
    // Calculate totals
    const totalEmissions = dailyData.reduce((sum, item) => sum + item.carbonEmissions, 0);
    const totalEnergy = dailyData.reduce((sum, item) => sum + item.energyConsumption, 0);
    
    // Group by building
    const buildingData = this.groupByBuilding(dailyData);
    
    // Group by hour
    const hourlyData = this.groupByHour(dailyData);
    
    // Peak hour analysis
    const peakHour = this.findPeakHour(hourlyData);
    
    return {
      reportType: 'daily',
      date: reportDate.toISOString().split('T')[0],
      summary: {
        totalEmissions: parseFloat(totalEmissions.toFixed(2)),
        totalEnergy: parseFloat(totalEnergy.toFixed(2)),
        readingCount: dailyData.length,
        peakHour: peakHour ? `${peakHour.hour}:00` : 'N/A',
        peakEmissions: peakHour ? parseFloat(peakHour.emissions.toFixed(2)) : 0
      },
      buildings: buildingData,
      hourly: hourlyData,
      recommendations: this.generateRecommendations(dailyData, 'daily')
    };
  }
  
  /**
   * Generate weekly report
   * @param {Date} date - Date within the week for the report (defaults to today)
   * @returns {Object} Report data
   */
  generateWeeklyReport(date = new Date()) {
    const reportDate = new Date(date);
    const dayOfWeek = reportDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Set to beginning of week (Sunday)
    reportDate.setDate(reportDate.getDate() - dayOfWeek);
    reportDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(reportDate);
    endDate.setDate(reportDate.getDate() + 7);
    
    // Filter data for the week
    const weeklyData = this.carbonData.filter(item => {
      const itemDate = new Date(item.timestamp);
      return itemDate >= reportDate && itemDate < endDate;
    });
    
    // Calculate totals
    const totalEmissions = weeklyData.reduce((sum, item) => sum + item.carbonEmissions, 0);
    const totalEnergy = weeklyData.reduce((sum, item) => sum + item.energyConsumption, 0);
    
    // Group by day
    const dailyData = this.groupByDay(weeklyData, reportDate, 7);
    
    // Group by building
    const buildingData = this.groupByBuilding(weeklyData);
    
    // Peak day analysis
    const peakDay = this.findPeakDay(dailyData);
    
    return {
      reportType: 'weekly',
      startDate: reportDate.toISOString().split('T')[0],
      endDate: new Date(endDate.getTime() - 1).toISOString().split('T')[0],
      summary: {
        totalEmissions: parseFloat(totalEmissions.toFixed(2)),
        totalEnergy: parseFloat(totalEnergy.toFixed(2)),
        readingCount: weeklyData.length,
        peakDay: peakDay ? peakDay.dayName : 'N/A',
        peakEmissions: peakDay ? parseFloat(peakDay.emissions.toFixed(2)) : 0
      },
      daily: dailyData,
      buildings: buildingData,
      recommendations: this.generateRecommendations(weeklyData, 'weekly')
    };
  }
  
  /**
   * Generate monthly report
   * @param {Number} year - Year for the report
   * @param {Number} month - Month for the report (1-12)
   * @returns {Object} Report data
   */
  generateMonthlyReport(year = new Date().getFullYear(), month = new Date().getMonth() + 1) {
    const reportDate = new Date(year, month - 1, 1);
    reportDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(year, month, 1);
    
    // Filter data for the month
    const monthlyData = this.carbonData.filter(item => {
      const itemDate = new Date(item.timestamp);
      return itemDate >= reportDate && itemDate < endDate;
    });
    
    // Calculate totals
    const totalEmissions = monthlyData.reduce((sum, item) => sum + item.carbonEmissions, 0);
    const totalEnergy = monthlyData.reduce((sum, item) => sum + item.energyConsumption, 0);
    
    // Get days in month
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Group by day
    const dailyData = this.groupByDay(monthlyData, reportDate, daysInMonth);
    
    // Group by building
    const buildingData = this.groupByBuilding(monthlyData);
    
    // Weekly trend
    const weeklyTrend = this.calculateWeeklyTrend(monthlyData, reportDate);
    
    return {
      reportType: 'monthly',
      year,
      month,
      summary: {
        totalEmissions: parseFloat(totalEmissions.toFixed(2)),
        totalEnergy: parseFloat(totalEnergy.toFixed(2)),
        readingCount: monthlyData.length,
        dailyAverage: parseFloat((totalEmissions / daysInMonth).toFixed(2))
      },
      daily: dailyData,
      buildings: buildingData,
      weeklyTrend,
      recommendations: this.generateRecommendations(monthlyData, 'monthly')
    };
  }
  
  /**
   * Group data by building
   * @param {Array} data - Carbon emission data
   * @returns {Array} Building data
   */
  groupByBuilding(data) {
    const buildings = {};
    
    // Building name mapping
    const buildingNames = {
      'B-101': 'City Hall',
      'B-102': 'Community Center',
      'B-103': 'Public Library',
      'B-104': 'Police Station',
      'B-105': 'Fire Station'
    };
    
    // Group by building
    data.forEach(item => {
      if (!buildings[item.buildingId]) {
        buildings[item.buildingId] = {
          id: item.buildingId,
          name: item.metadata?.buildingName || buildingNames[item.buildingId] || item.buildingId,
          totalEmissions: 0,
          totalEnergy: 0,
          readingCount: 0,
          devices: {}
        };
      }
      
      const building = buildings[item.buildingId];
      building.totalEmissions += item.carbonEmissions;
      building.totalEnergy += item.energyConsumption;
      building.readingCount++;
      
      // Group by device
      if (!building.devices[item.deviceId]) {
        building.devices[item.deviceId] = {
          id: item.deviceId,
          type: item.metadata?.deviceType || 'unknown',
          totalEmissions: 0,
          totalEnergy: 0,
          readingCount: 0
        };
      }
      
      const device = building.devices[item.deviceId];
      device.totalEmissions += item.carbonEmissions;
      device.totalEnergy += item.energyConsumption;
      device.readingCount++;
    });
    
    // Convert to array and sort by totalEmissions
    const buildingsArray = Object.values(buildings).map(building => {
      // Convert devices object to sorted array
      building.devices = Object.values(building.devices)
        .map(device => ({
          ...device,
          totalEmissions: parseFloat(device.totalEmissions.toFixed(2)),
          totalEnergy: parseFloat(device.totalEnergy.toFixed(2))
        }))
        .sort((a, b) => b.totalEmissions - a.totalEmissions);
      
      return {
        ...building,
        totalEmissions: parseFloat(building.totalEmissions.toFixed(2)),
        totalEnergy: parseFloat(building.totalEnergy.toFixed(2))
      };
    }).sort((a, b) => b.totalEmissions - a.totalEmissions);
    
    return buildingsArray;
  }
  
  /**
   * Group data by hour
   * @param {Array} data - Carbon emission data
   * @returns {Array} Hourly data
   */
  groupByHour(data) {
    const hours = {};
    
    // Group by hour
    data.forEach(item => {
      const date = new Date(item.timestamp);
      const hour = date.getHours();
      
      if (!hours[hour]) {
        hours[hour] = {
          hour,
          totalEmissions: 0,
          totalEnergy: 0,
          readingCount: 0
        };
      }
      
      hours[hour].totalEmissions += item.carbonEmissions;
      hours[hour].totalEnergy += item.energyConsumption;
      hours[hour].readingCount++;
    });
    
    // Convert to array and sort by hour
    const hourlyData = Object.values(hours).map(hour => ({
      ...hour,
      totalEmissions: parseFloat(hour.totalEmissions.toFixed(2)),
      totalEnergy: parseFloat(hour.totalEnergy.toFixed(2))
    })).sort((a, b) => a.hour - b.hour);
    
    return hourlyData;
  }
  
  /**
   * Group data by day
   * @param {Array} data - Carbon emission data
   * @param {Date} startDate - Start date
   * @param {Number} days - Number of days
   * @returns {Array} Daily data
   */
  groupByDay(data, startDate, days) {
    const dailyData = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Initialize daily data
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      dailyData.push({
        date: date.toISOString().split('T')[0],
        dayOfWeek: date.getDay(),
        dayName: dayNames[date.getDay()],
        totalEmissions: 0,
        totalEnergy: 0,
        readingCount: 0
      });
    }
    
    // Group by day
    data.forEach(item => {
      const date = new Date(item.timestamp);
      const dayIndex = Math.floor((date - startDate) / (24 * 60 * 60 * 1000));
      
      if (dayIndex >= 0 && dayIndex < days) {
        dailyData[dayIndex].totalEmissions += item.carbonEmissions;
        dailyData[dayIndex].totalEnergy += item.energyConsumption;
        dailyData[dayIndex].readingCount++;
      }
    });
    
    // Format numbers
    return dailyData.map(day => ({
      ...day,
      totalEmissions: parseFloat(day.totalEmissions.toFixed(2)),
      totalEnergy: parseFloat(day.totalEnergy.toFixed(2))
    }));
  }
  
  /**
   * Calculate weekly trend from monthly data
   * @param {Array} data - Carbon emission data
   * @param {Date} startDate - Start date of the month
   * @returns {Array} Weekly trend data
   */
  calculateWeeklyTrend(data, startDate) {
    const weeks = [];
    const startDay = startDate.getDay(); // 0 = Sunday
    const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
    
    // Determine number of weeks
    const numWeeks = Math.ceil((daysInMonth + startDay) / 7);
    
    // Initialize weeks
    for (let i = 0; i < numWeeks; i++) {
      weeks.push({
        week: i + 1,
        startDate: null,
        endDate: null,
        totalEmissions: 0,
        totalEnergy: 0,
        readingCount: 0
      });
    }
    
    // Calculate week start and end dates
    for (let i = 0; i < numWeeks; i++) {
      const weekStart = i * 7 - startDay + 1; // Day of month
      const weekEnd = Math.min(weekStart + 6, daysInMonth);
      
      if (weekStart <= daysInMonth) {
        weeks[i].startDate = new Date(startDate.getFullYear(), startDate.getMonth(), Math.max(1, weekStart)).toISOString().split('T')[0];
        weeks[i].endDate = new Date(startDate.getFullYear(), startDate.getMonth(), weekEnd).toISOString().split('T')[0];
      }
    }
    
    // Group data by week
    data.forEach(item => {
      const date = new Date(item.timestamp);
      const dayOfMonth = date.getDate();
      const weekIndex = Math.floor((dayOfMonth + startDay - 1) / 7);
      
      if (weekIndex >= 0 && weekIndex < weeks.length) {
        weeks[weekIndex].totalEmissions += item.carbonEmissions;
        weeks[weekIndex].totalEnergy += item.energyConsumption;
        weeks[weekIndex].readingCount++;
      }
    });
    
    // Format numbers and filter out weeks without data
    return weeks
      .filter(week => week.startDate !== null)
      .map(week => ({
        ...week,
        totalEmissions: parseFloat(week.totalEmissions.toFixed(2)),
        totalEnergy: parseFloat(week.totalEnergy.toFixed(2))
      }));
  }
  
  /**
   * Find peak hour
   * @param {Array} hourlyData - Hourly data
   * @returns {Object} Peak hour data
   */
  findPeakHour(hourlyData) {
    if (!hourlyData || hourlyData.length === 0) {
      return null;
    }
    
    return hourlyData.reduce((peak, hour) => {
      return hour.totalEmissions > peak.emissions ? { 
        hour: hour.hour, 
        emissions: hour.totalEmissions 
      } : peak;
    }, { hour: hourlyData[0].hour, emissions: hourlyData[0].totalEmissions });
  }
  
  /**
   * Find peak day
   * @param {Array} dailyData - Daily data
   * @returns {Object} Peak day data
   */
  findPeakDay(dailyData) {
    if (!dailyData || dailyData.length === 0) {
      return null;
    }
    
    return dailyData.reduce((peak, day) => {
      return day.totalEmissions > peak.emissions ? { 
        dayName: day.dayName, 
        emissions: day.totalEmissions 
      } : peak;
    }, { dayName: dailyData[0].dayName, emissions: dailyData[0].totalEmissions });
  }
  
  /**
   * Generate recommendations based on data
   * @param {Array} data - Carbon emission data
   * @param {String} reportType - Type of report
   * @returns {Array} Recommendations
   */
  generateRecommendations(data, reportType) {
    const recommendations = [];
    
    // Skip if not enough data
    if (!data || data.length < 5) {
      recommendations.push({
        priority: 'low',
        category: 'general',
        text: 'Insufficient data to generate meaningful recommendations. Continue collecting data to improve insights.'
      });
      return recommendations;
    }
    
    // Group by building
    const buildings = this.groupByBuilding(data);
    
    // Add building-specific recommendations
    buildings.forEach(building => {
      // High-emission buildings
      if (building.totalEmissions > 100) {
        recommendations.push({
          priority: 'high',
          category: 'building',
          building: building.name,
          text: `${building.name} has unusually high emissions (${building.totalEmissions} kg CO2). Consider an energy audit to identify inefficiencies.`
        });
      }
      
      // Check for high-consumption devices
      building.devices.forEach(device => {
        if (device.totalEmissions > building.totalEmissions * 0.4) {
          recommendations.push({
            priority: 'medium',
            category: 'device',
            building: building.name,
            device: device.type,
            text: `${device.type} in ${building.name} accounts for over 40% of the building's emissions. Consider upgrading or optimizing this system.`
          });
        }
      });
    });
    
    // Add time-specific recommendations
    if (reportType === 'daily') {
      const hourlyData = this.groupByHour(data);
      const peakHour = this.findPeakHour(hourlyData);
      
      if (peakHour) {
        recommendations.push({
          priority: 'medium',
          category: 'timing',
          text: `Peak emissions occur at ${peakHour.hour}:00. Consider shifting energy-intensive operations to off-peak hours.`
        });
      }
    } else if (reportType === 'weekly') {
      const dailyData = this.groupByDay(data, new Date(data[0]?.timestamp), 7);
      const peakDay = this.findPeakDay(dailyData);
      
      if (peakDay) {
        recommendations.push({
          priority: 'medium',
          category: 'timing',
          text: `${peakDay.dayName} shows the highest emissions. Review operations on this day to identify reduction opportunities.`
        });
      }
    }
    
    // Add general recommendations if we don't have many specific ones
    if (recommendations.length < 2) {
      recommendations.push({
        priority: 'low',
        category: 'general',
        text: 'Consider implementing a regular energy monitoring program to track consumption patterns and identify inefficiencies.'
      });
      
      recommendations.push({
        priority: 'low',
        category: 'general',
        text: 'Educate staff about energy conservation practices to reduce overall carbon footprint.'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Export report as JSON
   * @param {Object} report - Report data
   * @returns {String} JSON string
   */
  exportReportAsJson(report) {
    return JSON.stringify(report, null, 2);
  }
  
  /**
   * Export report as CSV
   * @param {Object} report - Report data
   * @returns {String} CSV string
   */
  exportReportAsCsv(report) {
    let csv = '';
    
    // Add report metadata
    csv += `Report Type,${report.reportType}\n`;
    
    if (report.reportType === 'daily') {
      csv += `Date,${report.date}\n`;
    } else if (report.reportType === 'weekly') {
      csv += `Start Date,${report.startDate}\n`;
      csv += `End Date,${report.endDate}\n`;
    } else if (report.reportType === 'monthly') {
      csv += `Year,${report.year}\n`;
      csv += `Month,${report.month}\n`;
    }
    
    csv += '\n';
    
    // Add summary
    csv += 'SUMMARY\n';
    csv += `Total Emissions (kg CO2),${report.summary.totalEmissions}\n`;
    csv += `Total Energy (kWh),${report.summary.totalEnergy}\n`;
    csv += `Reading Count,${report.summary.readingCount}\n`;
    
    if (report.reportType === 'daily' && report.summary.peakHour) {
      csv += `Peak Hour,${report.summary.peakHour}\n`;
      csv += `Peak Emissions (kg CO2),${report.summary.peakEmissions}\n`;
    } else if (report.reportType === 'weekly' && report.summary.peakDay) {
      csv += `Peak Day,${report.summary.peakDay}\n`;
      csv += `Peak Emissions (kg CO2),${report.summary.peakEmissions}\n`;
    } else if (report.reportType === 'monthly') {
      csv += `Daily Average (kg CO2),${report.summary.dailyAverage}\n`;
    }
    
    csv += '\n';
    
    // Add buildings data
    csv += 'BUILDINGS\n';
    csv += 'Building,Total Emissions (kg CO2),Total Energy (kWh),Reading Count\n';
    
    report.buildings.forEach(building => {
      csv += `${building.name},${building.totalEmissions},${building.totalEnergy},${building.readingCount}\n`;
    });
    
    csv += '\n';
    
    // Add time-based data
    if (report.reportType === 'daily' && report.hourly) {
      csv += 'HOURLY DATA\n';
      csv += 'Hour,Total Emissions (kg CO2),Total Energy (kWh),Reading Count\n';
      
      report.hourly.forEach(hour => {
        csv += `${hour.hour}:00,${hour.totalEmissions},${hour.totalEnergy},${hour.readingCount}\n`;
      });
    } else if ((report.reportType === 'weekly' || report.reportType === 'monthly') && report.daily) {
      csv += 'DAILY DATA\n';
      csv += 'Date,Day,Total Emissions (kg CO2),Total Energy (kWh),Reading Count\n';
      
      report.daily.forEach(day => {
        csv += `${day.date},${day.dayName},${day.totalEmissions},${day.totalEnergy},${day.readingCount}\n`;
      });
    }
    
    csv += '\n';
    
    // Add recommendations
    csv += 'RECOMMENDATIONS\n';
    csv += 'Priority,Category,Recommendation\n';
    
    report.recommendations.forEach(rec => {
      csv += `${rec.priority},${rec.category},"${rec.text}"\n`;
    });
    
    return csv;
  }
}

// Export the component
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReportGenerator;
}
