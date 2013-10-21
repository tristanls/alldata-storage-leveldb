/*

put.js - allDataStorage.put(key, value, options, callback) test

The MIT License (MIT)

Copyright (c) 2013 Tristan Slominski

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

*/

"use strict";

var AllDataStorage = require('../index.js'),
    crypto = require('crypto'),
    dateformat = require('dateformat'),
    path = require('path'),
    shelljs = require('shelljs');

var test = module.exports = {};

var TEMP_DIR = shelljs.tempdir();

var randomDir = function random() {
    return path.join(TEMP_DIR, "" + process.hrtime()[1]);
};

test['using temporary directory ' + TEMP_DIR] = function (test) {
    test.done();
};

test['put() should result in an error if key < previous interval start'] = function (test) {
    test.expect(1);
    var location = randomDir();
    shelljs.mkdir(location);
    var allDataStorage = new AllDataStorage(location);
    var key = allDataStorage.previousInterval.start;
    key = "1999" + key.slice(4);
    allDataStorage.put(key, {foo: 'bar'}, function (error) {
        test.ok(error);
        allDataStorage.close(function () {
            test.done();
        });
    });
};


test['put() should result in an error if key > next interval end'] = function (test) {
    test.expect(1);
    var location = randomDir();
    shelljs.mkdir(location);
    var allDataStorage = new AllDataStorage(location);
    var key = allDataStorage.previousInterval.start;
    var year = key.slice(0,4);
    year = "" + (parseInt(year, 10) + 1); // next year
    key = "" + year + key.slice(4);
    allDataStorage.put(key, {foo: 'bar'}, function (error) {
        test.ok(error);
        allDataStorage.close(function () {
            test.done();
        });
    });
};

test['put() should put into nextInterval if key > next interval start but key < next interval end'] = function (test) {
    test.expect(3);
    var location = randomDir();
    shelljs.mkdir(location);
    var allDataStorage = new AllDataStorage(location);
    var key = allDataStorage.nextInterval.start;
    // key example: 20131016T000000
    key = key.slice(0, 13) + "10"; // 10 seconds past nextInterval.start
    test.ok(!allDataStorage.nextInterval.interval);
    allDataStorage.put(key, {foo: 'bar'}, function (error) {
        test.ok(!error);
        allDataStorage.nextInterval.interval.get(key, function (error, value) {
            test.deepEqual(value, {foo: 'bar'});
            allDataStorage.close(function () {
                test.done();
            });
        });
    });
};

test['put() updates nextInterval XOR if putting into next interval'] = function (test) {
    test.expect(3);
    var location = randomDir();
    shelljs.mkdir(location);
    var allDataStorage = new AllDataStorage(location);
    var key = allDataStorage.nextInterval.start;
    // key example: 20131016T000000
    key = key.slice(0, 13) + "10"; // 10 seconds past nextInterval.start
    var hash = crypto.createHash('sha1').update(key).digest('base64');
    test.ok(!allDataStorage.nextInterval.interval);
    allDataStorage.put(key, {foo: 'bar'}, function (error) {
        test.ok(!error);
        allDataStorage.nextInterval.interval.get('_xor', function (error, value) {
            test.equal(value, hash); // xor of key with all zeros
            allDataStorage.close(function () {
                test.done();
            });
        });
    });  
};

test['put() should put into currentInterval if key > current interval start but key < next interval start'] = function (test) {
    test.expect(4);
    var location = randomDir();
    shelljs.mkdir(location);
    var allDataStorage = new AllDataStorage(location);
    var key = allDataStorage.currentInterval.start;
    // key example: 20131016T000000
    key = key.slice(0, 13) + "10"; // 10 seconds past currentInterval.start
    test.ok(!allDataStorage.nextInterval.interval);
    allDataStorage.put(key, {foo: 'bar'}, function (error) {
        test.ok(!allDataStorage.nextInterval.interval);
        test.ok(!error);
        allDataStorage.currentInterval.interval.get(key, function (error, value) {
            test.deepEqual(value, {foo: 'bar'});
            allDataStorage.close(function () {
                test.done();
            });
        });
    });
};

test['put() updates currentInterval XOR if putting into current interval'] = function (test) {
    test.expect(4);
    var location = randomDir();
    shelljs.mkdir(location);
    var allDataStorage = new AllDataStorage(location);
    var key = allDataStorage.currentInterval.start;
    // key example: 20131016T000000
    key = key.slice(0, 13) + "10"; // 10 seconds past currentInterval.start
    var hash = crypto.createHash('sha1').update(key).digest('base64');
    test.ok(!allDataStorage.nextInterval.interval);
    allDataStorage.put(key, {foo: 'bar'}, function (error) {
        test.ok(!allDataStorage.nextInterval.interval);
        test.ok(!error);
        allDataStorage.currentInterval.interval.get('_xor', function (error, value) {
            test.equal(value, hash); // xor of key with all zeros
            allDataStorage.close(function () {
                test.done();
            });
        });
    });  
};

test['put() should put into previousInterval if key > previous interval start but key < current interval start'] = function (test) {
    test.expect(4);
    var location = randomDir();
    shelljs.mkdir(location);
    var allDataStorage = new AllDataStorage(location);
    var key = allDataStorage.previousInterval.start;
    // key example: 20131016T000000
    key = key.slice(0, 13) + "10"; // 10 seconds past previousInterval.start
    test.ok(!allDataStorage.nextInterval.interval);
    allDataStorage.put(key, {foo: 'bar'}, function (error) {
        test.ok(!allDataStorage.nextInterval.interval);
        test.ok(!error);
        allDataStorage.previousInterval.interval.get(key, function (error, value) {
            test.deepEqual(value, {foo: 'bar'});
            allDataStorage.close(function () {
                test.done();
            });
        });
    });
};

test['put() updates previousInterval XOR if putting into previous interval'] = function (test) {
    test.expect(4);
    var location = randomDir();
    shelljs.mkdir(location);
    var allDataStorage = new AllDataStorage(location);
    var key = allDataStorage.previousInterval.start;
    // key example: 20131016T000000
    key = key.slice(0, 13) + "10"; // 10 seconds past previousInterval.start
    var hash = crypto.createHash('sha1').update(key).digest('base64');
    test.ok(!allDataStorage.nextInterval.interval);
    allDataStorage.put(key, {foo: 'bar'}, function (error) {
        test.ok(!allDataStorage.nextInterval.interval);
        test.ok(!error);
        allDataStorage.previousInterval.interval.get('_xor', function (error, value) {
            test.equal(value, hash); // xor of key with all zeros
            allDataStorage.close(function () {
                test.done();
            });
        });
    });  
};