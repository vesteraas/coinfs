var assert = require('assert')
var coinfs = require('../../')

var testnet_options = {
  network: 'testnet',
  inputs: [{
    hash: '1d3090c1ecaecc803f3aca40c00d8bdb08611737f8442f471d41ffd567fe50bf',
    index: 1,
    amount: 0.5 * 100000000,
    WIF: '92XBSethZZLnQEVwv3CiRq86AeVp6ya9zE58Kv2SaWioX7NkXMA'
  }],
  changeAddress: 'mmXQanoYFKibMdZyDcRwBbmsgk3QoGQVTf'
}

var testnet_options_with_additional_fee = {
  network: 'testnet',
  additionalFee: 250000,
  inputs: [{
    hash: '1d3090c1ecaecc803f3aca40c00d8bdb08611737f8442f471d41ffd567fe50bf',
    index: 1,
    amount: 0.5 * 100000000,
    WIF: '92XBSethZZLnQEVwv3CiRq86AeVp6ya9zE58Kv2SaWioX7NkXMA'
  }],
  changeAddress: 'mmXQanoYFKibMdZyDcRwBbmsgk3QoGQVTf'
}

var bitcoin_options = {
  network: 'bitcoin',
  inputs: [{
    hash: 'a5b8da60259ad3a800aebd76f71848fd73cb1b823cc4e6f39c3a9eb55ad04882',
    index: 1,
    amount: 0.5 * 100000000,
    WIF: '5J115WhqnVmZuD1xe4jc1g24FBJTc2Rh8onNnkQA8cM3jK6c6jH'
  }],
  changeAddress: '1E8cEJRy38LC4sv8PMaALo8C43CjBDe1Ho'
}

describe('coinfs', function() {
  it('can estimate cost 1', function(done) {
    var options = {
      network: 'testnet',
      inputs: 1
    }

    coinfs.estimateCost('./test/integration/test.txt', options, function(err, cost) {
      assert(err == null)
      assert(cost == 142450)
      done()
    })
  })

  it('can estimate cost 2', function(done) {
    var options = {
      network: 'testnet',
      inputs: 2
    }

    coinfs.estimateCost('./test/integration/test.txt', options, function(err, cost) {
      assert(err == null)
      assert(cost == 151500)
      done()
    })
  })

  it('can estimate cost width non-standard dust', function(done) {
    var options = {
      network: 'testnet',
      inputs: 1,
      dust: 3000
    }

    coinfs.estimateCost('./test/integration/test.txt', options, function(err, cost) {
      assert(err == null)
      assert(cost == 150550)
      done()
    })
  })

  it('can generate a transaction for testnet', function(done) {
    coinfs.encode('./test/integration/test.txt', testnet_options, function(err, transaction) {
      assert(err == null)
      assert(transaction.ins.length == 1)
      assert(transaction.outs.length == 30)
      assert(transaction.outs[29].value == 49857550)
      done()
    })
  })

  it('can generate a transaction for testnet with additional fee', function(done) {
    coinfs.encode('./test/integration/test.txt', testnet_options_with_additional_fee, function(err, transaction) {
      assert(err == null)
      assert(transaction.ins.length == 1)
      assert(transaction.outs.length == 30)
      assert(transaction.outs[29].value == 49807550)
      done()
    })
  })

  it('can generate a transaction for bitcoin', function(done) {
    coinfs.encode('./test/integration/test.txt', bitcoin_options, function(err, transaction) {
      assert(err == null)
      assert(transaction.ins.length == 1)
      assert(transaction.outs.length == 30)
      assert(transaction.outs[0].value == 2730)
      assert(transaction.outs[29].value == 49857550)
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

  it('can decode a transaction for bitcoin', function(done) {
    var raw = '0100000001bf50fe67d5ff411d472f44f837176108db8b0dc040ca3a3f80ccaeecc190301d010000008b483045022100fe4eaffbadc8e85b2e58a802cddfd96ee35a74049eb6f1defa29c4d4af7ea6a00220655decdc7a8256121930ca842e34b7b0dc3d301b0a1046e85639267fe420eebd01410417dfbca7d8af86a7a80b95382124445ee00fb6d764c7db87bacf00344f9b08070d15d7e0dd7513932f24dc3b8c83821d094fb6d58f1bc2508bac16e032749f4cffffffff08aa0a0000000000001976a9142020202020202020204c656e6774683a2031303488acaa0a0000000000001976a9144c6f737420636f696e73206f6e6c79206d616b6588acaa0a0000000000001976a9142065766572796f6e6520656c7365e2809973206388acaa0a0000000000001976a9146f696e7320776f72746820736c696768746c792088acaa0a0000000000001976a9146d6f72652e205468696e6b206f6620697420617388acaa0a0000000000001976a914206120646f6e6174696f6e20746f20657665727988acaa0a0000000000001976a9146f6e652e41000000b90100003f000000d401000088acc240fa02000000001976a91441e6b30483345b6fe6ebcedf3aa535eaf02058dc88ac00000000'
    coinfs.decode(raw, testnet_options, function(err, data) {
      assert(data.toString() === 'Lost coins only make everyone else’s coins worth slightly more. Think of it as a donation to everyone.')
      done()
    })
  })
})