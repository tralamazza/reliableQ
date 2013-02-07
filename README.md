reliableQ
=========

[Redis](http://redis.io/) backed reliable queue with [promisified](https://npmjs.org/package/q) interface.

### Install

```npm install reliable-q```

### Test

1. Clone the repo
2. Install local redis
3. ```npm test```

### Usage

```js
var reliableQ = require('reliable-q');
var queue = reliableQ('my_little_queue');
queue.pop().then(function (item) {
  console.log('popped', item.value);
  // OK, notify the queue that we got this!
  // .commit() returns a promise as well, you can return its value and continue the chain
  /*return */ item.commit(); 
}).done(queue.close);
```


### Future plans
* EE (auto abort, errors)
* Examples & more tests


### License (MIT)

Copyright (c) 2013 Daniel Tralamazza

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
