# CoinFS (coinfs)

**CoinFS** is a NodeJS library for storing the content of a file in a Bitcoin transaction. The maximum file size is 10240 bytes.

## How it works
The file is split up in 20-bytes chunks, and every chunk is encoded as a Bitcoin address, with its corresponding output in the transaction.  Each output has a value of 546 Satoshis, which is the minumum value to send over the Bitcoin network.  An additional Bitcoin address is used to store metadata for decoding purposes, and is the first address in the transaction, also with a value of 546 Sathoshis.  Finally, a change address is also added to the transaction.

You can refer to one or more inputs.  An input is the (unspent) output from a previous transaction.  The amount property contains the sum of all outputs, in Satoshis.  You need to specify the correct amount!!!  Too small, and the transaction will be invalid.  Too much, and the excess will be lost!

The fee is the lowest possible, which is 50.000 Satoshis per 1000 bytes of total transaction.

The generated transaction is a [**bitcoinjs-lib**](https://github.com/bitcoinjs/bitcoinjs-lib) object.  Call **toHex()** to get the raw transaction.

**NB!** The Satoshis sent to the addresses storing the data, will be lost forever, since their private keys are unknown.

## Usage
```javascript
var coinfs = require('coinfs')

var bitcoin_options = {
  network: 'bitcoin', // [bitcoin|testnet]
  amount: 0.5 * 100000000               // Satoshis in TX output,
  inputs: [{
    hash: 'a5b8da60259ad3a800....'      // TX hash,
    index: 1,                           // Index of TX output
    WIF: '5J115WhqnVmZuD1xe4jc1g...'    // Private key of output address
  }],
  changeAddress: '1E8cEJRy38LC4sv8P...' // Bitcoin address to send the change to,
  
}

coinfs.encode('file.txt', options, function(err, transaction) {
  console.log(transaction.toHex())
})
```
