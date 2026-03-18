const asyncHandler = require('express-async-handler');

const getListings = asyncHandler(async (req, res) => {
  res.status(200).json({ message: 'Get Listings Placeholder' });
});

const createListing = asyncHandler(async (req, res) => {
  res.status(201).json({ message: 'Create Listing Placeholder' });
});

module.exports = { getListings, createListing };
