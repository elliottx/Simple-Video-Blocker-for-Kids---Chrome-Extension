// Utility functions for testing with newer Puppeteer versions

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  sleep
};