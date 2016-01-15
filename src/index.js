var fs = require('fs')
var bitcoin = require('bitcoinjs-lib')
var pad = require('pad')

// http://bitcoin.stackexchange.com/questions/1195/how-to-calculate-transaction-size-before-sending
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

    if (stats.size > 10240) {
      return callback(new Error('File is too big'))
    }

    fs.readFile(filename, function (err, data) {
      if (err) {
        return callback(err)
      }

      var tx = new bitcoin.TransactionBuilder(bitcoin.networks[options.network])

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
      var outputCost = outputCount * bitcoin.networks[options.network].dustThreshold

      // http://bitcoin.stackexchange.com/questions/7537/calculator-for-estimated-tx-fees
      var calculatedFee = 50 * calculateTransactionSize(1, outputCount)

      var totalAmount = outputCost + calculatedFee

      var version

      if (options.network === 'testnet') {
        version = 0x6f
      } else {
        version = 0x00
      }

      var info = new Buffer(pad('Length: ' + stats.size, 20))
      var address = bitcoin.address.toBase58Check(info, version)

      tx.addOutput(address, bitcoin.networks[options.network].dustThreshold)

      for (i = 0; i < data.length; i += 20) {
        var subBuffer = new Buffer(data.subarray(i, i + 20))
        subBuffer = Buffer.concat([subBuffer, new Buffer(20 - subBuffer.length)])

        address = bitcoin.address.toBase58Check(subBuffer, version)

        tx.addOutput(address, bitcoin.networks[options.network].dustThreshold)
      }

      tx.addOutput(options.changeAddress, options.amount - totalAmount)

      for (i = 0; i < options.inputs.length; i++) {
        tx.sign(i, bitcoin.ECPair.fromWIF(options.inputs[i].WIF, bitcoin.networks[options.network]))
      }

      callback(null, tx.build())
    })
  })
}
