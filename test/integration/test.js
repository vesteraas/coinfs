var assert = require('assert')
var coinfs = require('../../')

var options = {
  network: 'testnet',
  amount: 0.5 * 100000000,
  input: {
    hash: '1d3090c1ecaecc803f3aca40c00d8bdb08611737f8442f471d41ffd567fe50bf',
    index: 1
  },
  changeAddress: 'mmXQanoYFKibMdZyDcRwBbmsgk3QoGQVTf',
  WIF: '92XBSethZZLnQEVwv3CiRq86AeVp6ya9zE58Kv2SaWioX7NkXMA'
}

describe('coinfs', function() {
  it('can generate a transaction', function(done) {
    coinfs.encode('./test/integration/test.txt', options, function(err, transaction) {
      var built = transaction.build()

      assert(err == null)
      assert(built.ins.length == 1)
      assert(built.outs.length == 29)
      assert(built.outs[0].value == 546)
      assert(built.outs[28].value == 49925612)
      done()
    })
  })

  it('should throw exception when filename parameter is missing', function() {
    assert.throws(function() {
      coinfs.encode()
    }, /filename parameter is missing/)
  })

  it('should throw exception when filename parameter is not a string', function() {
    assert.throws(function() {
      coinfs.encode(42)
    }, /filename parameter should be a string/)
  })

  it('should throw exception when options parameter is missing', function() {
    assert.throws(function() {
      coinfs.encode('./test/integration/test.txt')
    }, /options parameter is missing/)
  })

  it('should throw exception when options parameter is not an object', function() {
    assert.throws(function() {
      coinfs.encode('./test/integration/test.txt', 42)
    }, /options parameter should be an object/)
  })

  it('should throw exception when callback parameter is missing', function() {
    assert.throws(function() {
      coinfs.encode('./test/integration/test.txt', options)
    }, /callback parameter is missing/)
  })

  it('should throw exception when callback parameter is not an object', function() {
    assert.throws(function() {
      coinfs.encode('./test/integration/test.txt', options, 42)
    }, /callback parameter should be a function/)
  })
})