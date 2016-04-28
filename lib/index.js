var deprecate = require('depd')('loopback-ds-paginate-mixin');
var paginate = require('./paginate');

module.exports = function mixin(app) {
  'use strict';
  app.loopback.modelBuilder.mixins.define = deprecate.function(app.loopback.modelBuilder.mixins.define,
    'app.modelBuilder.mixins.define: Use mixinSources instead');
  app.loopback.modelBuilder.mixins.define('Paginate', paginate);
};
