/*

new.js - new AllDataStorage(location, options) test

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

test['new AllDataStorage() configures cacheSize from options'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {cacheSize: 1024});
    test.equal(allDataStorage.cacheSize, 1024);
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() configures compression from options'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {compression: false});
    test.equal(allDataStorage.compression, false);
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() configures consolidationInterval from options'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "PT3H"});
    test.equal(allDataStorage.consolidationInterval, "PT3H");
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() configures keyEncoding from options'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {keyEncoding: "binary"});
    test.equal(allDataStorage.keyEncoding, "binary");
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() configures valueEncoding from options'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {valueEncoding: "ascii"});
    test.equal(allDataStorage.valueEncoding, "ascii");
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() sets consolidation interval milliseconds to 1000 * 60 * 60 * 24 if P1D'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "P1D"});
    test.equal(allDataStorage.consolidationIntervalMilliseconds, 1000 * 60 * 60 * 24);
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() sets consolidation interval milliseconds to 1000 * 60 * 60 * 3 if PT3H'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "PT3H"});
    test.equal(allDataStorage.consolidationIntervalMilliseconds, 1000 * 60 * 60 * 3);
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() sets consolidation interval milliseconds to 1000 * 60 * 60 if PT1H'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "PT1H"});
    test.equal(allDataStorage.consolidationIntervalMilliseconds, 1000 * 60 * 60);
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() sets consolidation interval milliseconds to 1000 * 60 * 15 if PT15M'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "PT15M"});
    test.equal(allDataStorage.consolidationIntervalMilliseconds, 1000 * 60 * 15);
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() sets consolidation interval milliseconds to 1000 * 60 * 5 if PT5M'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "PT5M"});
    test.equal(allDataStorage.consolidationIntervalMilliseconds, 1000 * 60 * 5);
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() throws an error on unrecognized consolidationInterval'] = function (test) {
    test.expect(1);
    test.throws(function () {
        new AllDataStorage(TEMP_DIR, {consolidationInterval: "P3D"});
    });
    test.done();
};

test['new AllDataStorage() sets current interval start to current day for P1D consolidation interval'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "P1D"});
    // this test could break if crossing midnight boundary, 
    var now = new Date();
    var expected = "" + dateformat(now, "UTC:yyyy") + dateformat(now, "UTC:mm")
        + dateformat(now, "UTC:dd") + "T000000";
    test.equal(allDataStorage.currentInterval.start, expected);
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() sets previous interval start to previous day for P1D consolidation interval'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "P1D"});
    // this test could break if crossing midnight boundary, 
    var now = new Date();
    var oneDay = 1000 * 60 * 60 * 24;
    now = new Date(now.getTime() - oneDay);
    var expected = "" + dateformat(now, "UTC:yyyy") + dateformat(now, "UTC:mm")
        + dateformat(now, "UTC:dd") + "T000000";
    test.equal(allDataStorage.previousInterval.start, expected);
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() sets next interval start to next day for P1D consolidation interval'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "P1D"});
    // this test could break if crossing midnight boundary, 
    var now = new Date();
    var oneDay = 1000 * 60 * 60 * 24;
    now = new Date(now.getTime() + oneDay);
    var expected = "" + dateformat(now, "UTC:yyyy") + dateformat(now, "UTC:mm")
        + dateformat(now, "UTC:dd") + "T000000";
    test.equal(allDataStorage.nextInterval.start, expected);
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() sets next interval end to after next day for P1D consolidation interval'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "P1D"});
    // this test could break if crossing midnight boundary, 
    var now = new Date();
    var twoDays = 1000 * 60 * 60 * 24 * 2;
    now = new Date(now.getTime() + twoDays);
    var expected = "" + dateformat(now, "UTC:yyyy") + dateformat(now, "UTC:mm")
        + dateformat(now, "UTC:dd") + "T000000";
    test.equal(allDataStorage.nextInterval.end, expected);
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() sets current interval start to current hour for PT3H consolidation interval'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "PT3H"});
    // this test could break if crossing hour boundary, 
    var now = new Date();
    var format = "" + dateformat(now, "UTC:yyyy") + "-" 
        + dateformat(now, "UTC:mm") + "-" + dateformat(now, "UTC:dd") + "T";
    var hours = now.getUTCHours();
    hours = hours - (hours % 3);
    hours = "" + hours;
    if (hours.length == 1) 
        hours = "0" + hours;          
    format += hours + ":00:00";
    now = new Date(format);    
    var expected = "" + dateformat(now, "UTC:yyyy") + dateformat(now, "UTC:mm")
        + dateformat(now, "UTC:dd") + "T" + dateformat(now, "UTC:HH") + "0000";
    test.equal(allDataStorage.currentInterval.start, expected);
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() sets previous interval start to three hours ago for PT3H consolidation interval'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "PT3H"});
    // this test could break if crossing hour boundary, 
    var now = new Date();  
    var format = "" + dateformat(now, "UTC:yyyy") + "-" 
        + dateformat(now, "UTC:mm") + "-" + dateformat(now, "UTC:dd") + "T";
    var hours = now.getUTCHours();
    hours = hours - (hours % 3);
    hours = "" + hours;
    if (hours.length == 1) 
        hours = "0" + hours;          
    format += hours + ":00:00";
    now = new Date(format);
    var threeHrs = 1000 * 60 * 60 * 3;
    now = new Date(now.getTime() - threeHrs);
    var expected = "" + dateformat(now, "UTC:yyyy") + dateformat(now, "UTC:mm")
        + dateformat(now, "UTC:dd") + "T" + dateformat(now, "UTC:HH") + "0000";
    test.equal(allDataStorage.previousInterval.start, expected);
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() sets next interval start to three hours from now for PT3H consolidation interval'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "PT3H"});
    // this test could break if crossing midnight boundary, 
    var now = new Date();
    var format = "" + dateformat(now, "UTC:yyyy") + "-" 
        + dateformat(now, "UTC:mm") + "-" + dateformat(now, "UTC:dd") + "T";
    var hours = now.getUTCHours();
    hours = hours - (hours % 3);
    hours = "" + hours;
    if (hours.length == 1) 
        hours = "0" + hours;          
    format += hours + ":00:00";
    now = new Date(format);    
    var threeHrs = 1000 * 60 * 60 * 3;
    now = new Date(now.getTime() + threeHrs);
    var expected = "" + dateformat(now, "UTC:yyyy") + dateformat(now, "UTC:mm")
        + dateformat(now, "UTC:dd") + "T" + dateformat(now, "UTC:HH") + "0000";
    test.equal(allDataStorage.nextInterval.start, expected);
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() sets next interval end to after interval three hours from now for PT3H consolidation interval'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "PT3H"});
    // this test could break if crossing midnight boundary, 
    var now = new Date();
    var format = "" + dateformat(now, "UTC:yyyy") + "-" 
        + dateformat(now, "UTC:mm") + "-" + dateformat(now, "UTC:dd") + "T";
    var hours = now.getUTCHours();
    hours = hours - (hours % 3);
    hours = "" + hours;
    if (hours.length == 1) 
        hours = "0" + hours;          
    format += hours + ":00:00";
    now = new Date(format);    
    var sixHrs = 1000 * 60 * 60 * 6;
    now = new Date(now.getTime() + sixHrs);
    var expected = "" + dateformat(now, "UTC:yyyy") + dateformat(now, "UTC:mm")
        + dateformat(now, "UTC:dd") + "T" + dateformat(now, "UTC:HH") + "0000";
    test.equal(allDataStorage.nextInterval.end, expected);
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() sets current interval start to current hour for PT1H consolidation interval'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "PT1H"});
    // this test could break if crossing hour boundary, 
    var now = new Date();
    var expected = "" + dateformat(now, "UTC:yyyy") + dateformat(now, "UTC:mm")
        + dateformat(now, "UTC:dd") + "T" + dateformat(now, "UTC:HH") + "0000";
    test.equal(allDataStorage.currentInterval.start, expected);
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() sets previous interval start to previous hour for PT1H consolidation interval'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "PT1H"});
    // this test could break if crossing hour boundary, 
    var now = new Date();
    var oneHr = 1000 * 60 * 60;
    now = new Date(now.getTime() - oneHr);
    var expected = "" + dateformat(now, "UTC:yyyy") + dateformat(now, "UTC:mm")
        + dateformat(now, "UTC:dd") + "T" + dateformat(now, "UTC:HH") + "0000";
    test.equal(allDataStorage.previousInterval.start, expected);
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() sets next interval start to next hour for PT1H consolidation interval'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "PT1H"});
    // this test could break if crossing midnight boundary, 
    var now = new Date();
    var oneHr = 1000 * 60 * 60;
    now = new Date(now.getTime() + oneHr);
    var expected = "" + dateformat(now, "UTC:yyyy") + dateformat(now, "UTC:mm")
        + dateformat(now, "UTC:dd") + "T" + dateformat(now, "UTC:HH") + "0000";
    test.equal(allDataStorage.nextInterval.start, expected);
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() sets next interval end to after next hour for PT1H consolidation interval'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "PT1H"});
    // this test could break if crossing midnight boundary, 
    var now = new Date();
    var twoHr = 1000 * 60 * 60 * 2;
    now = new Date(now.getTime() + twoHr);
    var expected = "" + dateformat(now, "UTC:yyyy") + dateformat(now, "UTC:mm")
        + dateformat(now, "UTC:dd") + "T" + dateformat(now, "UTC:HH") + "0000";
    test.equal(allDataStorage.nextInterval.end, expected);
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() sets current interval start to current 15 min for PT15M consolidation interval'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "PT15M"});
    // this test could break if crossing hour boundary, 
    var now = new Date();
    var format = "" + dateformat(now, "UTC:yyyy") + "-" 
        + dateformat(now, "UTC:mm") + "-" + dateformat(now, "UTC:dd")
        + "T" + dateformat(now, "UTC:HH");
    var minutes = now.getUTCMinutes();
    minutes = minutes - (minutes % 15);
    minutes = "" + minutes;
    if (minutes.length == 1)
        minutes = "0" + minutes;
    format += ":" + minutes + ":00";
    now = new Date(format);
    var expected = "" + dateformat(now, "UTC:yyyy") + dateformat(now, "UTC:mm")
        + dateformat(now, "UTC:dd") + "T" + dateformat(now, "UTC:HH") 
        + dateformat(now, "UTC:MM") + "00";
    test.equal(allDataStorage.currentInterval.start, expected);
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() sets previous interval start to previous 15 min for PT15M consolidation interval'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "PT15M"});
    // this test could break if crossing hour boundary, 
    var now = new Date();
    var format = "" + dateformat(now, "UTC:yyyy") + "-" 
        + dateformat(now, "UTC:mm") + "-" + dateformat(now, "UTC:dd")
        + "T" + dateformat(now, "UTC:HH");
    var minutes = now.getUTCMinutes();
    minutes = minutes - (minutes % 15);
    minutes = "" + minutes;
    if (minutes.length == 1)
        minutes = "0" + minutes;
    format += ":" + minutes + ":00";
    now = new Date(format);
    var min15 = 1000 * 60 * 15;
    now = new Date(now.getTime() - min15);
    var expected = "" + dateformat(now, "UTC:yyyy") + dateformat(now, "UTC:mm")
        + dateformat(now, "UTC:dd") + "T" + dateformat(now, "UTC:HH") 
        + dateformat(now, "UTC:MM") + "00";
    test.equal(allDataStorage.previousInterval.start, expected);
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() sets next interval start to next 15 min for PT15M consolidation interval'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "PT15M"});
    // this test could break if crossing midnight boundary, 
    var now = new Date();
    var format = "" + dateformat(now, "UTC:yyyy") + "-" 
        + dateformat(now, "UTC:mm") + "-" + dateformat(now, "UTC:dd")
        + "T" + dateformat(now, "UTC:HH");
    var minutes = now.getUTCMinutes();
    minutes = minutes - (minutes % 15);
    minutes = "" + minutes;
    if (minutes.length == 1)
        minutes = "0" + minutes;
    format += ":" + minutes + ":00";
    now = new Date(format);
    var min15 = 1000 * 60 * 15;
    now = new Date(now.getTime() + min15);
    var expected = "" + dateformat(now, "UTC:yyyy") + dateformat(now, "UTC:mm")
        + dateformat(now, "UTC:dd") + "T" + dateformat(now, "UTC:HH") 
        + dateformat(now, "UTC:MM") + "00";
    test.equal(allDataStorage.nextInterval.start, expected);
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() sets next interval end to after next 15 min for PT15M consolidation interval'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "PT15M"});
    // this test could break if crossing midnight boundary, 
    var now = new Date();
    var format = "" + dateformat(now, "UTC:yyyy") + "-" 
        + dateformat(now, "UTC:mm") + "-" + dateformat(now, "UTC:dd")
        + "T" + dateformat(now, "UTC:HH");
    var minutes = now.getUTCMinutes();
    minutes = minutes - (minutes % 15);
    minutes = "" + minutes;
    if (minutes.length == 1)
        minutes = "0" + minutes;
    format += ":" + minutes + ":00";
    now = new Date(format);
    var min30 = 1000 * 60 * 30;
    now = new Date(now.getTime() + min30);
    var expected = "" + dateformat(now, "UTC:yyyy") + dateformat(now, "UTC:mm")
        + dateformat(now, "UTC:dd") + "T" + dateformat(now, "UTC:HH") 
        + dateformat(now, "UTC:MM") + "00";
    test.equal(allDataStorage.nextInterval.end, expected);
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() sets current interval start to current 5 min for PT5M consolidation interval'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "PT5M"});
    // this test could break if crossing hour boundary, 
    var now = new Date();
    var format = "" + dateformat(now, "UTC:yyyy") + "-" 
        + dateformat(now, "UTC:mm") + "-" + dateformat(now, "UTC:dd")
        + "T" + dateformat(now, "UTC:HH");
    var minutes = now.getUTCMinutes();
    minutes = minutes - (minutes % 5);
    minutes = "" + minutes;
    if (minutes.length == 1)
        minutes = "0" + minutes;
    format += ":" + minutes + ":00";
    now = new Date(format);
    var expected = "" + dateformat(now, "UTC:yyyy") + dateformat(now, "UTC:mm")
        + dateformat(now, "UTC:dd") + "T" + dateformat(now, "UTC:HH") 
        + dateformat(now, "UTC:MM") + "00";
    test.equal(allDataStorage.currentInterval.start, expected);
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() sets previous interval start to previous 5 min for PT5M consolidation interval'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "PT5M"});
    // this test could break if crossing hour boundary, 
    var now = new Date();
    var format = "" + dateformat(now, "UTC:yyyy") + "-" 
        + dateformat(now, "UTC:mm") + "-" + dateformat(now, "UTC:dd")
        + "T" + dateformat(now, "UTC:HH");
    var minutes = now.getUTCMinutes();
    minutes = minutes - (minutes % 5);
    minutes = "" + minutes;
    if (minutes.length == 1)
        minutes = "0" + minutes;
    format += ":" + minutes + ":00";
    now = new Date(format);
    var min5 = 1000 * 60 * 5;
    now = new Date(now.getTime() - min5);
    var expected = "" + dateformat(now, "UTC:yyyy") + dateformat(now, "UTC:mm")
        + dateformat(now, "UTC:dd") + "T" + dateformat(now, "UTC:HH") 
        + dateformat(now, "UTC:MM") + "00";
    test.equal(allDataStorage.previousInterval.start, expected);
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() sets next interval start to next 5 min for PT5M consolidation interval'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "PT5M"});
    // this test could break if crossing midnight boundary, 
    var now = new Date();
    var format = "" + dateformat(now, "UTC:yyyy") + "-" 
        + dateformat(now, "UTC:mm") + "-" + dateformat(now, "UTC:dd")
        + "T" + dateformat(now, "UTC:HH");
    var minutes = now.getUTCMinutes();
    minutes = minutes - (minutes % 5);
    minutes = "" + minutes;
    if (minutes.length == 1)
        minutes = "0" + minutes;
    format += ":" + minutes + ":00";
    now = new Date(format);
    var min5 = 1000 * 60 * 5;
    now = new Date(now.getTime() + min5);
    var expected = "" + dateformat(now, "UTC:yyyy") + dateformat(now, "UTC:mm")
        + dateformat(now, "UTC:dd") + "T" + dateformat(now, "UTC:HH") 
        + dateformat(now, "UTC:MM") + "00";
    test.equal(allDataStorage.nextInterval.start, expected);
    allDataStorage.close(function () {
        test.done();
    });
};


test['new AllDataStorage() sets next interval end to after next 5 min for PT5M consolidation interval'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "PT5M"});
    // this test could break if crossing midnight boundary, 
    var now = new Date();
    var format = "" + dateformat(now, "UTC:yyyy") + "-" 
        + dateformat(now, "UTC:mm") + "-" + dateformat(now, "UTC:dd")
        + "T" + dateformat(now, "UTC:HH");
    var minutes = now.getUTCMinutes();
    minutes = minutes - (minutes % 5);
    minutes = "" + minutes;
    if (minutes.length == 1)
        minutes = "0" + minutes;
    format += ":" + minutes + ":00";
    now = new Date(format);
    var min10 = 1000 * 60 * 10;
    now = new Date(now.getTime() + min10);
    var expected = "" + dateformat(now, "UTC:yyyy") + dateformat(now, "UTC:mm")
        + dateformat(now, "UTC:dd") + "T" + dateformat(now, "UTC:HH") 
        + dateformat(now, "UTC:MM") + "00";
    test.equal(allDataStorage.nextInterval.end, expected);
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() sets up executing intervalCheck every minute'] = function (test) {
    test.expect(1);
    var allDataStorage = new AllDataStorage(TEMP_DIR);
    test.equal(allDataStorage.intervalCheckId._idleTimeout, 60000);
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() creates current interval leveldb'] = function (test) {
    test.expect(2);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "P1D"});
    // this test could break if crossing midnight boundary, 
    var now = new Date();
    var expected = "" + dateformat(now, "UTC:yyyy") + dateformat(now, "UTC:mm")
        + dateformat(now, "UTC:dd") + "T000000";
    test.ok(shelljs.test('-e', path.join(TEMP_DIR, expected, 'CURRENT')));
    // test.ok(shelljs.test('-e', path.join(TEMP_DIR, expected, 'LOG')));
    test.ok(shelljs.test('-e', path.join(TEMP_DIR, expected, 'LOCK')));
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() sets new current interval xor to all zeros and not valid'] = function (test) {
    test.expect(21);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "P1D"});
    for (var i = 0; i < allDataStorage.currentInterval.xor.length; i++) {
        test.equal(allDataStorage.currentInterval.xor[i], 0);
    };
    test.strictEqual(allDataStorage.currentInterval.xorValid, false);
    allDataStorage.close(function () {
        test.done();
    });
};


test['new AllDataStorage() creates previous interval leveldb'] = function (test) {
    test.expect(2);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "P1D"});
    // this test could break if crossing midnight boundary, 
    var now = new Date();
    var oneDay = 1000 * 60 * 60 * 24;
    now = new Date(now.getTime() - oneDay);    
    var expected = "" + dateformat(now, "UTC:yyyy") + dateformat(now, "UTC:mm")
        + dateformat(now, "UTC:dd") + "T000000";
    test.ok(shelljs.test('-e', path.join(TEMP_DIR, expected, 'CURRENT')));
    // test.ok(shelljs.test('-e', path.join(TEMP_DIR, expected, 'LOG')));
    test.ok(shelljs.test('-e', path.join(TEMP_DIR, expected, 'LOCK')));
    allDataStorage.close(function () {
        test.done();
    });
};

test['new AllDataStorage() sets new previous interval xor to all zeros and not valid'] = function (test) {
    test.expect(21);
    var allDataStorage = new AllDataStorage(TEMP_DIR, {consolidationInterval: "P1D"});
    for (var i = 0; i < allDataStorage.previousInterval.xor.length; i++) {
        test.equal(allDataStorage.previousInterval.xor[i], 0);
    };
    test.strictEqual(allDataStorage.previousInterval.xorValid, false);
    allDataStorage.close(function () {
        test.done();
    });
};