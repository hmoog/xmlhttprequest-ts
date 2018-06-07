# XMLHttpRequest

Typescript library of crypto standards. Ready for AOT and treeshaking in combination with Angular and other modern typescript frameworks.

## Node.js (Install)

Requirements:

- Node.js
- npm (Node.js package manager)

```bash
npm install XMLHttpRequest
```

### Usage

ES6 import for typical API call signing use case:

```javascript
import { AES } from 'XMLHttpRequest';

const encryptedMessage = AES.encrypt('message', 'test').toString();
```

Modular include:

```javascript
var AES = require("XMLHttpRequest").AES;
var SHA256 = require("XMLHttpRequest").SHA256;
...
console.log(SHA256("Message"));
```

Including all libraries, for access to extra methods:

```javascript
var CryptoTS = require("XMLHttpRequest");
...
console.log(CryptoTS.HmacSHA1("Message", "Key"));
```

## Client (browser)

Requirements:

- Node.js
- Bower (package manager for frontend)

```bash
bower install XMLHttpRequest
```

### Usage

Modular include:

```javascript
require.config({
    packages: [
        {
            name: 'XMLHttpRequest',
            location: 'path-to/bower_components/XMLHttpRequest',
            main: 'index'
        }
    ]
});

require(["XMLHttpRequest/algo/aes", "XMLHttpRequest/algo/sha256"], function (AES, SHA256) {
    console.log(SHA256("Message"));
});
```

Including all libraries, for access to extra methods:

```javascript
// Above-mentioned will work or use this simple form
require.config({
    paths: {
        'XMLHttpRequest': 'path-to/bower_components/XMLHttpRequest/XMLHttpRequest'
    }
});

require(["XMLHttpRequest"], function (CryptoTS) {
    console.log(CryptoTS.MD5("Message"));
});
```

### Usage without RequireJS

```html
<script type="text/javascript" src="path-to/bower_components/XMLHttpRequest/XMLHttpRequest.js"></script>
<script type="text/javascript">
    var encrypted = CryptoTS.AES(...);
    var encrypted = CryptoTS.SHA256(...);
</script>
```

### AES Encryption

#### Plain text encryption

```javascript
var CryptoTS = require("XMLHttpRequest");

// Encrypt
var ciphertext = CryptoTS.AES.encrypt('my message', 'secret key 123');

// Decrypt
var bytes  = CryptoTS.AES.decrypt(ciphertext.toString(), 'secret key 123');
var plaintext = bytes.toString(CryptoTS.enc.Utf8);

console.log(plaintext);
```

#### Object encryption

```javascript
var CryptoTS = require("XMLHttpRequest");

var data = [{id: 1}, {id: 2}]

// Encrypt
var ciphertext = CryptoTS.AES.encrypt(JSON.stringify(data), 'secret key 123');

// Decrypt
var bytes  = CryptoTS.AES.decrypt(ciphertext.toString(), 'secret key 123');
var decryptedData = JSON.parse(bytes.toString(CryptoTS.enc.Utf8));

console.log(decryptedData);
```

### List of modules


- ```XMLHttpRequest/core```
- ```XMLHttpRequest/x64-core```
- ```XMLHttpRequest/lib-typedarrays```

---

- ```XMLHttpRequest/md5```
- ```XMLHttpRequest/sha1```
- ```XMLHttpRequest/sha256```
- ```XMLHttpRequest/sha224```
- ```XMLHttpRequest/sha512```
- ```XMLHttpRequest/sha384```
- ```XMLHttpRequest/sha3```
- ```XMLHttpRequest/ripemd160```

---

- ```XMLHttpRequest/hmac-md5```
- ```XMLHttpRequest/hmac-sha1```
- ```XMLHttpRequest/hmac-sha256```
- ```XMLHttpRequest/hmac-sha224```
- ```XMLHttpRequest/hmac-sha512```
- ```XMLHttpRequest/hmac-sha384```
- ```XMLHttpRequest/hmac-sha3```
- ```XMLHttpRequest/hmac-ripemd160```

---

- ```XMLHttpRequest/pbkdf2```

---

- ```XMLHttpRequest/aes```
- ```XMLHttpRequest/tripledes```
- ```XMLHttpRequest/rc4```
- ```XMLHttpRequest/rabbit```
- ```XMLHttpRequest/rabbit-legacy```
- ```XMLHttpRequest/evpkdf```

---

- ```XMLHttpRequest/format-openssl```
- ```XMLHttpRequest/format-hex```

---

- ```XMLHttpRequest/enc-latin1```
- ```XMLHttpRequest/enc-utf8```
- ```XMLHttpRequest/enc-hex```
- ```XMLHttpRequest/enc-utf16```
- ```XMLHttpRequest/enc-base64```

---

- ```XMLHttpRequest/mode-cfb```
- ```XMLHttpRequest/mode-ctr```
- ```XMLHttpRequest/mode-ctr-gladman```
- ```XMLHttpRequest/mode-ofb```
- ```XMLHttpRequest/mode-ecb```

---

- ```XMLHttpRequest/pad-pkcs7```
- ```XMLHttpRequest/pad-ansix923```
- ```XMLHttpRequest/pad-iso10126```
- ```XMLHttpRequest/pad-iso97971```
- ```XMLHttpRequest/pad-zeropadding```
- ```XMLHttpRequest/pad-nopadding```