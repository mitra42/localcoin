### STATUS
This project is very much at the design stage - with some early coding happening occasionally. 

Please see Design.md 

### TODO
List of major tasks.
see https://github.com/mitra42/localcoin/issues as it develops

* write API drawing from README.md
** App
*** WebComponents
*** Functional
** Server
*** HTTP API
*** Functional

* scaffold a web page

#### TODO Concepts
* Multiple Currencies

#### Current Test sequence
* Open index.html (or Debug index.html in IDE)
* Alice: Click Wallet
  * TODO not implemented yet 
* Alice: Click Request. 
  * see QR code/URL for /send
  * Adjust number of units, and see QR update
* Bob: Scan QR (Click URL for now)
  * TODO there should at least be a confirmatory step here with the number of units
  * TODO This looks wrong, should be a signed token
  * see URL/QR code for receive 
* Alice: Scan QR/Click URL for /receive
  * TODO receive not implemented
* Alice: Click Send
  * TODO should not be any QR/URL when sending 0
  * Adjust number to send
* Bob: Scan QR/Click URL for Receive (see avove)