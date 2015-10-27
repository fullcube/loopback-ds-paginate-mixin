PAGINATION
=============

This module is designed for the [Strongloop Loopback](https://github.com/strongloop/loopback) framework.
It provides a mixin that makes it easy to add paginate to an existing model

INSTALL
=============

```bash
npm install --save loopback-ds-paginate-mixin
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
require('loopback-ds-paginate-mixin')(app);

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
        "Paginate": {
            "limit": "10"
        }
    }
}
```

USAGE
=============

```javascript

// The basic 
var request = {
  skip: 0,
  limit: 15,
  where: {
    status: 'active'
  }
}

// Using a Promise
Item.paginate(request).then(function(result) {
  // The first 15 active items are in result
  console.log(result);
}).catch(function(err){
  // Handle errors here
  console.error(err);
});

// Using a callback
Item.paginate(request, function(err, result) {
  // Handle errors here if err !== null
  if(err) console.error(err);
  // The first 15 active items are in result
  console.log(result);
});

// You can override the limit on a per-request base
var options = {
  limit: 5
}
Item.paginate(request, options).then(function(result) {
  // The first 5 active items are in result
  console.log(result);
}).catch(function(err){
  // Handle errors here
  console.error(err);
});
   
```

TESTING
=============

Run the tests in `test.js`

```bash
  npm test
```

Run with debugging output on:

```bash
  DEBUG='loopback-ds-paginate-mixin' npm test
```
