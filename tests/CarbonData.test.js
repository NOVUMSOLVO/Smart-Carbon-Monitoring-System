/**
 * Tests for the CarbonData model
 */

const CarbonData = require('../src/models/CarbonData');

describe('CarbonData Model', () => {
  test('should create a valid carbon data instance', () => {
    const data = new CarbonData({
      buildingId: 'B-101',
      deviceId: 'D-001',
      energyConsumption: 45.7,
      carbonEmissions: 12.3,
      temperature: 22.5,
      humidity: 55
    });

    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('timestamp');
    expect(data.buildingId).toBe('B-101');
    expect(data.deviceId).toBe('D-001');
    expect(data.energyConsumption).toBe(45.7);
    expect(data.carbonEmissions).toBe(12.3);
    expect(data.temperature).toBe(22.5);
    expect(data.humidity).toBe(55);
  });

  test('should generate an ID when not provided', () => {
    const data = new CarbonData({
      buildingId: 'B-101'
    });

    expect(data.id).toBeDefined();
    expect(typeof data.id).toBe('string');
    expect(data.id.length).toBeGreaterThan(0);
  });

  test('should use provided ID when available', () => {
    const data = new CarbonData({
      id: 'test-id-123',
      buildingId: 'B-101'
    });

    expect(data.id).toBe('test-id-123');
  });

  test('should use current time as timestamp when not provided', () => {
    const now = new Date();
    const data = new CarbonData({
      buildingId: 'B-101'
    });

    expect(data.timestamp).toBeInstanceOf(Date);
    
    // Allow for small time differences during test execution
    const diff = Math.abs(data.timestamp.getTime() - now.getTime());
    expect(diff).toBeLessThan(1000); // Less than 1 second difference
  });

  test('should use provided timestamp when available', () => {
    const timestamp = new Date('2023-01-15T12:30:00Z');
    const data = new CarbonData({
      buildingId: 'B-101',
      timestamp
    });

    expect(data.timestamp).toBe(timestamp);
  });

  test('should default energy consumption and emissions to 0 when not provided', () => {
    const data = new CarbonData({
      buildingId: 'B-101',
      deviceId: 'D-001'
    });

    expect(data.energyConsumption).toBe(0);
    expect(data.carbonEmissions).toBe(0);
  });

  test('should validate and throw error when buildingId is missing', () => {
    const data = new CarbonData({
      deviceId: 'D-001',
      energyConsumption: 45.7
    });

    expect(() => {
      data.validate();
    }).toThrow('Building ID is required');
  });

  test('should validate and throw error when energy consumption is negative', () => {
    const data = new CarbonData({
      buildingId: 'B-101',
      deviceId: 'D-001',
      energyConsumption: -10
    });

    expect(() => {
      data.validate();
    }).toThrow('Energy consumption cannot be negative');
  });

  test('should validate and throw error when carbon emissions is negative', () => {
    const data = new CarbonData({
      buildingId: 'B-101',
      deviceId: 'D-001',
      energyConsumption: 45.7,
      carbonEmissions: -5
    });

    expect(() => {
      data.validate();
    }).toThrow('Carbon emissions cannot be negative');
  });

  test('should validate successfully with valid data', () => {
    const data = new CarbonData({
      buildingId: 'B-101',
      deviceId: 'D-001',
      energyConsumption: 45.7,
      carbonEmissions: 12.3
    });

    expect(data.validate()).toBe(true);
  });

  test('should handle metadata', () => {
    const metadata = {
      buildingName: 'City Hall',
      buildingType: 'government',
      deviceType: 'hvac'
    };

    const data = new CarbonData({
      buildingId: 'B-101',
      deviceId: 'D-001',
      metadata
    });

    expect(data.metadata).toEqual(metadata);
  });

  test('should default to empty object for metadata when not provided', () => {
    const data = new CarbonData({
      buildingId: 'B-101',
      deviceId: 'D-001'
    });

    expect(data.metadata).toEqual({});
  });
});
