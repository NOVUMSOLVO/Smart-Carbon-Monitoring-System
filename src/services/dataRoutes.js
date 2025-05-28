const express = require('express');
const router = express.Router();
const dataService = require('./dataService');
const { logger } = require('../utils/logger');

/**
 * @route   POST /api/carbon
 * @desc    Create carbon data
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const carbonData = dataService.createCarbonData(req.body);
    logger.info(`Carbon data created: ${carbonData.id}`);
    res.status(201).json(carbonData);
  } catch (error) {
    logger.error(`Error creating carbon data: ${error.message}`);
    res.status(400).json({ message: error.message });
  }
});

/**
 * @route   GET /api/carbon
 * @desc    Get all carbon data
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    // Extract filter parameters from query
    const filter = {
      buildingId: req.query.buildingId,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const carbonData = dataService.getAllCarbonData(filter);
    res.json(carbonData);
  } catch (error) {
    logger.error(`Error retrieving carbon data: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/carbon/:id
 * @desc    Get carbon data by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const carbonData = dataService.getCarbonDataById(req.params.id);
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
 * @access  Public
 */
router.put('/:id', async (req, res) => {
  try {
    const carbonData = dataService.updateCarbonData(req.params.id, req.body);
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
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = dataService.deleteCarbonData(req.params.id);
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
