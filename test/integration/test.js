var assert = require('assert')
var coinfs = require('../../')

var testnet_options = {
  network: 'testnet',
  amount: 0.5 * 100000000,
  input: {
    hash: '1d3090c1ecaecc803f3aca40c00d8bdb08611737f8442f471d41ffd567fe50bf',
    index: 1
  },
  changeAddress: 'mmXQanoYFKibMdZyDcRwBbmsgk3QoGQVTf',
  WIF: '92XBSethZZLnQEVwv3CiRq86AeVp6ya9zE58Kv2SaWioX7NkXMA'
}

var bitcoin_options = {
  network: 'bitcoin',
  amount: 0.5 * 100000000,
  input: {
    hash: 'a5b8da60259ad3a800aebd76f71848fd73cb1b823cc4e6f39c3a9eb55ad04882',
    index: 1
  },
  changeAddress: '1E8cEJRy38LC4sv8PMaALo8C43CjBDe1Ho',
  WIF: '5J115WhqnVmZuD1xe4jc1g24FBJTc2Rh8onNnkQA8cM3jK6c6jH'
}

describe('coinfs', function() {
  it('can generate a transaction for testnet', function(done) {
    coinfs.encode('./test/integration/test.txt', testnet_options, function(err, transaction) {
      assert(err == null)
      assert(transaction.ins.length == 1)
      assert(transaction.outs.length == 29)
      assert(transaction.outs[0].value == 546)
      assert(transaction.outs[28].value == 49925612)
      done()
    })
  })

  it('can generate a transaction for bitcoin', function(done) {
    coinfs.encode('./test/integration/test.txt', bitcoin_options, function(err, transaction) {
      assert(err == null)
      assert(transaction.ins.length == 1)
      assert(transaction.outs.length == 29)
      assert(transaction.outs[0].value == 546)
      assert(transaction.outs[28].value == 49925612)
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
      coinfs.encode('./test/integration/test.txt', testnet_options)
    }, /callback parameter is missing/)
  })

  it('should throw exception when callback parameter is not an object', function() {
    assert.throws(function() {
      coinfs.encode('./test/integration/test.txt', testnet_options, 42)
    }, /callback parameter should be a function/)
  })
})