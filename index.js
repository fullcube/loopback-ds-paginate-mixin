var debug = require('debug')('loopback-ds-paginate-mixin');
var utils = require('loopback-datasource-juggler/lib/utils');
var assert = require('assert');
var _ = require('lodash');

function Paginate(Model, config) {
  'use strict';

  var mixinName = 'Paginate';
  var modelName = Model.definition.name;
  var debugPrefix = mixinName + ': ' + modelName + ': ';
  debug(debugPrefix + 'Loading with config %o', config);

  Model.paginate = function(page, limit, query, cb) {
    cb = cb || utils.createPromiseCallback();

    // Check if page is passed otherwise default to 1
    if (_.isUndefined(page)) {
      debug(debugPrefix + 'paginate: page undefined: %s', page);
      page = 1;
    } else {
      debug(debugPrefix + 'paginate: page defined: %s', page);
    }

    // Check if limit is passed otherwise set to mixin config or default
    if (_.isUndefined(limit)) {
      limit = config.options.limit || 10;
    }

    // Do some assertions
    // TODO: These values should never be negative
    assert(typeof page, 'number', 'Page should always be a number');
    assert(typeof limit, 'number', 'Limit should always be a number');

    // Define the initial params object
    var params = {
      skip: (page - 1) * limit,
      limit: limit
    };

    // Check if additional query parameters are passed
    if (!_.isUndefined(query)) {

      // Check each of the following properties and add to params object
      var queryParams = ['fields', 'include', 'where', 'order'];
      queryParams.map(function(queryParam) {

        if (!_.isUndefined(query[queryParam])) {
          params[queryParam] = query[queryParam];

          debug(debugPrefix + 'paginate: adding param: %s = %o', queryParam,
            query[queryParam]);
        }
      });

    }

    debug(debugPrefix + 'paginate: params: %o', params);

    // Define where query used for counter
    var countWhere = params.where || {};

    // Get all the objects based on the params
    Model.all(params).then(function(items) {

      // Get total number of objects based on countWhere
      Model.count(countWhere).then(function(count) {

        // Format the result
        var result = {
          paging: {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            itemsPerPage: limit,
            currentPage: page
          },
          result: items
        };

        debug(debugPrefix + 'paginate: result: %o', result);
        cb(null, result);
      }).catch(cb);
    }).catch(cb);

    return cb.promise;
  };

  Model.remoteMethod('paginate', {
    accepts: [
      {arg: 'page', type: 'number'},
      {arg: 'limit', type: 'number'},
      {arg: 'query', type: 'object'}
    ],
    returns: {arg: 'result', type: 'string', root: true},
    http: {path: '/paginate', verb: 'get'}
  });

}

module.exports = function mixin(app) {
  app.loopback.modelBuilder.mixins.define('Paginate', Paginate);
};
