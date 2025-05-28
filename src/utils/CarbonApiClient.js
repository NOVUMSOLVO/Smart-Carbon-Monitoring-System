/**
 * API Client for Smart Carbon Monitoring System
 * Provides a simple client for interacting with the carbon monitoring API
 */

class CarbonApiClient {
  /**
   * Create a new API client instance
   * @param {String} baseUrl - Base URL for the API (default: /api/carbon)
   */
  constructor(baseUrl = '/api/carbon') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get all carbon data with optional filters
   * @param {Object} filters - Optional filters (buildingId, startDate, endDate)
   * @returns {Promise<Array>} Array of carbon data entries
   */
  async getAllData(filters = {}) {
    try {
      // Build query string from filters
      const params = new URLSearchParams();
      
      if (filters.buildingId) {
        params.append('buildingId', filters.buildingId);
      }
      
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      
      const response = await fetch(`${this.baseUrl}${queryString}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} - ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching carbon data:', error);
      throw error;
    }
  }

  /**
   * Get carbon data by ID
   * @param {String} id - Carbon data entry ID
   * @returns {Promise<Object>} Carbon data entry
   */
  async getDataById(id) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} - ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching carbon data with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new carbon data entry
   * @param {Object} data - Carbon data to create
   * @returns {Promise<Object>} Created carbon data entry
   */
  async createData(data) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${response.status} - ${errorData.message || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating carbon data:', error);
      throw error;
    }
  }

  /**
   * Update carbon data entry
   * @param {String} id - Carbon data entry ID
   * @param {Object} data - Updated data
   * @returns {Promise<Object>} Updated carbon data entry
   */
  async updateData(id, data) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${response.status} - ${errorData.message || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error updating carbon data with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete carbon data entry
   * @param {String} id - Carbon data entry ID
   * @returns {Promise<Boolean>} True if successfully deleted
   */
  async deleteData(id) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE'
      });
      
      if (response.status === 404) {
        return false;
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${response.status} - ${errorData.message || response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting carbon data with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get data for a specific building
   * @param {String} buildingId - Building ID
   * @param {Object} options - Additional options (startDate, endDate)
   * @returns {Promise<Array>} Carbon data for the building
   */
  async getBuildingData(buildingId, options = {}) {
    return this.getAllData({
      buildingId,
      startDate: options.startDate,
      endDate: options.endDate
    });
  }

  /**
   * Get data for a specific date range
   * @param {String} startDate - Start date in YYYY-MM-DD format
   * @param {String} endDate - End date in YYYY-MM-DD format
   * @param {String} buildingId - Optional building ID to filter by
   * @returns {Promise<Array>} Carbon data for the date range
   */
  async getDataByDateRange(startDate, endDate, buildingId = null) {
    return this.getAllData({
      startDate,
      endDate,
      buildingId
    });
  }
  
  /**
   * Get today's data
   * @param {String} buildingId - Optional building ID to filter by
   * @returns {Promise<Array>} Carbon data for today
   */
  async getTodaysData(buildingId = null) {
    const today = new Date().toISOString().split('T')[0];
    return this.getDataByDateRange(today, today, buildingId);
  }

  /**
   * Bulk create carbon data entries
   * @param {Array} dataArray - Array of carbon data entries to create
   * @returns {Promise<Array>} Array of created entries
   */
  async bulkCreate(dataArray) {
    if (!Array.isArray(dataArray)) {
      throw new Error('Data must be an array');
    }
    
    try {
      const results = [];
      
      // Process each entry in sequence
      for (const data of dataArray) {
        const result = await this.createData(data);
        results.push(result);
      }
      
      return results;
    } catch (error) {
      console.error('Error in bulk create:', error);
      throw error;
    }
  }
}

// For browser environments, attach to window object
if (typeof window !== 'undefined') {
  window.CarbonApiClient = CarbonApiClient;
}

// For Node.js environments, export the class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CarbonApiClient;
}
