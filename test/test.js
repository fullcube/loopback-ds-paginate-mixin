const loopback = require('loopback')
const lt = require('loopback-testing')

const chai = require('chai')
const { assert } = chai

// Create a new loopback app.
const app = loopback()

// Set up promise support for loopback in non-ES6 runtime environment.
global.Promise = require('bluebird')

// import our Changed mixin.
require('../')(app)

// Configure datasource
const dbConnector = loopback.memory()

describe('loopback datasource paginate mixin', () => {

  before(function() {
    // A model with 2 Changed properties.
    this.Item = loopback.PersistedModel.extend('item', {
      name: String,
      description: String,
      status: String,
    }, {
      mixins: {
        Paginate: {
          options: {
            limit: '10',
          },
        },
      },
    })

    this.Item.attachTo(dbConnector)
    app.model(this.Item)

    app.use(loopback.rest())
    app.set('legacyExplorer', false)
  })

  lt.beforeEach.withApp(app)

  describe('Testing behaviour', () => {
    for (let i = 1; i <= 49; i++) {
      lt.beforeEach.givenModel('item', {
        name: `Item${i}`,
        description: `This is item with id${i}`,
        status: 'active',
      }, `item${i}`)
    }


    describe('Model.find', () => {
      it('Default find operation.', function() {
        return this.Item.find().then(result => {
          assert.equal(result.length, 49, 'Should return all items')
        })
      })
    })

    describe('Model.paginate', () => {
      it('Paginate without parameters', function() {
        return this.Item.paginate().then(result => {
          assert.equal(result.counters.itemsTotal, 49, 'Should return total items')
          assert.equal(result.counters.pageTotal, 5, 'Should return total pages')
          assert.equal(result.counters.itemsPerPage, 10, 'Should items per page')
          assert.equal(result.counters.itemsFrom, 0, 'Should return correct itemsFrom')
          assert.equal(result.items.length, 10, 'Should return one page')
        })
      })

      it('Paginate with where filter', function() {
        const request = {
          skip: 0,
          limit: 10,
          where: {
            name: 'Item1',
          },
        }

        return this.Item.paginate(request).then(result => {
          assert.equal(result.counters.itemsTotal, 1, 'Should return total items')
          assert.equal(result.counters.pageTotal, 1, 'Should return total pages')
          assert.equal(result.counters.itemsPerPage, request.limit, 'Should items per page')
          assert.equal(result.counters.itemsFrom, request.skip, 'Should return correct itemsFrom')
          assert.equal(result.items.length, 1, 'Should return the right number of items')
        })
      })


      it('Paginate with small page', function() {
        const request = {
          skip: 0,
          limit: 4,
        }

        return this.Item.paginate(request).then(result => {
          assert.equal(result.counters.itemsTotal, 49, 'Should return total items')
          assert.equal(result.counters.pageTotal, 13, 'Should return total pages')
          assert.equal(result.counters.itemsPerPage, request.limit, 'Should items per page')
          assert.equal(result.counters.itemsFrom, request.skip, 'Should return correct itemsFrom')
          assert.equal(result.items.length, request.limit, 'Should return the right number of items')
        })
      })

      it('Paginate overriding the limit', function() {
        const request = {
          skip: 0,
          // This value is overwritten by the options value below
          limit: 10,
        }
        const options = {
          limit: 4,
        }

        return this.Item.paginate(request, options).then(result => {
          assert.equal(result.counters.itemsTotal, 49, 'Should return total items')
          assert.equal(result.counters.pageTotal, 13, 'Should return total pages')
          assert.equal(result.counters.itemsPerPage, request.limit, 'Should items per page')
          assert.equal(result.counters.itemsFrom, request.skip, 'Should return correct itemsFrom')
          assert.equal(result.items.length, request.limit, 'Should return the right number of items')
        })
      })

      it('Paginate with a callback instead of a promise', function() {
        const request = {}

        return this.Item.paginate(request, (err, result) => {
          assert.equal(err, null, 'Should return no error')
          assert.equal(result.counters.itemsTotal, 49, 'Should return total items')
          assert.equal(result.counters.pageTotal, 5, 'Should return total pages')
          assert.equal(result.counters.itemsPerPage, 10, 'Should items per page')
          assert.equal(result.counters.itemsFrom, 0, 'Should return correct itemsFrom')
          assert.equal(result.items.length, 10, 'Should return one page')
        })
      })

      it('Paginate with a callback instead of a promise, overriding the limit', function() {
        const request = {
          skip: 0,
          // This value is overwritten by the options value below
          limit: 10,
        }
        const options = {
          limit: 4,
        }

        return this.Item.paginate(request, options, (err, result) => {
          assert.equal(err, null, 'Should return no error')
          assert.equal(result.counters.itemsTotal, 49, 'Should return total items')
          assert.equal(result.counters.pageTotal, 13, 'Should return total pages')
          assert.equal(result.counters.itemsPerPage, request.limit, 'Should items per page')
          assert.equal(result.counters.itemsFrom, request.skip, 'Should return correct itemsFrom')
          assert.equal(result.items.length, request.limit, 'Should return the right number of items')
        })
      })

      it('Paginate with page when skip is falsey', function() {
        const request = {
          skip: 0,
          limit: 10,
          page: 5,
        }

        return this.Item.paginate(request).then(result => {
          assert.equal(result.counters.itemsTotal, 49, 'Should return total items')
          assert.equal(result.counters.pageTotal, 5, 'Should return total pages')
          assert.equal(result.counters.itemsPerPage, request.limit, 'Should items per page')
          assert.equal(result.counters.itemsFrom, request.skip, 'Should return correct itemsFrom')
          assert.equal(result.items.length, 9, 'Should return the right number of items')
        })
      })

      it('Paginate with page when skip undefined', function() {
        const request = {
          limit: 6,
          page: 9,
        }

        return this.Item.paginate(request).then(result => {
          assert.equal(result.counters.itemsTotal, 49, 'Should return total items')
          assert.equal(result.counters.pageTotal, 9, 'Should return total pages')
          assert.equal(result.counters.itemsPerPage, request.limit, 'Should items per page')
          assert.equal(result.counters.itemsFrom, 48, 'Should return correct itemsFrom')
          assert.equal(result.items.length, 1, 'Should return the right number of items')
        })
      })
    })
  })
})
