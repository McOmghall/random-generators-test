// The baseline for every test suite on this module

// Generate 1 GB of values before testing
// Javascript number format is a double-precision 64-bit floating point format (IEEE 754)
const GENERATE_VALUES_COUNT_PRE_TESTS = Math.ceil(8000000 / 64)

class TestSuite {
  constructor (generator, options) {
    const typeError = new TypeError('A passed random number generator must have a .next() function (or a provided options.next as 2nd argument) that returns a value in [0.0f, 1.0f)')
    const localOptions = options || {}
    this.nextFunction = generator.next || localOptions.next
    this.values = []

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
  }

  init () {
    // Intentionally left blank
  }

  test () {
    // Intentionally left blank
    // Every test returns a report object
    return {
      message: 'This test is a placeholder to exemplify tests, therefore is not random',
      isRandomProbability: 0.0
    }
  }
}

module.exports = TestSuite
