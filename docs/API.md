# API for LocalCoin

State: this is very much a draft and will change a LOT

## APP
### WebComponents
Main
* Sits on index.html has core UI
* Has user's QR code - with null value
* Buttons for: 
** Request
** Receive
** Send
** Wallet - display wallet

Request
* UI to ask amount (or none) and optional comment
* Passes to myQRcode
* Displays resulting QR code

Send
* Scans QR from requester
** Decodes QR and parses URL
** if no amount - ask for it
** if amount ask for confirmation
** calls send(recipient, amount, comment)

Receive
* Scans QR code from requester
** Decodes QR and parses URL
** calls receive(tokens)

### Functionality
myQRcode(amount)  
* Generate and return a code specific to user 
** call ~~ QRcodeFrom(makeURL(amount))

makeURL(function, parms)
* Generate a URL (to be passed to QRcodeFrom)
* TODO what exact URL is this

QRcodeFrom(string)
* Interface to some underlying QR code generator
* TODO unclear what this returns

send(recipient, amount, comment)
* calls getToken(amount) to get array of tokens
* iterates over array calling spendToken()
* calls makeURL(send, [{tokens}])
* calls QRcodeFrom()
* displays QR

getToken(amount)
* iterates over wallet to find best token(s) to use
** TODO dig deeper into algorithm
* returns [{token, offset, amount}*]

spendToken({token, offset, amount}, recipient, comment)
* Builds outgoing token TODO more detail

receive([token])
* Checks each token for validity
* TODO think about invalidity - might be signing back to Alice
* If all valid 
** If online
*** Redeems with issuer redeem([token])


## SERVER

### HTTP

### Functionality


## Scenarios

### Bob requesting money from Alice

* Bob accesses app at SERVER/index.html
* Hits "Request"
** Fills in amount
** Calls myQRcode(amount)
** Displays result
* Alice's app scans this QR code.
** Alice's app decodes URL
** If no value in URL it prompts for one.
** otherwise it confirms  the amount with Alice.
  TODO-NextUp.3 Build this scenario out from here down
** calls send() to get QR code
** displays QR code
* Bob hits Receive
** Scans QR code
** parses URL to get tokens
** checks token
** TODO think about reject
** redeems with issuers or saves in wallet

TODO-next scenario 
