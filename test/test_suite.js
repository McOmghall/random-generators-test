const assert = require('assert')
const TestSuite = require('../test_suite')

describe('Test for generic test suite', function () {
  const testSuite = new TestSuite(Math.random, { next: () => Math.random() })
  it('should have a generic placeholder test', function () {
    const testResults = new testSuite.testConstructors.Test(testSuite).run()
    console.log('Test results %j', testResults)
    assert.equal(testResults.isRandomProbability, 0)
  })
  it('should run multiple tests', function () {
    const testResults = testSuite.run()
    console.log('Test results %j', testResults)
    assert.equal(testResults.length, testSuite.tests.length + testSuite.summaries.length)
  })
})
