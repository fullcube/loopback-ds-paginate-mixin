/* jshint mocha: true */

var debug = require('debug')('loopback-ds-pagination-mixin');

var loopback = require('loopback');
var lt = require('loopback-testing');

var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;

var sinon = require('sinon');
chai.use(require('sinon-chai'));
require('mocha-sinon');

// Create a new loopback app.
var app = loopback();

// Set up promise support for loopback in non-ES6 runtime environment.
global.Promise = require('bluebird');

// import our Changed mixin.
require('./')(app);

// Configure datasource
dbConnector = loopback.memory();

describe('loopback datasource paginate mixin', function() {

  beforeEach(function(done) {

    // A model with 2 Changed properties.
    var Item = this.Item = loopback.PersistedModel.extend('item', {
      name: String,
      description: String,
      status: String
    }, {
      mixins: {
        Paginate: {
          options: {
            limit: '10'
          }
        }
      }
    });

    Item.attachTo(dbConnector);
    app.model(Item);

    app.use(loopback.rest());
    app.set('legacyExplorer', false);
    done();
  });

  lt.beforeEach.withApp(app);

  describe('Testing behaviour', function() {
    for (var i = 1; i <= 49; i++) {
      lt.beforeEach.givenModel('item', {
        name: 'Item' + i,
        description: 'This is item with id' + i,
        status: 'active'
      }, 'item' + i);
    }


    describe('Model.find', function() {
      it('Default find operation.', function(done) {

        this.Item.find().then(function(result) {
          assert.equal(result.length, 49, 'Should return all items');
          done();
        });

      });
    });

    describe('Model.paginate', function() {
      it('Paginate without parameters', function(done) {
        this.Item.paginate().then(function(result) {
          assert.equal(result.counters.itemsTotal, 49, 'Should return total items');
          assert.equal(result.counters.pageTotal, 5, 'Should return total pages');
          assert.equal(result.counters.itemsPerPage, 10, 'Should items per page');
          assert.equal(result.counters.itemsFrom, 0, 'Should return correct itemsFrom');
          assert.equal(result.items.length, 10, 'Should return one page');
          done();
        });
      });

      it('Paginate with where filter', function(done) {
        var request = {
          skip: 0,
          limit: 10,
          where: {
            name: 'Item1'
          }
        };
        this.Item.paginate(request).then(function(result) {
          assert.equal(result.counters.itemsTotal, 1, 'Should return total items');
          assert.equal(result.counters.pageTotal, 1, 'Should return total pages');
          assert.equal(result.counters.itemsPerPage, request.limit, 'Should items per page');
          assert.equal(result.counters.itemsFrom, request.skip, 'Should return correct itemsFrom');
          assert.equal(result.items.length, 1, 'Should return the right number of items');
          done();
        });
      });


      it('Paginate with small page', function(done) {
        var request = {
          skip: 0,
          limit: 4
        };
        this.Item.paginate(request).then(function(result) {
          assert.equal(result.counters.itemsTotal, 49, 'Should return total items');
          assert.equal(result.counters.pageTotal, 13, 'Should return total pages');
          assert.equal(result.counters.itemsPerPage, request.limit, 'Should items per page');
          assert.equal(result.counters.itemsFrom, request.skip, 'Should return correct itemsFrom');
          assert.equal(result.items.length, request.limit, 'Should return the right number of items');
          done();
        });
      });

      it('Paginate overriding the limit', function(done) {
        var request = {
          skip: 0,
          limit: 10 // This value is overwritten by the options value below
        };
        var options = {
          limit: 4
        };
        this.Item.paginate(request, options).then(function(result) {
          assert.equal(result.counters.itemsTotal, 49, 'Should return total items');
          assert.equal(result.counters.pageTotal, 13, 'Should return total pages');
          assert.equal(result.counters.itemsPerPage, request.limit, 'Should items per page');
          assert.equal(result.counters.itemsFrom, request.skip, 'Should return correct itemsFrom');
          assert.equal(result.items.length, request.limit, 'Should return the right number of items');
          done();
        });
      });

      it('Paginate with a callback instead of a promise', function(done) {
        var request = {};
        this.Item.paginate(request, function(err, result) {
          assert.equal(err, null, 'Should return no error');
          assert.equal(result.counters.itemsTotal, 49, 'Should return total items');
          assert.equal(result.counters.pageTotal, 5, 'Should return total pages');
          assert.equal(result.counters.itemsPerPage, 10, 'Should items per page');
          assert.equal(result.counters.itemsFrom, 0, 'Should return correct itemsFrom');
          assert.equal(result.items.length, 10, 'Should return one page');
          done();
        });
      });

      it('Paginate with a callback instead of a promise, overriding the limit', function(done) {
        var request = {
          skip: 0,
          limit: 10 // This value is overwritten by the options value below
        };
        var options = {
          limit: 4
        };
        this.Item.paginate(request, options, function(err, result) {
          console.log(err);
          assert.equal(err, null, 'Should return no error');
          assert.equal(result.counters.itemsTotal, 49, 'Should return total items');
          assert.equal(result.counters.pageTotal, 13, 'Should return total pages');
          assert.equal(result.counters.itemsPerPage, request.limit, 'Should items per page');
          assert.equal(result.counters.itemsFrom, request.skip, 'Should return correct itemsFrom');
          assert.equal(result.items.length, request.limit, 'Should return the right number of items');
          done();
        });
      });

    });

  });
});
