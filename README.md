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


#### CURRENT STATE AS OF 13 MARCH
none of the debugging (dont connect) or loading file directly work (cors)
so run http-server in the directory
open localhost:8080
Allow use of camera
Hit receive - to display QR code OR
hold up a URL to have it scanned - notice in console it calls event in webcomponents.Top
The QR codes in evernote for lotus wifi work fine for testing

#### TODO before continuing test sequence
* Work through bugs in current state above that happened since use of module
* See if can load qrcode module without polyfiller etc in index.html

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
* Bob: Scan QR/Click URL for Receive (see above)

#### TODO Concepts
* Multiple Currencies

