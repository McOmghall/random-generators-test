/* The ENT test suite (reference https://github.com/jj1bdx/ent)
 * Every test returns a value between 0.0f and 1.0f to represent likelihood of randomness according to the test's assumptions
 * Local assumptions are explained for every test
 * The tests are remodelled to float values in the [0, 1) range, the output of Math.random()
*/
const TestSuite = require('./test_suite')
const CIRCLE_RADIUS = 1.0
const CIRCLE_RADIUS_SQUARED = CIRCLE_RADIUS * CIRCLE_RADIUS

class ENTSuite extends TestSuite {
  constructor (generator, options) {
    super(generator, options)
    this.monteCarlo = new ENTMontecarloTest(this)
    this.average = new ENTAverageTest(this)
    this.tests = [this.monteCarlo, this.average]
  }
}

/*
 * It's assumed an uniform PRNG provides a good estimation for PI using the montecarlo method for a large number of values
 *
 * From the ENT man page:
 *  Each successive sequence of six bytes is used as 24 bit X and Y co-ordinates within a square.
 *  If the distance of the randomly-generated point is less than the radius of a circle inscribed within the square, the six-byte sequence is considered a �hit�.
 *  The percentage of hits can be used to calculate the value of Pi. For very large streams (this approximation converges very slowly),
 *  the value will approach the correct value of Pi if the sequence is close to random. A 500000 byte file created by radioactive decay yielded:
 *    Monte Carlo value for Pi is 3.143580574 (error 0.06 percent).
*/
class ENTMontecarloTest extends TestSuite.Test {
  // Try to calculate PI
  run () {
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

/*
 * An uniform PRNG should provide an average value of (MIN_VALUE + MAX_VALUE) / 2
 *
 * From the ENT man page:
 *  This is simply the result of summing the all the bytes (bits if the -b option is specified) in the file and dividing by the file length.
 *  If the data are close to random, this should be about 127.5 (0.5 for -b option output).
 *  If the mean departs from this value, the values are consistently high or low.
*/
class ENTAverageTest extends TestSuite.Test {
  // Try to calculate PI
  run () {
    const dataForAverage = this.values
      .reduce((result, value) => {
        result.sum += value
        result.count += 1
        return result
      }, { sum: 0, count: 0 })

    const average = dataForAverage.sum / dataForAverage.count

    return {
      message: 'An uniform PRNG should provide an average value of (MIN_VALUE + MAX_VALUE) / 2',
      expectedAverage: 0.5,
      actualAverage: average,
      isRandomProbability: 1 - (0.5 - average) * (0.5 - average) // The error of estimation squared
    }
  }
}

module.exports = ENTSuite
