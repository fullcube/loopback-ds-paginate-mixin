PAGINATION
=============

This module is designed for the [Strongloop Loopback](https://github.com/strongloop/loopback) framework.
It provides a mixin that makes it easy to add pagination to an existing model

INSTALL
=============

```bash
npm install --save loopback-ds-pagination-mixin
```

SERVER.JS
=============

In your `server/server.js` file add the following line before the
`boot(app, __dirname);` line.

```javascript
...
var app = module.exports = loopback();
...
// Add Readonly Mixin to loopback
require('loopback-ds-pagination-mixin')(app);

boot(app, __dirname, function(err) {
  'use strict';
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});
```

CONFIG
=============

To use with your Models add the `mixins` attribute to the definition object of your model config.

```json
{
    "name": "Item",
    "properties": {
        "name": "String",
        "description": "String",
        "status": "String"
    },
    "mixins": {
        "Pagination": {
            "config": {
                "limit": "10"
            }
        }
    }
}
```


TESTING
=============

Run the tests in `test.js`

```bash
  npm test
```

Run with debugging output on:

```bash
  DEBUG='loopback-ds-pagination-mixin' npm test
```
