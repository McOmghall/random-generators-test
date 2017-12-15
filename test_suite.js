// The baseline for every test suite on this module

const testTypeError = new TypeError('A passed random number generator must have a .next() function (or a provided options.next as 2nd argument) that returns a value in [0.0f, 1.0f)')
class TestSuite {
  constructor (generator, options) {
    this.options = options || {}
    this.nextFunction = generator.next || this.options.next
    this.values = []

    this.generator = generator
    this.testConstructors = this.options.testConstructors || { Test: Test }
    this.summaryConstructors = this.options.summaryConstructors || { AverageSummary: AverageSummary }

    if (typeof this.nextFunction !== 'function') throw testTypeError

    // Generate 2^20 values before testing
    // Javascript number format is a double-precision 64-bit floating point format (IEEE 754)
    const valueCount = this.options.generateValuesCountPreTests || Math.pow(2, 20)
    this.generateValues(valueCount)
    this.tests = Object.keys(this.testConstructors).map((e) => new this.testConstructors[e](this))
    this.summaries = Object.keys(this.summaryConstructors).map((e) => new this.summaryConstructors[e](this))
  }

  generateValues (valueCount) {
    for (var i = 0; i < valueCount; i++) {
      let value = this.nextFunction()
      if ((typeof value !== 'number') || value >= 1.0 || value < 0.0) throw testTypeError
      this.values.push(value)
    }
    return this
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
