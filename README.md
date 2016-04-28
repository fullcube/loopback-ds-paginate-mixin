PAGINATION
=============

This module is designed for the [Strongloop Loopback](https://github.com/strongloop/loopback) framework.
It provides a mixin that makes it easy to add paginate to an existing model

INSTALL
=============

```bash
npm install --save loopback-ds-paginate-mixin
```

SERVER CONFIG
=============
Add the mixins property to your server/model-config.json:

```
{
  "_meta": {
    "sources": [
      "loopback/common/models",
      "loopback/server/models",
      "../common/models",
      "./models"
    ],
    "mixins": [
      "loopback/common/mixins",
      "../node_modules/loopback-ds-paginate-mixin/lib",
      "../common/mixins"
    ]
  }
}
```

MODEL CONFIG
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
