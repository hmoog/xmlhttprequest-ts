import { TestBed } from '@angular/core/testing';

import { XMLHttpRequest } from './../../XMLHttpRequest';

describe('AES', () => {

    it('EncryptKeySize128', () => {
          // Reset each time
          xhr = new XMLHttpRequest();

          xhr.onreadystatechange = function() {
            if (this.readyState == 4) {
              if (method == "HEAD") {
                assert.equal("", this.responseText);
              } else {
                assert.equal("Hello World", this.responseText);
              }

              curMethod++;

              if (curMethod < methods.length) {
                sys.puts("Testing " + methods[curMethod]);
                start(methods[curMethod]);
              }
            }
          };

          var url = "http://google.de/"
          xhr.open(method, url);
          xhr.send();
    });
});
