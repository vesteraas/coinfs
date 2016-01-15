# CoinFS (coinfs)

**CoinFS** is a NodeJS library for storing the content of a file in a Bitcoin transaction. The maximum file size is 40960 bytes.

## How it works
The file is split up in 20-byte long chunks, which are encoded as Bitcoin addresses, and then added as outputs on a Bitcoin transaction, right after the first output, which contains metadata (file size).

Each output has a value of 546 satoshi.  This amount is the 'dust threshold', or the minimum value you can send through the Bitcoin network.

The last address is the change address, which is the address the excess coins will be sent to, if the excess is greater than or equal to 546 sathoshis.  The change address must be specified in the options object.

Funding for the new transaction is retrieved from one or more unspent outputs of existing transactions.

The fee is calculated as described [in this thread](http://bitcoin.stackexchange.com/questions/1195/how-to-calculate-transaction-size-before-sending).

**WARNING!!!** - Funds sent to Bitcoin addresses generated by this library are lost!  At the time of writing, you will be set back 0.2 cents for every Bitcoin address generated.


## Usage
```javascript
var coinfs = require('coinfs')

var options = {
  network: 'bitcoin',                   // [bitcoin|testnet]
  amount: 0.5 * 100000000,              // Satoshis in TX output,
  inputs: [{
    hash: 'a5b8da60259ad3a800....',     // TX hash,
    index: 1,                           // Index of TX output
    WIF: '5J115WhqnVmZuD1xe4jc1g...'    // Private key of output address
  }],
  changeAddress: '1E8cEJRy38LC4sv8P...' // Bitcoin address to send the change to
}

coinfs.encode('file.txt', options, function(err, transaction) {
  console.log(transaction.toHex())
})
```
