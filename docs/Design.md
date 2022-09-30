
This is an original design doc, it might or might not match the current state of the design. 
- Mitra Ardron 26 May 2022

## Imagine a system for peer to peer payments.

### Goals

The system design is intended to allow a number of participants to exchange tokens with each other. 
Ideally it has the following properties.

* The tokens don't have to be in a single currency. 
* There may, or may not, be a relationship between any currency and fiat currencies
* Its arbitrarily extendable and backward compatible as it evolves
* It presumes two kinds of participants: *users*, who may or may not be connected at any particular time, 
  and *issuers* who are presumed to be able to reach each other via the net. 
* Is fault tolerant in the case that issuers cannot connect to each other at any particular time
* Detects bad behavior, which has consequences
* Supports both online and offline transactions (and hybrid where only one participant is online)
* Does not require Users to be connected to the same Issuer in order to trade. 

### High Level

From a high level we presume in a typical transaction, 
* Alice and Bob connect to each in person
* They both open their apps, and do some back and forth with QR codes or ids 
* Alice transfers a "check" to Bob, 
* Bob can validate or deposit that check if online, or spend it offline


Two ways to participate - online via a browser - offline via an app

#### In the following assume:
Spend is Alice -> Bob -> Charlie ...
[...]~Alice means [...] signed by Alice
Where Alice appears in a data structure, it is her Public Key that appears there.

Token  ::=  [Token.Alice; Bob; offset; value]~Alice where :
Bob is current owner, and Alice is previous
Token.Alice means a token with Alice as the current owner
Token.Alice could be represented in such a data structure by a reference (i.e. content addressed tokens) 
that reference could be a hash, or just the signature

Issuer token ::= [Issuer, Alice, offset, value]~issuer
The previous token is Null, the Issuer signs it to  Alice. The token should only be treated as valid if you (or your app) trusts the issuer.

#### Offsets
This is an odd concept but adds some power I haven't seen elsewhere.
An offset of X means that this token only includes that portion of the parent token starting from X,  so two if there is a Token with value 20 "T.alice":
[T.alice; Bob; 0, 5]~Alice and [T.alice; Charlie; 5, 15]~Alice would both be valid.
Offsets are relative to the parent, not the issuer, 
and Issuer Subsection means the portion of the Issuer token after offsets so...
[[...0,100], 50,10],5,5] refers to 5 units starting at position 55 of the issuer token.

#### Transfering
Lets say Alice wants to transfer $10 to Bob, and has a token "T.alice" with value $30 of which they've spent $20.  
They create a new token
[T.alice, Bob, 20,10]~Alice

Note the combination of this rule for Transfers and the Issuer Token pattern means the holder of a token should be able to validate a token all the way down using  the Public key for Alice in T.alice to validate the signature ~Alice; and so on down to an Issuer self-signed Token from an Issuer it trusts.

#### Signature Validation
Validating a token is the act of checking a token - and all its parents - are valid at the moment its checked, it does not itself stop a token, or one of its parents, being double-spent, nor does it confirm the issuer is valid.
A validator recursively checks the signature, using the Public Key from one level further in i.e.
[T.bob~alice, charlie]~bob:  is valid if the signature for bob works and if T.bob~alice is itself valid

#### Token validation - check or reserve
Token validation has a number of steps and can be "check" or "reserve"
1: Check signatures - see above
2: Check issuer
- Issuer not recognized - ERR_ISSUER_UNKNOWN
- If issuer different, then validate on Issuer (same check/reserve)
- If issuer same, then find issuer subsection
    - if issuer subsection previously reserved by DIFFERENT token.
        - Run double spend consequences (below)
        -  return ERR_TOKEN_USED
    - else if  destructive then reserve
        - return OK
- Reservation is all-or-nothing, if it passes, its reserved for this token, while a check makes no guarantees about another check.

#### Redemption
Redemption is an extension of validation, which involves transferring the validated token to the issuer, who then issues a new token.
Assume Issuer -> Alice ->  Charlie -> redemption, but the same logic applies if there are intermediate parties between Alice & Charlie

Charlie constructs a new token:  AI,A~AI,C~A,CI~C and sends to CI
CI then reserve's this token.
CI detects AI is the original issuer.
IF AI is CI i.e. both Alice and Charlie use same issuer
CI issues a new token CI,C~CI
Note CharlieIssuer cannot just issue the same offset,amount again - as it would conflict with the previous issue and trigger a double-spend flag against CharlieIssuer.
ELSE
CI attempts a redemption on AI: AI,A~AI,C~A,CI~C,AI~CI
which can go several different ways.
IF AI does not have a balance with CI
THEN
AI sends AI,CI~AI  to CI
IF CI is happy to have a balance with AI
THEN It stores this token in its wallet and sends CI,C~CI to Charlie
ELSE
CI creates AI,CI~AI,C~CI and returns it to C
Note this is not a commitment from Charlie Issuer, its a promise from Aliceissuer passed on through Charlieissuer, Charlie accepts it because it is backed by same issuer as what it had already. It is always a simpler token as at least Alice is taken out of it.
ELSE
Since AI has a balance with CI  instead of generating a new token, it redeems some of CI's negative balance with a token CI,AI~CI,CI~AI
CI sees that this token is circular, and marks some portion of that original token (CI,AI~CI) as redeemed.
CI issues a new token to C: CI,C~CI  ,
So from C's perspective A and AI are no longer involved, and C only has tokens open with its issuer CI.

#### Settlement between Issuers
To setup a trading relationship,  - AI and CI trade a pair of tokens [AI,CI,x,1000]~AI and [CI, AI,x,1000]~CI
If AI and CI get out of whack - i.e. more flow from customers of AI to customers of CI than vica-versa, then AI has no balance with CI that it can use to redeem tokens, it will need to transfer something else of value (e.g. Fiat) to CI in order to get a new token.


#### Deposit
Deposits are like redemption, except instead of generating a new token, the Issuer remembers that Bob has a balance. (It might choose to remember this by creating an issuer token and not sending it to Bob).

#### Double spend consquences
Any attempt to validate the same portion of the issuer token is invalid. The issuer can compare the two tokens to find the place they diverge and therefore identifier the double-spender so
[[[T.alice,bob]~alice, charlie]~bob], dave].charlie
[[[T.alice,bob]~alice,  edward]~bob], fanny]. edward
Shows that Bob cheated, and nobody else could have forged the two signed copies of the same token transfered to different people.
The issuer not only rejects the double-spent token, but refuses any more (even single spend) tokens from Bob.
During Validation, the issuer should update a set of cheating users with Bob so that the client can, in future, decline any token including that users in its path.
Note that an app will be built so a user can't use it to cheat, so Bob must also be also using a fake app.

#### Typical Online path (Alice paying Bob)
Bob goes to his prefered online site (aka issuer) bobsissuer.com/receive - 
is authenticated (probably remembered credentials) which gives a prompt for an amount - default none - and then displays a QR code with a URL back to the same site, including Bob's Public key and optionally amount.
This QR code can be statically generated and saved, or embedded in a menu or website etc.

Alice goes to her prefered online site / issuer aliceissuer.com/pay
(if she scans Bob's QR code it will go to bobissuer.com/pay with fields filled in)
payAnyone prompts to scan QR code (requesting camera permission if necessary)
If QR code does not include amount it prompts Alice to enter one  (JS on same page)
Once it knows Amount; Bob Public Key; Alice;
It checks Alice's  wallet for a token with sufficient balance.
- this could involve local storage, or on a server
- this could involve some form of negotiation to see what issuers Bob will accept - which Bob may have to check with BobIssuer EXPAND
  AliceIssuer generates a token  [[iss, alice]~iss, bob]~alice and a QR code

Bob scans this code on bobissuer.com/receive  
bobissuer validates this token, it can then redeem or deposit it to Bob's account.

#### Typical app path (Alice paying Bob),
Note, app could be a webpage with stored local content, maybe with server backup
Alice has a token on her phone T.alice of which she has spent X already.
Bob generates a QR code as for the Online case - this could be a static code in his phone wallet or even on paper (e.g. in a menu).
Alice's app scans this QR code.
If there is no amount in the QR code it asks for input, otherwise it confirms  the amount with Alice.
It creates a new token  [T.alice,bob,X,amount]~alice  and marks this part of T.alice as spent
It displays this as a QR code.
The app reads that QR code
If Bob's app is online it can validate, redeem or deposit the token
If not then it can store the token and validate later.

#### Mixed use case app -> browser or browser -> app
Note that the QR codes in the browser and app cases are identical, so:
if Bob does not have the app, then he can access the site for his personal QR code, and to deposit the payment.
If Alice does not have the app, then she can scan Bob's QR code with her browser and have the token generated from her balance.


#### Bob registers an email list to Public Key mapping (for paying to an email address)
* Bob access server/register_email?email=bob@bob.com
* Server sends [challenge]~server to bob@bob.com
* Bob clicks on link, and sends [challenge,bob,bob@bob.com]~bob to Server
* Server confirms the public key "bob" signed this, and accepts registration bob@bob.com -> bob

#### TODO
* Find QR display (scanner is in browser but maybe good in app too)
* SETTLEMENT between Issuers via broker
* ATM (withdraw balance to app as a token)
* Transaction fees - maybe via "gas"
* Backup and restore tokens
* Multi-currency
* Constraints on coins e.g. only xfer to issuer
* Think replacing nested tokens by content addressed tokens, i.e. this is the hash of them. 
* Build local storage wrapper

#### Notes:
https://github.com/mebjas/html5-qrcode or https://github.com/nimiq/qr-scanner
https://openbase.com/categories/js/best-javascript-qr-code-scanner-libraries recommends same ones
