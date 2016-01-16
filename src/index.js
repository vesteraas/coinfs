var fs = require('fs')
var bitcoin = require('bitcoinjs-lib')
var bitcore = require('bitcore-lib')
var TransactionBuilder = bitcoin.TransactionBuilder
var address = bitcoin.address
var networks = bitcoin.networks
var ECPair = bitcoin.ECPair
var pad = require('pad')

var calculateTransactionSize = function (inputCount, outputCount) {
  return (inputCount * 180) + (outputCount * 34) + 10 + 40
}

module.exports.encode = function (filename, options, callback) {
  if (!filename) {
    throw new Error('filename parameter is missing')
  }

  if (!(typeof filename === 'string' || filename instanceof String)) {
    throw new Error('filename parameter should be a string')
  }

  if (!options) {
    throw new Error('options parameter is missing')
  }

  if (typeof options !== 'object') {
    throw new Error('options parameter should be an object')
  }

  if (!options.network) {
    throw new Error('options.network parameter is missing')
  }

  if (!(typeof options.network === 'string' || options.network instanceof String)) {
    throw new Error('options.network parameter should be a string')
  }

  if (options.network !== 'bitcoin' && options.network !== 'testnet') {
    throw new Error('options.network should be one of ["bitcoin", "testnet"]')
  }

  if (options.amount === undefined) {
    throw new Error('options.amount parameter is missing')
  }

  if (!(typeof options.amount === 'number')) {
    throw new Error('options.amount parameter should be a numeric value')
  }

  if (!options.inputs) {
    throw new Error('options.inputs parameter is missing')
  }

  if (!options.inputs instanceof Array) {
    throw new Error('options.inputs parameter should be an array')
  }

  if (!options.changeAddress) {
    throw new Error('options.changeAddress parameter is missing')
  }

  if (!(typeof options.changeAddress === 'string' || options.changeAddress instanceof String)) {
    throw new Error('options.changeAddress parameter should be a string')
  }

  if (!callback) {
    throw new Error('callback parameter is missing')
  }

  if (typeof callback !== 'function') {
    throw new Error('callback parameter should be a function')
  }

  fs.stat(filename, function (err, stats) {
    if (err) {
      return callback(err)
    }

    if (stats.size > 40960) {
      return callback(new Error('File is too big'))
    }

    fs.readFile(filename, function (err, data) {
      if (err) {
        return callback(err)
      }

      var tx = new TransactionBuilder(networks[options.network])

      for (var i = 0; i < options.inputs.length; i++) {
        if (!options.inputs[i].hash) {
          return callback(new Error('hash parameter is missing'))
        }

        if (!(typeof options.inputs[i].hash === 'string' || options.inputs[i].hash instanceof String)) {
          return callback(new Error('hash parameter should be a string'))
        }

        if (options.inputs[i].index === undefined) {
          return callback(new Error('index parameter is missing'))
        }

        if (!(typeof options.inputs[i].index === 'number')) {
          return callback(new Error('index parameter should be an integer'))
        }

        if (!options.inputs[i].WIF) {
          return callback(new Error('WIF is missing'))
        }

        if (!(typeof options.inputs[i].WIF === 'string' || options.inputs[i].WIF instanceof String)) {
          return callback(new Error('WIF parameter should be a string'))
        }

        tx.addInput(options.inputs[i].hash, options.inputs[i].index)
      }

      var outputCount = 1 + Math.ceil(data.length / 20)
      var dustThreshold = networks[options.network].dustThreshold
      var outputCost = outputCount * dustThreshold

      var calculatedFee = 50 * calculateTransactionSize(1, outputCount)

      var totalAmount = outputCost + calculatedFee

      var version = options.network === 'testnet' ? 0x6f : 0x00

      var info = new Buffer(pad('Length: ' + stats.size, 20))
      tx.addOutput(address.toBase58Check(info, version), dustThreshold)

      for (i = 0; i < data.length; i += 20) {
        var subBuffer = new Buffer(data.subarray(i, i + 20))
        subBuffer = Buffer.concat([subBuffer, new Buffer(20 - subBuffer.length)])

        tx.addOutput(address.toBase58Check(subBuffer, version), dustThreshold)
      }

      var change = parseInt(options.amount, 10) - totalAmount

      if (change >= dustThreshold) {
        tx.addOutput(options.changeAddress, change)
      }

      for (i = 0; i < options.inputs.length; i++) {
        tx.sign(i, ECPair.fromWIF(options.inputs[i].WIF, networks[options.network]))
      }

      callback(null, tx.build())
    })
  })
}

module.exports.decode = function (rawTransaction, network, callback) {
  if (!rawTransaction) {
    throw new Error('raw parameter is missing')
  }

  if (!(typeof rawTransaction === 'string' || rawTransaction instanceof String)) {
    throw new Error('raw parameter should be a string')
  }

  if (!network) {
    throw new Error('network parameter is missing')
  }

  if (!(typeof network === 'string' || network instanceof String)) {
    throw new Error('network parameter should be a string')
  }

  if (!callback) {
    throw new Error('callback parameter is missing')
  }

  if (typeof callback !== 'function') {
    throw new Error('callback parameter should be a function')
  }

  try {
    var transaction = new bitcore.Transaction(rawTransaction)

    var script = transaction.outputs[0].script
    var metaData = bitcore.Address.fromScript(script, bitcore.Networks[network]).hashBuffer.toString()

    if (metaData.indexOf('Length:') === -1) {
      return callback(new Error('Invalid metadata'))
    }

    var size = parseInt(metaData.trim().split(': ')[1], 10)

    if (isNaN(size)) {
      return callback(new Error('Invalid metadata'))
    }

    var total = new Buffer(0)
    for (var n = 1; n < transaction.outputs.length; n++) {
      var metaDataAddress = bitcore.Address.fromScript(transaction.outputs[n].script, bitcore.Networks[network])
      if (transaction.outputs[n].satoshis === 546) {
        total = Buffer.concat([total, bitcoin.address.fromBase58Check(metaDataAddress.toString()).hash])
      }
    }

    callback(null, total.slice(0, size))
  } catch (error) {
    return callback(new Error(error))
  }
}
