# CoinFS (coinfs)

**CoinFS** is a library for storing a file in a Bitcoin transaction. Maximum file size is 10240 bytes.

# Usage
```javascript
var coinfs = require('coinfs')

var bitcoin_options = {
  network: 'bitcoin', // [bitcoin|testnet]
  amount: 0.5 * 100000000               // Satoshis in TX output,
  input: {
    hash: 'a5b8da60259ad3a800....'      // TX hash,
    index: 1                            // Index of TX output
  },
  changeAddress: '1E8cEJRy38LC4sv8P...' // Bitcoin address to send the change to,
  WIF: '5J115WhqnVmZuD1xe4jc1g...'      // Private key
}

coinfs.encode('file.txt', options, function(err, transaction) {
  console.log(transaction.toHex())
})
```
