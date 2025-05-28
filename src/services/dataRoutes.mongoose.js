/**
 * Data Routes with MongoDB integration
 * API routes for carbon data operations
 */
const express = require('express');
const router = express.Router();
const dataService = require('./dataService.mongoose');
const { logger } = require('../utils/logger');

/**
 * @route   POST /api/carbon
 * @desc    Create carbon data
 * @access  Public (will be protected in future)
 */
router.post('/', async (req, res) => {
  try {
    const carbonData = await dataService.createCarbonData(req.body);
    logger.info(`Carbon data created: ${carbonData._id}`);
    res.status(201).json(carbonData);
  } catch (error) {
    logger.error(`Error creating carbon data: ${error.message}`);
    res.status(400).json({ message: error.message });
  }
});

/**
 * @route   GET /api/carbon
 * @desc    Get all carbon data
 * @access  Public (will be protected in future)
 */
router.get('/', async (req, res) => {
  try {
    // Extract filter parameters from query
    const filter = {
      buildingId: req.query.buildingId,
      deviceId: req.query.deviceId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      minEnergy: req.query.minEnergy ? parseFloat(req.query.minEnergy) : undefined,
      minEmissions: req.query.minEmissions ? parseFloat(req.query.minEmissions) : undefined
    };

    // Extract pagination parameters
    const options = {
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 20,
      sortBy: req.query.sortBy || 'timestamp',
      sortOrder: req.query.sortOrder === 'asc' ? 1 : -1
    };

    const result = await dataService.getAllCarbonData(filter, options);
    res.json(result);
  } catch (error) {
    logger.error(`Error retrieving carbon data: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/carbon/statistics
 * @desc    Get statistics for carbon data
 * @access  Public (will be protected in future)
 */
router.get('/statistics', async (req, res) => {
  try {
    // Extract filter parameters from query
    const filter = {
      buildingId: req.query.buildingId,
      deviceId: req.query.deviceId,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const statistics = await dataService.getCarbonStatistics(filter);
    res.json(statistics);
  } catch (error) {
    logger.error(`Error retrieving carbon statistics: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/carbon/:id
 * @desc    Get carbon data by ID
 * @access  Public (will be protected in future)
 */
router.get('/:id', async (req, res) => {
  try {
    const carbonData = await dataService.getCarbonDataById(req.params.id);
    if (!carbonData) {
      return res.status(404).json({ message: 'Carbon data not found' });
    }
    res.json(carbonData);
  } catch (error) {
    logger.error(`Error retrieving carbon data: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   PUT /api/carbon/:id
 * @desc    Update carbon data
 * @access  Public (will be protected in future)
 */
router.put('/:id', async (req, res) => {
  try {
    const carbonData = await dataService.updateCarbonData(req.params.id, req.body);
    if (!carbonData) {
      return res.status(404).json({ message: 'Carbon data not found' });
    }
    logger.info(`Carbon data updated: ${req.params.id}`);
    res.json(carbonData);
  } catch (error) {
    logger.error(`Error updating carbon data: ${error.message}`);
    res.status(400).json({ message: error.message });
  }
});

/**
 * @route   DELETE /api/carbon/:id
 * @desc    Delete carbon data
 * @access  Public (will be protected in future)
 */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await dataService.deleteCarbonData(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Carbon data not found' });
    }
    logger.info(`Carbon data deleted: ${req.params.id}`);
    res.json({ message: 'Carbon data deleted' });
  } catch (error) {
    logger.error(`Error deleting carbon data: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
