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

test['put() should result in an error if key < previousIntervalStart'] = function (test) {
    test.expect(1);
    var location = randomDir();
    shelljs.mkdir(location);
    var allDataStorage = new AllDataStorage(location);
    var key = allDataStorage.previousIntervalStart;
    key = "1999" + key.slice(4);
    allDataStorage.put(key, {foo: 'bar'}, function (error) {
        test.ok(error);
        allDataStorage.close(function () {
            test.done();
        });
    });
};


test['put() should result in an error if key > nextIntervalEnd'] = function (test) {
    test.expect(1);
    var location = randomDir();
    shelljs.mkdir(location);
    var allDataStorage = new AllDataStorage(location);
    var key = allDataStorage.previousIntervalStart;
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

test['put() should put into nextInterval if key > nextIntervalStart but key < nextIntervalEnd'] = function (test) {
    test.expect(3);
    var location = randomDir();
    shelljs.mkdir(location);
    var allDataStorage = new AllDataStorage(location);
    var key = allDataStorage.nextIntervalStart;
    // key example: 20131016T000000
    key = key.slice(0, 13) + "10"; // 10 seconds past nextIntervalStart
    test.ok(!allDataStorage.nextInterval);
    allDataStorage.put(key, {foo: 'bar'}, function (error) {
        test.ok(!error);
        allDataStorage.nextInterval.get(key, function (error, value) {
            test.deepEqual(value, {foo: 'bar'});
            allDataStorage.close(function () {
                test.done();
            });
        });
    });
};

test['put() should put into currentInterval if key > currentIntervalStart but key < nextIntervalStart'] = function (test) {
    test.expect(4);
    var location = randomDir();
    shelljs.mkdir(location);
    var allDataStorage = new AllDataStorage(location);
    var key = allDataStorage.currentIntervalStart;
    // key example: 20131016T000000
    key = key.slice(0, 13) + "10"; // 10 seconds past nextIntervalStart
    test.ok(!allDataStorage.nextInterval);
    allDataStorage.put(key, {foo: 'bar'}, function (error) {
        test.ok(!allDataStorage.nextInterval);
        test.ok(!error);
        allDataStorage.currentInterval.get(key, function (error, value) {
            test.deepEqual(value, {foo: 'bar'});
            allDataStorage.close(function () {
                test.done();
            });
        });
    });
};

test['put() should put into previousInterval if key > previousIntervalStart but key < currentIntervalStart'] = function (test) {
    test.expect(4);
    var location = randomDir();
    shelljs.mkdir(location);
    var allDataStorage = new AllDataStorage(location);
    var key = allDataStorage.previousIntervalStart;
    // key example: 20131016T000000
    key = key.slice(0, 13) + "10"; // 10 seconds past nextIntervalStart
    test.ok(!allDataStorage.nextInterval);
    allDataStorage.put(key, {foo: 'bar'}, function (error) {
        test.ok(!allDataStorage.nextInterval);
        test.ok(!error);
        allDataStorage.previousInterval.get(key, function (error, value) {
            test.deepEqual(value, {foo: 'bar'});
            allDataStorage.close(function () {
                test.done();
            });
        });
    });
};