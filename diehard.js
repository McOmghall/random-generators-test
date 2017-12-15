const TestSuite = require('./test_suite')

/* The Diehard test suite (references: https://en.wikipedia.org/wiki/Diehard_tests, https://github.com/jj1bdx/ent, https://web.archive.org/web/20160125103112/http://stat.fsu.edu/pub/diehard/)
 * Every test returns a value between 0.0f and 1.0f to represent likelihood of randomness according to the test's assumptions
 * Local assumptions are explained for every test
 * The tests are remodelled to give an isRandomProbability float value in the [0, 1) range, representing the probability the generator is random according to the test.
*/
class DiehardSuite extends TestSuite {
  constructor (generator, options) {
    options = options || {}
    options.testConstructors = {}
    super(generator, options)
  }
}

module.exports = DiehardSuite
