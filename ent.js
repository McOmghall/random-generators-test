/* The ENT test suite (reference https://github.com/jj1bdx/ent)
 * Every test returns a value between 0.0f and 1.0f to represent likelihood of randomness according to the test's assumptions
 * Local assumptions are explained for every test
*/
const TestSuite = require('./test_suite')
const CIRCLE_RADIUS = 1.0
const CIRCLE_RADIUS_SQUARED = CIRCLE_RADIUS * CIRCLE_RADIUS

class ENTSuite extends TestSuite {
  init () {

  }

  /*
   * It's assumed a random uniform number generator provides a good estimation of PI using the montecarlo method for a large number of values
  */
  monteCarlo () {
    // Try to calculate PI
    const montecarloResults = this.values.reduce((result, value, index, array) => {
      const x = array[index]
      const y = array[index + 1]
      if (index % 2 === 0 && y != null) {
        const xDistance = (x * CIRCLE_RADIUS * 2 - CIRCLE_RADIUS)
        const yDistance = (y * CIRCLE_RADIUS * 2 - CIRCLE_RADIUS)
        const positionDistanceSquared = xDistance * xDistance + yDistance * yDistance
        result.sum += (positionDistanceSquared < CIRCLE_RADIUS_SQUARED ? 1 : 0)
        result.count += 1
      }
      return result
    }, { sum: 0, count: 0 })

    const montecarloPiEstimation = 4 * (montecarloResults.sum / montecarloResults.count)

    return {
      message: 'It\'s assumed a random uniform number generator provides a good estimation of PI using the montecarlo method for a large number of values',
      enginePi: Math.PI,
      estimatedPi: montecarloPiEstimation,
      isRandomProbability: 1 - (Math.PI - montecarloPiEstimation) * (Math.PI - montecarloPiEstimation) // The error of estimation squared
    }
  }
}

module.exports = ENTSuite
