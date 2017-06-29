'use strict'

const Promise = require('bluebird')
const debug = require('debug')('loopback-ds-paginate-mixin')
const assert = require('assert')
const _ = require('lodash')

module.exports = function paginateMixin(Model, settings) {
  settings = settings || {}
  const modelName = Model.definition.name
  const debugPrefix = `Model: ${modelName}: `

  debug(`${debugPrefix}Loading with settings %j`, settings)

  Model.paginate = function paginate(query, options, cb) {

    if (typeof cb === 'undefined') {
      debug(`${debugPrefix}paginate(): cb: undefined`)
      if (typeof options === 'function') {
        cb = options
        options = {}
        debug(`${debugPrefix}paginate(): cb: undefined: using the second parameter.`)
      }
      if (_.isUndefined(options)) {
        options = {}
        debug(`${debugPrefix}paginate(): cb: undefined: set options %j`, options)
      }
    }

    if (_.isUndefined(query)) {
      query = {}
      debug(`${debugPrefix}paginate(): query: undefined, default: %j`, query)
    }
    else {
      debug(`${debugPrefix}paginate(): query: defined: %j`, query)
    }

    assert(typeof query, 'object', 'Page should always be an object')

    const defaultLimit = options.limit || settings.limit || 10

    // Check if limit is passed otherwise set to mixin config or default
    if (_.isUndefined(query.limit)) {
      debug(`${debugPrefix}paginate(): query.limit: undefined, default: %s`, defaultLimit)
    }
    else {
      debug(`${debugPrefix}paginate(): query.limit: defined: %s`, query.limit)
    }

    query.limit = query.limit || defaultLimit

    // Do some assertions
    // TODO: These values should never be negative
    assert(typeof query.limit, 'number', 'Limit should always be a number')

    // Check if skip of page is passed otherwise default to 1
    if (!query.skip && !_.isUndefined(query.page)) {
      assert(typeof query.page, 'number', 'Page should always be a number')
      query.skip = (query.page - 1) * query.limit
      debug(`${debugPrefix}paginate(): query.skip: undefined, default: %s`, query.skip)
    }
    else if (query.skip) {
      debug(`${debugPrefix}paginate(): query.skip: defined: %s`, query.skip)

    }
    else {
      query.skip = 0
      debug(`${debugPrefix}paginate(): query.skip: undefined, default: %s`, query.skip)
    }

    // Allow overriding of the limit by setting the second parameter
    if (!_.isUndefined(options.limit)) {
      query.limit = options.limit
      debug(`${debugPrefix}paginate(): options.limit: defined: %s, overriding query.limit`, options.limit)
    }

    // Define the initial params object
    const params = {
      skip: query.skip,
      limit: query.limit,
    }

    // Check if additional query parameters are passed
    if (!_.isUndefined(query)) {

      // Check each of the following properties and add to params object
      const queryParams = [ 'fields', 'include', 'where', 'order' ]

      queryParams.forEach(queryParam => {
        if (!_.isUndefined(query[queryParam])) {
          params[queryParam] = query[queryParam]
          debug(`${debugPrefix}paginate(): adding param: %s = %j`, queryParam, query[queryParam])
        }
      })

    }

    // Handle the passed search terms
    if (!_.isEmpty(query.searchTerms)) {
      debug(`${debugPrefix}query.searchTerms: %j`, query.searchTerms)

      // Create a new 'and' query
      params.where = {
        and: [],
      }

      // Loop through the search terms
      _.mapKeys(query.searchTerms, (term, key) => {

        // Handle wildcard search
        if (key === '*') {
          params.where.or = []

          // Add an 'or' item for each property
          Object.keys(Model.definition.properties).forEach(property => {
            const bit = {}

            bit[property] = {
              like: term,
              options: 'i',
            }
            params.where.or.push(bit)
          })
        }
        else {

          // Add an 'and' item for each key
          const bit = {}

          bit[key] = {
            like: term,
            options: 'i',
          }
          params.where.and.push(bit)
        }
      })

    }

    if (!_.isEmpty(query.sortOrder)) {
      debug(`${debugPrefix}query.sortOrder: %j`, query.sortOrder)
      this.sortOrder = (query.sortOrder.reverse === true) ? 'DESC' : 'ASC'
      this.sortBy = query.sortOrder.predicate
      params.order = `${this.sortBy} ${this.sortOrder}`
    }

    debug(`${debugPrefix}paginate(): params: %j`, params)

    // Define where query used for counter
    const countWhere = params.where || {}

    // Get all the objects based on the params
    return Promise.resolve()
      .then(() => Model.all(params))

      // Get total number of objects based on countWhere
      .then(items => Model.count(countWhere).then(count => {
        // Format the result
        const result = {
          counters: {
            itemsFrom: query.skip,
            itemsTo: query.skip + items.length,
            itemsTotal: count,
            itemsPerPage: query.limit,
            pageTotal: Math.ceil(count / query.limit),
          },
          items,
        }

        debug(`${debugPrefix}paginate(): result: %j`, result)
        return result
      }))
      .asCallback(cb)
  }

  Model.remoteMethod('paginate', {
    accepts: [ {
      arg: 'query',
      type: 'object',
      required: false,
      http: {
        source: 'body',
      },
    } ],
    returns: {
      arg: 'result',
      type: 'string',
      root: true,
    },
    http: {
      path: '/paginate',
      verb: 'post',
    },
  })

}
