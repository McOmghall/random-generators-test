const TestSuite = require('./test_suite')
const fft = require('fft-js').fft
const ifft = require('fft-js').ifft
const CIRCLE_RADIUS = 1.0
const CIRCLE_RADIUS_SQUARED = CIRCLE_RADIUS * CIRCLE_RADIUS

/* The ENT test suite (references: https://github.com/jj1bdx/ent, http://fourmilab.ch/random/)
 * Every test returns a value between 0.0f and 1.0f to represent likelihood of randomness according to the test's assumptions
 * Local assumptions are explained for every test
 * The tests are remodelled to give an isRandomProbability float value in the [0, 1) range, representing the probability the generator is random according to the test.
*/
class ENTSuite extends TestSuite {
  constructor (generator, options) {
    options = options || {}
    options.testConstructors = {
      MontecarloTest: ENTMontecarloTest,
      AverageTest: ENTAverageTest,
      SerialCorrelationTest: ENTSerialCorrelationTest,
      EntropyTest: ENTEntropyTest,
      ChiSquaredTest: ENTChiSquaredTest
    }
    super(generator, options)
  }
}

/*
 * Aux functions for tests
*/
const clamp = (value, min, max) => Math.max(Math.min(value, max), min)
const averagef = (values) => values.reduce((a, e) => a + e, 0) / values.length
const variancef = (values, suppliedAverage) => {
  const average = suppliedAverage || averagef(values)
  return values.reduce((a, e) => a + (e - average) * (e - average), 0) / values.length
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
        if (positionDistanceSquared < CIRCLE_RADIUS_SQUARED) {
          result.sum += 1
        } else {
          result.sumOfInverse += 1
        }
        result.count += 1
      }
      return result
    }, { sum: 0, count: 0, sumOfInverse: 0 })

    const estimatedPi = 4 * montecarloResults.sum / montecarloResults.count
    const error = clamp(Math.pow((estimatedPi - Math.PI) / 0.1, 2), 0, 1)

    return {
      name: this.constructor.name,
      message: 'It\'s assumed a random uniform number generator provides a good estimation of PI using the montecarlo method for a large number of values',
      enginePi: Math.PI,
      estimatedPi: estimatedPi,
      isRandomProbability: 1 - error
    }
  }
}

/*
 * An uniform PRNG should provide an average value of (MIN_VALUE + MAX_VALUE) / 2. We add a variance factor to account for generators that don't have a big range.
 *
 * From the ENT man page:
 *  This is simply the result of summing the all the bytes (bits if the -b option is specified) in the file and dividing by the file length.
 *  If the data are close to random, this should be about 127.5 (0.5 for -b option output).
 *  If the mean departs from this value, the values are consistently high or low.
*/
class ENTAverageTest extends TestSuite.Test {
  run () {
    const average = averagef(this.values)
    const variance = variancef(this.values, average)
    const expectedAverage = 0.5
    const error = (variance === 0 ? 1 : (average - expectedAverage) / expectedAverage)

    return {
      name: this.constructor.name,
      message: 'An uniform PRNG should provide an average value of (MIN_VALUE + MAX_VALUE) / 2',
      expectedAverage: expectedAverage,
      actualAverage: average,
      variance: variance,
      isRandomProbability: 1 - error * error // The error of estimation squared
    }
  }
}

/*
 * An uniform PRNG should show very high entropy (meaning it has a very high information content - that is, any part of it can't be deducted from the rest).
 * We use a traditional entropy definition (Shannon's): Entropy = -sum_FOR_EACH_i(p(i) * log2(p(i))) where p(i) are the probabilities of every i (or every element extracted from the generator).
 * The probabilities are estimated just by counting.
 *
 * From the ENT man page:
 *  The information density of the contents of the file, expressed as a number of bits per character.
 *  The results above, which resulted from processing an image file compressed with JPEG, indicate that the file is extremely dense in information—essentially random.
 *  Hence, compression of the file is unlikely to reduce its size. By contrast, the C source code of the program has entropy of about 4.9 bits per character, indicating that optimal compression of the file would reduce its size by 38%. [Hamming, pp. 104–108]
*/
class ENTEntropyTest extends TestSuite.Test {
  run () {
    const probabilityBuckets = this.values.reduce((a, e) => {
      a[e.toString()] = (a[e.toString()] || 0) + 1
      return a
    }, {})

    var entropy = 0
    var entropyOfIdealSystem = 0
    const numberOfBuckets = Object.keys(probabilityBuckets).length
    for (let i in probabilityBuckets) {
      if (probabilityBuckets.hasOwnProperty(i)) {
        probabilityBuckets[i] = probabilityBuckets[i] / numberOfBuckets
        entropy += probabilityBuckets[i] * Math.log(probabilityBuckets[i])
        entropyOfIdealSystem += (1 / numberOfBuckets) * Math.log(1 / numberOfBuckets)
      }
    }
    entropy = -entropy
    entropyOfIdealSystem = -entropyOfIdealSystem
    const error = clamp(Math.pow((entropy - entropyOfIdealSystem) / entropyOfIdealSystem, 2), 0, 1)

    return {
      name: this.constructor.name,
      message: 'An uniform PRNG should show very high entropy (meaning it has a very high information content - that is, any part of it can\'t be deducted from the rest)',
      entropy: entropy,
      entropyOfIdealSystem: entropyOfIdealSystem,
      buckets: Object.keys(probabilityBuckets).length,
      isRandomProbability: 1 - error
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
      expectedAutocorrelation: 0.0,
      variance: variance,
      isRandomProbability: 1 - autocorrelation * autocorrelation // The error of estimation squared (error to 0, therefore (0 - autocorrelation)^2 = autocorrelation^2)
    }
  }
}

/*
 * An uniform PRNG should have a very low value on the Chi Squared test.
 *
 * From the ENT man page:
 *  The chi-square test is the most commonly used test for the randomness of data, and is extremely sensitive to errors in pseudorandom sequence generators.
 *  The chi-square distribution is calculated for the stream of bytes in the file and expressed as an absolute number and a percentage which indicates
 *  how frequently a truly random sequence would exceed the value calculated. We interpret the percentage as the degree to which the sequence tested is suspected of being non-random.
 *  If the percentage is greater than 99% or less than 1%, the sequence is almost certainly not random.
 *  If the percentage is between 99% and 95% or between 1% and 5%, the sequence is suspect.
 *  Percentages between 90% and 95% and 5% and 10% indicate the sequence is “almost suspect”.
 *  Note that our JPEG file, while very dense in information, is far from random as revealed by the chi-square test.
*/
class ENTChiSquaredTest extends TestSuite.Test {
  run () {
    const probabilityBuckets = this.values.reduce((a, e) => {
      a[e.toString()] = (a[e.toString()] || {})
      a[e.toString()].count = (a[e.toString()].count || 0) + 1
      return a
    }, {})

    var chisquared = 0
    const numberOfBuckets = Object.keys(probabilityBuckets).length
    for (let i in probabilityBuckets) {
      if (probabilityBuckets.hasOwnProperty(i)) {
        probabilityBuckets[i].probability = probabilityBuckets[i].count / numberOfBuckets
        probabilityBuckets[i].expected = 1 / numberOfBuckets
        probabilityBuckets[i].chisquaredterm = Math.pow(probabilityBuckets[i].probability - probabilityBuckets[i].expected, 2) / probabilityBuckets[i].expected
        chisquared += probabilityBuckets[i].chisquaredterm
      }
    }
    const expectedChisquared = 0

    return {
      name: this.constructor.name,
      message: 'An uniform PRNG should have a very low value on the Chi Squared test',
      chisquared: chisquared,
      expectedChisquared: expectedChisquared,
      isRandomProbability: 1 - clamp(Math.pow(chisquared - expectedChisquared, 2), 0, 1) // The error of estimation squared (error to 0, therefore (0 - autocorrelation)^2 = autocorrelation^2)
    }
  }
}

module.exports = ENTSuite
