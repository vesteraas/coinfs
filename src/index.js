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

  if (!options.amount) {
    throw new Error('options.amount parameter is missing')
  }

  if (!(typeof options.amount === 'number')) {
    throw new Error('options.amount parameter should be a numeric value')
  }

  if (!options.input) {
    throw new Error('options.input parameter is missing')
  }

  if (typeof options.input !== 'object') {
    throw new Error('options.input parameter should be an object')
  }

  if (!options.input.hash) {
    throw new Error('options.input.hash parameter is missing')
  }

  if (!(typeof options.input.hash === 'string' || options.input.hash instanceof String)) {
    throw new Error('options.input.hash parameter should be a string')
  }

  if (!options.input.index) {
    throw new Error('options.input.index parameter is missing')
  }

  if (!(typeof options.input.index === 'number')) {
    throw new Error('options.input.index parameter should be an integer')
  }

  if (!options.changeAddress) {
    throw new Error('options.changeAddress parameter is missing')
  }

  if (!(typeof options.changeAddress === 'string' || options.changeAddress instanceof String)) {
    throw new Error('options.changeAddress parameter should be a string')
  }

  if (!options.WIF) {
    throw new Error('options.WIF is missing')
  }

  if (!(typeof options.WIF === 'string' || options.WIF instanceof String)) {
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
      tx.addInput(options.input.hash, options.input.index)

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

      for (var i = 0; i < data.length; i += 20) {
        var subBuffer = new Buffer(data.subarray(i, i + 20))
        subBuffer = Buffer.concat([subBuffer, new Buffer(20 - subBuffer.length)])

        address = bitcoin.address.toBase58Check(subBuffer, version)

        tx.addOutput(address, bitcoin.networks[options.network].dustThreshold)
      }

      tx.addOutput(options.changeAddress, options.amount - totalAmount)

      tx.sign(0, bitcoin.ECPair.fromWIF(options.WIF, bitcoin.networks[options.network]))

      callback(null, tx.build())
    })
  })
}
