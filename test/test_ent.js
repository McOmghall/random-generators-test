const assert = require('assert')
const ENTSuite = require('../ent')

describe('Test for ENT test suite', function () {
  const testSuite = new ENTSuite(Math.random, { next: () => Math.random() })
  it('should have a generic placeholder test', function () {
    const testResults = testSuite.test()
    console.log('Test results %j', testResults)
    assert.equal(testResults.isRandomProbability, 0)
  })
  it('should return a good montecarlo estimation', function () {
    const testResults = testSuite.monteCarlo()
    console.log('Test results %j', testResults)
    assert.ok(testResults.isRandomProbability >= 0.99)
  })
})
