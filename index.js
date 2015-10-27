var debug = require('debug')('loopback-ds-paginate-mixin');
var utils = require('loopback-datasource-juggler/lib/utils');
var assert = require('assert');
var _ = require('lodash');

function Paginate(Model, config) {
  'use strict';

  var modelName = Model.definition.name;
  var debugPrefix = 'Model: ' + modelName + ': ';
  debug(debugPrefix + 'Loading with config %o', config);

  Model.paginate = function(query, cb) {
    cb = cb || utils.createPromiseCallback();

    if (_.isUndefined(query)) {
      query = {};
      debug(debugPrefix + 'paginate(): query: undefined, default: %j', query);
    } else {
      debug(debugPrefix + 'paginate(): query: defined: %j', query);
    }

    assert(typeof query, 'object', 'Page should always be an object');


    // Check if limit is passed otherwise set to mixin config or default
    if (_.isUndefined(query.limit)) {
      query.limit = config.limit || 10;
      debug(debugPrefix + 'paginate(): limit: undefined, default: %s', query.limit);
    } else {
      debug(debugPrefix + 'paginate(): limit: defined: %s', query.limit);
    }

    // Check if skip is passed otherwise default to 1
    if (!query.skip) {
      query.skip = 0;
      debug(debugPrefix + 'paginate(): skip: undefined, default: %s', query.skip);
    } else {
      debug(debugPrefix + 'paginate(): skip: defined: %s', query.skip);
    }

    // Do some assertions
    // TODO: These values should never be negative
    assert(typeof query.limit, 'number', 'Limit should always be a number');

    // Define the initial params object
    var params = {
      skip: query.skip,
      limit: query.limit
    };

    // Check if additional query parameters are passed
    if (!_.isUndefined(query)) {

      // Check each of the following properties and add to params object
      var queryParams = ['fields', 'include', 'where', 'order'];
      queryParams.map(function(queryParam) {

        if (!_.isUndefined(query[queryParam])) {
          params[queryParam] = query[queryParam];

          debug(debugPrefix + 'paginate(): adding param: %s = %o', queryParam,
            query[queryParam]);
        }
      });

    }

    // Handle the passed search terms
    if (!_.isEmpty(query.searchTerms)) {
      debug(debugPrefix + 'query.searchTerms: %o', query.searchTerms);

      // Create a new 'and' query
      params.where = {
        and: []
      };

      // Loop through the search terms
      _.mapKeys(query.searchTerms, function(term, key) {

        // Handle wildcard search
        if (key === '*') {
          params.where.or = [];

          // Add an 'or' item for each property
          Object.keys(Model.definition.properties).map(function(key) {
            var bit = {};
            bit[key] = {
              like: term,
              options: 'i'
            };
            params.where.or.push(bit);
          });
        } else {

          // Add an 'and' item for each key
          var bit = {};
          bit[key] = {
            like: term,
            options: 'i'
          };
          params.where.and.push(bit);
        }
      });

    }

    if (!_.isEmpty(query.sortOrder)) {
      debug(debugPrefix + 'query.sortOrder: %o', query.sortOrder);
      this.sortOrder = (query.sortOrder.reverse === true) ? 'DESC' : 'ASC';
      this.sortBy = query.sortOrder.predicate;
      params.order = this.sortBy + ' ' + this.sortOrder;
    }

    debug(debugPrefix + 'paginate(): params: %o', params);

    // Define where query used for counter
    var countWhere = params.where || {};

    // Get all the objects based on the params
    Model.all(params).then(function(items) {

      // Get total number of objects based on countWhere
      Model.count(countWhere).then(function(count) {

        // Format the result
        var result = {
          counters: {
            itemsFrom: query.skip,
            itemsTo: query.skip + items.length,
            itemsTotal: count,
            itemsPerPage: query.limit,
            pageTotal: Math.ceil(count / query.limit)
          },
          items: items
        };

        debug(debugPrefix + 'paginate(): result: %o', result);
        cb(null, result);
      }).catch(cb);
    }).catch(cb);

    return cb.promise;
  };

  Model.remoteMethod('paginate', {
    accepts: [{
      arg: 'query',
      type: 'object',
      required: false,
      http: {
        source: 'body'
      }
    }],
    returns: {
      arg: 'result',
      type: 'string',
      root: true
    },
    http: {
      path: '/paginate',
      verb: 'post'
    }
  });

}

module.exports = function mixin(app) {
  app.loopback.modelBuilder.mixins.define('Paginate', Paginate);
};
