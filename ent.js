/* The ENT test suite (references: https://github.com/jj1bdx/ent, http://fourmilab.ch/random/)
 * Every test returns a value between 0.0f and 1.0f to represent likelihood of randomness according to the test's assumptions
 * Local assumptions are explained for every test
 * The tests are remodelled to float values in the [0, 1) range, the output of Math.random()
*/
const TestSuite = require('./test_suite')
const fft = require('fft-js').fft
const ifft = require('fft-js').ifft
const CIRCLE_RADIUS = 1.0
const CIRCLE_RADIUS_SQUARED = CIRCLE_RADIUS * CIRCLE_RADIUS

class ENTSuite extends TestSuite {
  constructor (generator, options) {
    super(generator, options)
    this.monteCarlo = new ENTMontecarloTest(this)
    this.average = new ENTAverageTest(this)
    this.serialCorrelation = new ENTSerialCorrelationTest(this)
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
    const error = (montecarloPiEstimation - Math.PI) / Math.PI

    return {
      name: this.constructor.name,
      message: 'It\'s assumed a random uniform number generator provides a good estimation of PI using the montecarlo method for a large number of values',
      enginePi: Math.PI,
      estimatedPi: montecarloPiEstimation,
      isRandomProbability: 1 - error * error // The error of estimation squared
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
  run () {
    const average = this.values.reduce((a, e) => a + e, 0) / this.values.length
    const expectedAverage = 0.5
    const error = (average - expectedAverage) / expectedAverage

    return {
      name: this.constructor.name,
      message: 'An uniform PRNG should provide an average value of (MIN_VALUE + MAX_VALUE) / 2',
      expectedAverage: expectedAverage,
      actualAverage: average,
      isRandomProbability: 1 - error * error // The error of estimation squared
    }
  }
}

/*
 * An uniform PRNG should have very low autocorrelation/serial correlation (reference: http://paulbourke.net/miscellaneous/correlate/, http://www.tibonihoo.net/literate_musing/autocorrelations.html).
 * Uses the Fast Fourier Transform to compute the autocorrelation.
 *
 * From the ENT man page:
 *  This quantity measures the extent to which each byte in the file depends upon the previous byte.
 *  For random sequences, this value (which can be positive or negative) will, of course, be close to zero.
 *  A non-random byte stream such as a C program will yield a serial correlation coefficient on the order of 0.5.
 *  Wildly predictable data such as uncompressed bitmaps will exhibit serial correlation coefficients approaching 1. See [Knuth, pp. 64–65] for more details.
*/
class ENTSerialCorrelationTest extends TestSuite.Test {
  run () {
    const size = this.values.length

    var powerOf2BiggerThanDataset = 2
    do {
      powerOf2BiggerThanDataset *= 2
    } while (powerOf2BiggerThanDataset < size)

    const paddingSize = powerOf2BiggerThanDataset - size
    const average = this.values.reduce((a, e) => a + e, 0) / powerOf2BiggerThanDataset
    const paddedCenteredSygnal = this.values.map((e) => e - average).concat(new Array(paddingSize).fill(0))
    const phasors = fft(paddedCenteredSygnal)
    const powerSpectralDensity = phasors.map((e) => [e[0] * e[0] + e[1] * e[1], 0])
    const autocovariances = ifft(powerSpectralDensity).map((e) => e[0])
    const variance = autocovariances[0]

    var autocorrelation = 1
    if (variance !== 0) {
      autocorrelation = (autocovariances.reduce((a, e) => a + e, 0) / autocovariances.length) / variance
    }

    return {
      name: this.constructor.name,
      message: 'An uniform PRNG should have very low autocorrelation/serial correlation',
      autocorrelation: autocorrelation,
      expectedAverage: 0.0,
      isRandomProbability: 1 - autocorrelation * autocorrelation // The error of estimation squared (error to 0, therefore (0 - autocorrelation)^2 = autocorrelation^2)
    }
  }
}

module.exports = ENTSuite
