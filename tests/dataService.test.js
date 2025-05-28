/**
 * Tests for the data service
 */

const dataService = require('../src/services/dataService');

describe('Data Service', () => {
  // Reset data between tests
  beforeEach(() => {
    // Access and clear the internal data store (for testing purposes)
    const internalData = dataService.__getInternalDataForTesting ? 
                         dataService.__getInternalDataForTesting() : [];
    internalData.splice(0, internalData.length);
  });

  test('should create carbon data', () => {
    const carbonData = dataService.createCarbonData({
      buildingId: 'B-101',
      deviceId: 'D-001',
      energyConsumption: 45.7,
      carbonEmissions: 12.3
    });

    expect(carbonData).toBeDefined();
    expect(carbonData.buildingId).toBe('B-101');
    expect(carbonData.deviceId).toBe('D-001');
    expect(carbonData.energyConsumption).toBe(45.7);
    expect(carbonData.carbonEmissions).toBe(12.3);
    expect(carbonData.id).toBeDefined();
  });

  test('should throw error when creating invalid carbon data', () => {
    expect(() => {
      dataService.createCarbonData({
        deviceId: 'D-001',  // Missing buildingId
        energyConsumption: 45.7
      });
    }).toThrow('Building ID is required');
  });

  test('should get all carbon data', () => {
    // Create sample data
    dataService.createCarbonData({
      buildingId: 'B-101',
      deviceId: 'D-001',
      energyConsumption: 45.7,
      carbonEmissions: 12.3
    });

    dataService.createCarbonData({
      buildingId: 'B-102',
      deviceId: 'D-002',
      energyConsumption: 32.1,
      carbonEmissions: 8.5
    });

    const allData = dataService.getAllCarbonData();
    expect(allData).toBeInstanceOf(Array);
    expect(allData.length).toBe(2);
    expect(allData[0].buildingId).toBe('B-101');
    expect(allData[1].buildingId).toBe('B-102');
  });

  test('should filter carbon data by buildingId', () => {
    // Create sample data
    dataService.createCarbonData({
      buildingId: 'B-101',
      deviceId: 'D-001',
      energyConsumption: 45.7,
      carbonEmissions: 12.3
    });

    dataService.createCarbonData({
      buildingId: 'B-102',
      deviceId: 'D-002',
      energyConsumption: 32.1,
      carbonEmissions: 8.5
    });

    dataService.createCarbonData({
      buildingId: 'B-101',
      deviceId: 'D-003',
      energyConsumption: 28.9,
      carbonEmissions: 7.2
    });

    const filteredData = dataService.getAllCarbonData({ buildingId: 'B-101' });
    expect(filteredData).toBeInstanceOf(Array);
    expect(filteredData.length).toBe(2);
    expect(filteredData[0].buildingId).toBe('B-101');
    expect(filteredData[1].buildingId).toBe('B-101');
  });

  test('should filter carbon data by date range', () => {
    // Create sample data with specific dates
    dataService.createCarbonData({
      buildingId: 'B-101',
      timestamp: new Date('2023-01-01T12:00:00Z'),
      energyConsumption: 45.7,
      carbonEmissions: 12.3
    });

    dataService.createCarbonData({
      buildingId: 'B-102',
      timestamp: new Date('2023-01-15T12:00:00Z'),
      energyConsumption: 32.1,
      carbonEmissions: 8.5
    });

    dataService.createCarbonData({
      buildingId: 'B-101',
      timestamp: new Date('2023-02-01T12:00:00Z'),
      energyConsumption: 28.9,
      carbonEmissions: 7.2
    });

    const filteredData = dataService.getAllCarbonData({ 
      startDate: '2023-01-10',
      endDate: '2023-01-20'
    });

    expect(filteredData).toBeInstanceOf(Array);
    expect(filteredData.length).toBe(1);
    expect(new Date(filteredData[0].timestamp).toISOString()).toBe('2023-01-15T12:00:00.000Z');
  });

  test('should get carbon data by id', () => {
    // Create sample data
    const createdData = dataService.createCarbonData({
      buildingId: 'B-101',
      deviceId: 'D-001',
      energyConsumption: 45.7,
      carbonEmissions: 12.3
    });

    const retrievedData = dataService.getCarbonDataById(createdData.id);
    expect(retrievedData).toBeDefined();
    expect(retrievedData.id).toBe(createdData.id);
    expect(retrievedData.buildingId).toBe('B-101');
    expect(retrievedData.deviceId).toBe('D-001');
  });

  test('should return null when getting non-existent carbon data by id', () => {
    const retrievedData = dataService.getCarbonDataById('non-existent-id');
    expect(retrievedData).toBeNull();
  });

  test('should update carbon data', () => {
    // Create sample data
    const createdData = dataService.createCarbonData({
      buildingId: 'B-101',
      deviceId: 'D-001',
      energyConsumption: 45.7,
      carbonEmissions: 12.3
    });

    const updatedData = dataService.updateCarbonData(createdData.id, {
      energyConsumption: 50.2,
      carbonEmissions: 15.8
    });

    expect(updatedData).toBeDefined();
    expect(updatedData.id).toBe(createdData.id);
    expect(updatedData.buildingId).toBe('B-101');
    expect(updatedData.deviceId).toBe('D-001');
    expect(updatedData.energyConsumption).toBe(50.2);
    expect(updatedData.carbonEmissions).toBe(15.8);

    // Verify data was actually updated in storage
    const retrievedData = dataService.getCarbonDataById(createdData.id);
    expect(retrievedData.energyConsumption).toBe(50.2);
    expect(retrievedData.carbonEmissions).toBe(15.8);
  });

  test('should return null when updating non-existent carbon data', () => {
    const updatedData = dataService.updateCarbonData('non-existent-id', {
      energyConsumption: 50.2
    });

    expect(updatedData).toBeNull();
  });

  test('should delete carbon data', () => {
    // Create sample data
    const createdData = dataService.createCarbonData({
      buildingId: 'B-101',
      deviceId: 'D-001',
      energyConsumption: 45.7,
      carbonEmissions: 12.3
    });

    const deleted = dataService.deleteCarbonData(createdData.id);
    expect(deleted).toBe(true);

    // Verify data was actually deleted
    const retrievedData = dataService.getCarbonDataById(createdData.id);
    expect(retrievedData).toBeNull();
  });

  test('should return false when deleting non-existent carbon data', () => {
    const deleted = dataService.deleteCarbonData('non-existent-id');
    expect(deleted).toBe(false);
  });
});
