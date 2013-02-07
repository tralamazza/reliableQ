var Q = require('q');
var redis = require('redis');

function ReliableQ(queue, options) {
  var this_q = this;
  options = options || {};

  var redis_conn = options.redis_conn || redis.createClient(options.port || 6379, options.host || '127.0.0.1');
  var queue_proc = options.processing_queue || (queue + '_processing');

  function Item(value, timeout) {
    var this_item = this;
    this_item.value = value;

    var invalid = function () {
      if (typeof this_item.value === 'undefined') return true;
      delete this_item.value;
      clearTimeout(this_item._ttl);
    };

    this_item.commit = function (cb) {
      var deferred = Q.defer();
      if (invalid())
        deferred.reject(new Error('invalid commit'));
      else {
        redis_conn.multi()
          .lrem(queue_proc, 0, value)
          .llen(queue)
          .exec(function (err, results) {
            if (err)
              deferred.reject(err);
            else
              deferred.resolve(results[1]);
          });
      }
      return deferred.promise;
    };

    this_item.abort = function () {
      var deferred = Q.defer();
      if (invalid())
        deferred.reject(new Error('invalid abort'));
      else {
        redis_conn.multi()
          .lrem(queue_proc, 0, value)
          .rpush(queue, value)
          .exec(function (err, results) {
            if (err)
              deferred.reject(err);
            else
              deferred.resolve(results[1]);
          });
      }
      return deferred.promise;
    };

    if (timeout >= 0) {
      this_item._ttl = setTimeout(function () {
        if (!invalid()) {
          redis_conn.multi()
            .lrem(queue_proc, 0, value)
            .rpush(queue, value)
            .exec(function (){});
        }
      }, timeout);
    }
    return this_item;
  }

  this_q.pop = function (timeout, abort_timeout) {
    var deferred = Q.defer();
    redis_conn.brpoplpush(queue, queue_proc, timeout || 0, function (err, result) {
      if (err)
        deferred.reject(err);
      else if (result === null)
        deferred.reject(new Error('pop timeout expired (' + timeout + ')'));
      else
        deferred.resolve(new Item(result, abort_timeout || -1));
    });
    return deferred.promise;
  };

  this_q.push = function (value) {
    var deferred = Q.defer();
    redis_conn.lpush(queue, value, function (err, result) {
      if (err)
        deferred.reject(err);
      else
        deferred.resolve(result);
    });
    return deferred.promise;
  };

  this_q.length = Q.nfbind(function (cb) { redis_conn.llen(queue, cb); });

  this_q.close = function (force) {
    if (force)
      redis_conn.end();
    else
      redis_conn.quit();
  };

  return this_q;
}

module.exports = function (queue, options) {
  return new ReliableQ(queue, options);
};
