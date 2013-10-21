/*

intervalCheck.js - allDataStorage.intervalCheck() test

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

test['using temporary directory ' + TEMP_DIR] = function (test) {
    test.done();
};

test['intervalCheck should not change intervals if now is less than nextIntervalStart'] = function (test) {
    test.expect(8);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "P1D"});

    var previousInterval = allDataStorage.previousInterval;
    var currentInterval = allDataStorage.currentInterval;
    var nextInterval = allDataStorage.nextInterval;

    allDataStorage.intervalCheck();

    test.equal(previousInterval.interval, allDataStorage.previousInterval.interval);
    test.equal(currentInterval.interval, allDataStorage.currentInterval.interval);
    test.equal(nextInterval.interval, allDataStorage.nextInterval.interval);

    test.equal(previousInterval.start, allDataStorage.previousInterval.start);
    test.equal(currentInterval.start, allDataStorage.currentInterval.start);
    test.equal(nextInterval.start, allDataStorage.nextInterval.start);
    test.equal(nextInterval.end, allDataStorage.nextInterval.end);
    test.equal(nextInterval.endDateFormat, allDataStorage.nextInterval.endDateFormat);

    allDataStorage.close(function () {
        test.done();
    });
};


test['intervalCheck should rotate intervals if now is greater than nextIntervalStart and emit interval closed'] = function (test) {
    test.expect(9);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "P1D"});

    var previousInterval = allDataStorage.previousInterval;
    var currentInterval = allDataStorage.currentInterval;
    var nextInterval = allDataStorage.nextInterval;

    // fake interval rotation time
    var now = new Date();
    var oneDay = 1000 * 60 * 60 * 24;
    now = new Date(now.getTime() + oneDay);

    allDataStorage.on('interval closed', function (closedIntervalPath) {
        test.equal(closedIntervalPath, path.join(TEMP_DIR, previousInterval.start));
        allDataStorage.close(function () {
            test.done();
        });
    });
    allDataStorage.intervalCheck(now);

    test.strictEqual(currentInterval.interval, allDataStorage.previousInterval.interval);
    test.notEqual(currentInterval.interval, allDataStorage.currentInterval.interval);
    test.strictEqual(undefined, allDataStorage.nextInterval.interval);

    test.equal(currentInterval.start, allDataStorage.previousInterval.start);
    test.equal(nextInterval.start, allDataStorage.currentInterval.start);
    test.equal(nextInterval.end, allDataStorage.nextInterval.start);
    test.notEqual(nextInterval.end, allDataStorage.nextInterval.end);
    test.notEqual(nextInterval.endDateFormat, allDataStorage.nextInterval.endDateFormat);
};