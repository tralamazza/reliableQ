var reliableQ = require('..');
var redis = require('redis');
var should = require('should');
var Q = require('q');


describe('ReliableQ', function () {
  var queue, client;

  before(function () {
    queue = reliableQ('reliableQ__test');
    client = redis.createClient();
  });

  beforeEach(function () {
    client.del('reliableQ__test'); // clear test list before each test
  });

  describe('Pop', function () {
    it('blocks (~250ms) waiting for elements', function (next) {
      setTimeout(function () {
        client.lpush('reliableQ__test', 'rise!');
      }, 250);

      queue.pop()
        .then(function (item) {
          item.value.should.equal('rise!');
          return item.commit();
        })
        .then(function (qlen) {
          qlen.should.equal(0);
        })
        .fail(next)
        .done(next);
    });

    it('blocks (~1s) fail by timeout', function (next) {
      queue.pop(1)
        .then(function (item) {
          should.not.exist(item);
        })
        .fail(function (err) {
          err.should.be.a('object').and.have.property('message');
        })
        .done(next);
    });

    it('auto-aborts (~250ms) by timeout', function (next) {
     queue.push('shine')
      .then(function (qlen) {
        qlen.should.equal(1); // pushed
        return queue.pop(0, 200);
      })
      .then(function (item) {
        item.value.should.equal('shine');
        return queue.length();
      })
      .then(function (qlen) {
        qlen.should.equal(0); // popped
        return Q.delay(250).then(function () {
          return queue.length();
        });
      })
      .then(function (qlen) {
        qlen.should.equal(1); // repushed by abort
      })
      .fail(next)
      .done(next);
    });
  });

  describe('Push', function () {
    it('pop commit', function (next) {
      queue.push('foobar')
        .then(function (qlen) {
          qlen.should.equal(1);
          return queue.pop();
        })
        .then(function (item) {
          item.value.should.equal('foobar');
          return item.commit();
        })
        .then(function (qlen) {
          qlen.should.equal(0);
        })
        .fail(next)
        .done(next);
    });

    it('pop abort', function (next) {
      queue.push('foobaz')
        .then(function (qlen) {
          qlen.should.equal(1);
          return queue.pop();
        })
        .then(function (item) {
          item.value.should.equal('foobaz');
          return item.abort();
        })
        .then(function (qlen) {
          qlen.should.equal(1);
        })
        .fail(next)
        .done(next);
    });
  });

  after(function () {
    queue.close();
    client.quit();
  });
});
