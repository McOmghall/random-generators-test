const expect = require('chai').expect
const ENTSuite = require('../ent')

describe('Test for ENT test suite', function () {
  const tests = [{
    name: 'Math.random()',
    generator: Math.random,
    options: { next: () => Math.random() },
    expectedIsRandomValue: (value) => expect(value).to.be.above(0.99).and.below(1.01)
  }, {
    name: 'Constant 0.99999',
    generator: Math.random,
    options: { next: () => 0.99999 },
    expectedIsRandomValue: (value) => expect(value).to.be.below(0.01).and.at.least(0)
  }, {
    name: 'Constant 0.5',
    generator: Math.random,
    options: { next: () => 0.5 },
    expectedIsRandomValue: (value) => expect(value).to.be.below(0.01).and.at.least(0)
  }]
  for (let i = 0; i < tests.length; i++) {
    const testInfo = tests[i]
    describe(`Test ${testInfo.name}`, function () {
      const testSuite = new ENTSuite(testInfo.generator, testInfo.options)

      it(`should report correctly on ${testInfo.name}`, function () {
        this.timeout(100000)
        const testResults = testSuite.run()
        console.log('Test results %j', testResults)
        const averageSummaryIndex = testResults.findIndex((e) => e.name === ENTSuite.AverageSummary.name)
        testInfo.expectedIsRandomValue(testResults[averageSummaryIndex].isRandomProbability)
      })

      for (let j = 0; j < testSuite.tests.length; j++) {
        it(`should test using the ${testSuite.tests[j].constructor.name} method`, function () {
          this.timeout(30000)
          const testResults = testSuite.tests[j].run()
          console.log('Test results %j', testResults)
          testInfo.expectedIsRandomValue(testResults.isRandomProbability)
        })
      }
    })
  }
})
