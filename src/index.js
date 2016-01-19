var fs = require('fs')
var bitcoin = require('bitcoinjs-lib')
var bitcore = require('bitcore-lib')
var TransactionBuilder = bitcoin.TransactionBuilder
var address = bitcoin.address
var networks = bitcoin.networks
var ECPair = bitcoin.ECPair
var defaultDust = 2730

var calculateTransactionSize = function (inputCount, outputCount) {
  return (inputCount * 180) + (outputCount * 34) + 10 + inputCount
}

module.exports.estimateCost = function (filename, options, callback) {
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

  if (options.dust && typeof options.dust !== 'number') {
    throw new Error('options.dust should be a number')
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

      var dust = options.dust ? parseInt(options.dust, 10) : defaultDust

      var outputCount = 2 + Math.ceil(data.length / 20)
      var outputCost = outputCount * dust

      var calculatedFee = 50 * calculateTransactionSize(options.inputs, outputCount)

      var totalAmount = outputCost + calculatedFee

      callback(null, totalAmount)
    })
  })
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

  if (options.additionalFee && typeof options.additionalFee !== 'number') {
    throw new Error('options.additionalFee should be a number')
  }

  if (options.dust && typeof options.dust !== 'number') {
    throw new Error('options.dust should be a number')
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

        if (options.inputs[i].amount === undefined) {
          throw new Error('amount parameter is missing')
        }

        if (!(typeof options.inputs[i].amount === 'number')) {
          throw new Error('amount parameter should be a numeric value')
        }

        if (!options.inputs[i].WIF) {
          return callback(new Error('WIF is missing'))
        }

        if (!(typeof options.inputs[i].WIF === 'string' || options.inputs[i].WIF instanceof String)) {
          return callback(new Error('WIF parameter should be a string'))
        }

        tx.addInput(options.inputs[i].hash, options.inputs[i].index)
      }

      var dust = options.dust ? parseInt(options.dust, 10) : defaultDust

      var outputCount = 2 + Math.ceil(data.length / 20)
      var outputCost = outputCount * dust

      var calculatedFee = 50 * calculateTransactionSize(1, outputCount)
      var additionalFee = options.additionalFee ? parseInt(options.additionalFee, 10) : 0

      var totalAmount = outputCost + calculatedFee + additionalFee

      var version = options.network === 'testnet' ? 0x6f : 0x00

      var info = new Buffer('             Length: ' + stats.size).slice(-20)
      tx.addOutput(address.toBase58Check(info, version), dust)

      for (i = 0; i < data.length; i += 20) {
        var subBuffer = new Buffer(data.subarray(i, i + 20))
        subBuffer = Buffer.concat([subBuffer, new Buffer(20 - subBuffer.length)])

        tx.addOutput(address.toBase58Check(subBuffer, version), dust)
      }

      var amount = 0

      for (i = 0; i < options.inputs.length; i++) {
        amount += parseInt(options.inputs[i].amount, 10)
      }

      var change = amount - totalAmount

      if (change >= dust) {
        tx.addOutput(options.changeAddress, change)
      }

      for (i = 0; i < options.inputs.length; i++) {
        tx.sign(i, ECPair.fromWIF(options.inputs[i].WIF, networks[options.network]))
      }

      callback(null, tx.build())
    })
  })
}

module.exports.decode = function (rawTransaction, options, callback) {
  if (!rawTransaction) {
    throw new Error('raw parameter is missing')
  }

  if (!(typeof rawTransaction === 'string' || rawTransaction instanceof String)) {
    throw new Error('raw parameter should be a string')
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

  if (options.dust && typeof options.dust !== 'number') {
    throw new Error('options.dust should be a number')
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
    var metaData = bitcore.Address.fromScript(script, bitcore.Networks[options.network]).hashBuffer.toString()

    if (metaData.indexOf('Length:') === -1) {
      return callback(new Error('Invalid metadata'))
    }

    var size = parseInt(metaData.trim().split(': ')[1], 10)

    if (isNaN(size)) {
      return callback(new Error('Invalid metadata'))
    }

    var dust = options.dust ? parseInt(options.dust, 10) : defaultDust

    var total = new Buffer(0)
    for (var n = 1; n < transaction.outputs.length; n++) {
      var metaDataAddress = bitcore.Address.fromScript(transaction.outputs[n].script, bitcore.Networks[options.network])
      if (transaction.outputs[n].satoshis === dust) {
        total = Buffer.concat([total, bitcoin.address.fromBase58Check(metaDataAddress.toString()).hash])
      }
    }

    callback(null, total.slice(0, size))
  } catch (error) {
    return callback(new Error(error))
  }
}
