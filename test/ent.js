const assert = require('assert')
const ENTSuite = require('../ent')

describe('Test for ENT test suite', function () {
  const testSuite = new ENTSuite(Math.random, { next: () => Math.random() })
  it('should return a good montecarlo estimation', function () {
    const testResults = testSuite.monteCarlo.run()
    console.log('Test results %j', testResults)
    assert.ok(testResults.isRandomProbability >= 0.99)
  })
  it('should detect an average of 0.5', function () {
    const testResults = testSuite.average.run()
    console.log('Test results %j', testResults)
    assert.ok(testResults.isRandomProbability >= 0.99)
  })
})
