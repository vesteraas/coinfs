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
    var raw = '010000000125f5b084dd5a6e8e055ac0425eb7550dffa062bd95ac378a3dca3158ea7b3a49010000008b483045022100a31e555ef76cc7630304f1bf159d1ec2a92e418a52a2c69d5cf44e7334d4fb1302206bdf39934a5ee0525bb42f8a34492d99cc6b56ac7a747cced37a01b79514fd4b01410430d380e0fe875d5f0ab8f7259519dce700e65c226821b2b3b46d0c49addad507dc553fdcc3794f4d5233f5ac470d608aefc30595db223c36e06b8790d36e3f22ffffffff0822020000000000001976a9144c656e6774683a2031303420202020202020202088ac22020000000000001976a9144c6f737420636f696e73206f6e6c79206d616b6588ac22020000000000001976a9142065766572796f6e6520656c7365e2809973206388ac22020000000000001976a9146f696e7320776f72746820736c696768746c792088ac22020000000000001976a9146d6f72652e205468696e6b206f6620697420617388ac22020000000000001976a914206120646f6e6174696f6e20746f20657665727988ac22020000000000001976a9146f6e652e0100000000000000e88b01030100000088ac2a86fa02000000001976a9148700b356a49dea54717614bb3588ff1eb965bbfe88ac00000000'
    coinfs.decode(raw, 'testnet', function(err, data) {
      assert(data.toString() === 'Lost coins only make everyone else’s coins worth slightly more. Think of it as a donation to everyone.')
      done()
    })
  })
})