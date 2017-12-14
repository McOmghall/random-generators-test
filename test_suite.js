// The baseline for every test suite on this module

class TestSuite {
  constructor (generator, options) {
    const typeError = new TypeError('A passed random number generator must have a .next() function (or a provided options.next as 2nd argument) that returns a value in [0.0f, 1.0f)')
    const localOptions = options || {}
    this.nextFunction = generator.next || localOptions.next
    this.values = []

    // Generate 10 GB of values before testing
    // Javascript number format is a double-precision 64-bit floating point format (IEEE 754)
    const GENERATE_VALUES_COUNT_PRE_TESTS = localOptions.generateValuesCountPreTests || Math.ceil(10 * 8000000 / 64)

    if (typeof this.nextFunction !== 'function') {
      throw typeError
    }

    for (var i = 0; i < GENERATE_VALUES_COUNT_PRE_TESTS; i++) {
      let value = this.nextFunction()
      if ((typeof value !== 'number') || value >= 1.0 || value < 0.0) {
        throw typeError
      }
      this.values.push(value)
    }

    this.generator = generator
    this.test = new Test(this)
    this.averageSummary = new AverageSummary(this)
    this.tests = [this.test]
    this.summaries = [this.averageSummary]
  }

  run () {
    const allTestResults = this.tests.map(function (test) { return test.run() })
    return allTestResults.concat(this.summaries.map(function (test) { return test.run(allTestResults) }))
  }
}

class Test {
  constructor (suite) {
    this.suite = suite
    this.values = suite.values
  }

  run () {
    // Intentionally left blank
    // Every test returns a report object
    return {
      name: this.constructor.name,
      message: 'This test is a placeholder to exemplify tests, therefore is not random',
      isRandomProbability: 0.0
    }
  }
}

class AverageSummary extends Test {
  run (testResults) {
    return {
      name: this.constructor.name,
      isRandomProbability: testResults.reduce((a, e) => a + e.isRandomProbability, 0) / testResults.length
    }
  }
}

TestSuite.Test = Test
TestSuite.AverageSummary = AverageSummary

module.exports = TestSuite
