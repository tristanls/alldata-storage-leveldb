/*

index.js - "alldata-storage-leveldb": AllData LebelDB backed storage module

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

var Ack = require('ack'),
    dateformat = require('dateformat'),
    events = require('events'),
    levelup = require('levelup'),
    path = require('path'),
    util = require('util');

/*
  * `location`: _String_ Path to a directory where data will be stored.
  * `options`: _Object_ _(Default: undefined)_
    * `cacheSize`: _Integer_ _(Default: `8 * 1024 * 1024`)_ The size (in bytes
            and per interval) of the in-memory LRU cache with frequently used
            uncompressed block contents.
    * `compression`: _Boolean_ _(Default: `true`)_ If true, all compressible 
            data will be run through the Snappy compression algorithm before 
            being stored. Snappy is very fast and shouldn't gain much speed by 
            disabling so leave this on unless you have good reason to turn it 
            off.
    * `consolidationInterval`: _String_ _(Default: `P1D`)_ ISO8601 duration 
            specifying the length of a consolidation interval. For now, this
            is limited to one of: `P1D`, `PT3H`, `PT1H`, `PT15M`, `PT5M`.
    * `keyEncoding`: _String_ _(Default: `utf8`)_ Encoding for the key. One of
            `hex`, `utf8`, `ascii`, `binary`, `base64`, `ucs2`, `utf16le`, `json`.
    * `valueEncoding`: _String_ _(Default: `json`)_ Encoding for the key. One of
            `hex`, `utf8`, `ascii`, `binary`, `base64`, `ucs2`, `utf16le`, `json`.            
*/
var AllDataStorage = module.exports = function AllDataStorage (location, options) {
    var self = this;
    events.EventEmitter.call(self);

    options = options || {};

    self.cacheSize = options.cacheSize || 8 * 1024 * 1024;
    self.consolidationInterval = options.consolidationInterval || "P1D";
    self.compression = typeof options.compression === undefined ? true : options.compression;
    self.keyEncoding = options.keyEncoding || "utf8";
    self.location = location;
    self.valueEncoding = options.valueEncoding || "json";

    var now = new Date();

    self.currentInterval = {};

    self.currentInterval.start = "" + dateformat(now, "UTC:yyyy")
        + dateformat(now, "UTC:mm") + dateformat(now, "UTC:dd");

    // for easy calculations using new Date(self.currentIntervalStartDateFormat)
    self.currentInterval.startDateFormat = "" + dateformat(now, "UTC:yyyy") 
        + "-" + dateformat(now, "UTC:mm") + "-" + dateformat(now, "UTC:dd");

    // don't want to implement a full blown ISO8601 duration parser right now
    switch (self.consolidationInterval) {
        case "P1D":
            self.currentInterval.start += "T000000";
            self.currentInterval.startDateFormat += "T00:00:00";
            self.consolidationIntervalMilliseconds = 1000 * 60 * 60 * 24; // 1 day
            break;
        case "PT3H":
            var hours = now.getUTCHours();
            hours = hours - (hours % 3);
            hours = "" + hours;
            if (hours.length == 1) 
                hours = "0" + hours;
            self.currentInterval.start += "T" + hours + "0000";
            self.currentInterval.startDateFormat += "T" + hours + ":00:00";
            self.consolidationIntervalMilliseconds = 1000 * 60 * 60 * 3; // 3 hours
            break;
        case "PT1H":
            self.currentInterval.start += "T" + dateformat(now, "UTC:HH") + "0000";
            self.currentInterval.startDateFormat += 
                "T" + dateformat(now, "UTC:HH") + ":00:00";
            self.consolidationIntervalMilliseconds = 1000 * 60 * 60; // 1 hour
            break;
        case "PT15M":
            var hours = "" + now.getUTCHours();
            if (hours.length == 1)
                hours = "0" + hours;
            var minutes = now.getUTCMinutes();
            minutes = minutes - (minutes % 15);
            minutes = "" + minutes;
            if (minutes.length == 1)
                minutes = "0" + minutes;
            self.currentInterval.start += "T" + hours + minutes + "00";
            self.currentInterval.startDateFormat += "T" + hours + ":" + minutes + ":00";
            self.consolidationIntervalMilliseconds = 1000 * 60 * 15; // 15 minutes
            break;
        case "PT5M":
            var hours = "" + now.getUTCHours();
            if (hours.length == 1)
                hours = "0" + hours;
            var minutes = now.getUTCMinutes();
            minutes = minutes - (minutes % 5);
            minutes = "" + minutes;
            if (minutes.length == 1)
                minutes = "0" + minutes;
            self.currentInterval.start += "T" + hours + minutes + "00";
            self.currentInterval.startDateFormat += "T" + hours + ":" + minutes + ":00";
            self.consolidationIntervalMilliseconds = 1000 * 60 * 5; // 5 minutes
            break;
        default:
            throw new Error("Invalid consolidationInterval: " + self.consolidationInterval);
    }

    self.nextInterval = {};

    var nextIntervalStartDate = new Date(
        (new Date(self.currentInterval.startDateFormat)).getTime()
        + self.consolidationIntervalMilliseconds);
    self.nextInterval.start = "" + dateformat(nextIntervalStartDate, "UTC:yyyy")
        + dateformat(nextIntervalStartDate, "UTC:mm")
        + dateformat(nextIntervalStartDate, "UTC:dd")
        + "T" + dateformat(nextIntervalStartDate, "UTC:HH")
        + dateformat(nextIntervalStartDate, "UTC:MM")
        + "00";

    var nextIntervalEndDate = new Date(nextIntervalStartDate.getTime()
        + self.consolidationIntervalMilliseconds);
    self.nextInterval.end = "" + dateformat(nextIntervalEndDate, "UTC:yyyy")
        + dateformat(nextIntervalEndDate, "UTC:mm")
        + dateformat(nextIntervalEndDate, "UTC:dd")
        + "T" + dateformat(nextIntervalEndDate, "UTC:HH")
        + dateformat(nextIntervalEndDate, "UTC:MM")
        + "00";
    self.nextInterval.endDateFormat = "" 
        + dateformat(nextIntervalEndDate, "UTC:yyyy") + "-"
        + dateformat(nextIntervalEndDate, "UTC:mm") + "-"
        + dateformat(nextIntervalEndDate, "UTC:dd") + "T"
        + dateformat(nextIntervalEndDate, "UTC:HH") + ":"
        + dateformat(nextIntervalEndDate, "UTC:MM") + ":00";         

    self.previousInterval = {};

    var previousIntervalStartDate = new Date(
        (new Date(self.currentInterval.startDateFormat)).getTime()
        - self.consolidationIntervalMilliseconds);
    self.previousInterval.start = "" + dateformat(previousIntervalStartDate, "UTC:yyyy")
        + dateformat(previousIntervalStartDate, "UTC:mm")
        + dateformat(previousIntervalStartDate, "UTC:dd")
        + "T" + dateformat(previousIntervalStartDate, "UTC:HH")
        + dateformat(previousIntervalStartDate, "UTC:MM")
        + "00";

    // create new ack instance for tracking XORs
    self.ack = new Ack();

    self.currentInterval.interval = 
        levelup(path.join(self.location, self.currentInterval.start), {
            cacheSize: self.cacheSize,
            compression: self.compression,
            createIfMissing: true,
            errorIfExists: false,
            keyEncoding: self.keyEncoding,
            valueEncoding: self.valueEncoding
        });
    // need to abstract currentIntervalState so that across interval boundaries
    // all of it gets copied accordingly

    self.currentInterval.xor = new Buffer(20); // 160 bit buffer
    self.currentInterval.xor.fill(0);
    self.currentInterval.xorDirty = false;
    self.currentInterval.xorVerified = true;

    // // load existing interval from the database and update self.currentIntervalXor
    // self.currentInterval.interval.get('_xor', function (error, value) {
    //     if (error) {
    //         if (error.notFound) {
    //             // we already assumed all zeros to start with, so we now verified
    //             // that this is indeed the case
    //             self.currentIntervalXorVerified = true;
    //             return;
    //         }

    //         self.emit('error', error); // some other error occured
    //         return;
    //     }

    //     // we got the previous xor value
    //     // to update what we have in memory, xor it with what we got
    //     // make sure that 
    //     self.ack.stamp(self.currentIntervalStart)
    // });

    self.previousInterval.interval = 
        levelup(path.join(self.location, self.previousInterval.start), {
            cacheSize: self.cacheSize,
            compression: self.compression,
            createIfMissing: true,
            errorIfExists: false,
            keyEncoding: self.keyEncoding,
            valueEncoding: self.valueEncoding
        });

    // check if intervals shifted every minute
    self.intervalCheckId = setInterval(self.intervalCheck, 1000 * 60 * 1);
};

util.inherits(AllDataStorage, events.EventEmitter);

/*
  * `callback`: _Function_ _(Default: undefined)_ `function (error) {}` If
          provided a callback to call once storage is closed.
*/
AllDataStorage.prototype.close = function close (callback) {
    var self = this;

    var callbackCount = 0;

    if (self.previousInterval.interval)
        callbackCount++;

    if (self.currentInterval.interval)
        callbackCount++;

    if (self.nextInterval.interval)
        callbackCount++;

    if (self.previousInterval.interval) {
        self.previousInterval.interval.close(function (error) {
            callbackCount--;
            if (callbackCount == 0 && callback) 
                return callback(error);
        });
    }

    if (self.currentInterval.interval) {
        self.currentInterval.interval.close(function (error) {
            callbackCount--;
            if (callbackCount == 0 && callback)
                return callback(error);
        });
    }

    if (self.nextInterval.interval) {
        self.nextInterval.interval.close(function (error) {
            callbackCount--;
            if (callbackCount == 0 && callback)
                return callback(error);
        })
    }

    clearInterval(self.intervalCheckId);
};

/*
_**CAUTION: Reserved for internal use**_ 

  * `now`: _Date_ _(Default: undefined)_ Time to use as "now" for interval rotation check.
*/
AllDataStorage.prototype.intervalCheck = function intervalCheck (now) {
    var self = this;

    now = now || new Date();
    var nowString = "" + dateformat(now, "UTC:yyyy") + dateformat(now, "UTC:mm")
        + dateformat(now, "UTC:dd") + "T" + dateformat(now, "UTC:HH")
        + dateformat(now, "UTC:MM") + "00";

    if (nowString > self.nextInterval.start) {
        var closedIntervalPath = 
            path.join(self.location, self.previousInterval.start);

        self.previousInterval.interval.close(function (error) {
            // TODO: what to do in case of error here?
            self.emit('interval closed', closedIntervalPath);                   
        });

        self.previousInterval = self.currentInterval;
        self.currentInterval = self.nextInterval;

        if (!self.currentInterval.interval) {
            self.currentInterval.interval = levelup(
                path.join(self.location, self.currentInterval.start), {
                    cacheSize: self.cacheSize,
                    compression: self.compression,
                    createIfMissing: true,
                    errorIfExists: false,
                    keyEncoding: self.keyEncoding,
                    valueEncoding: self.valueEncoding
                });
        }

        self.nextInterval = { start: self.currentInterval.end };

        var nextIntervalEndDate = new Date(
            (new Date(self.currentInterval.endDateFormat)).getTime()
            + self.consolidationIntervalMilliseconds);
        self.nextInterval.end = "" + dateformat(nextIntervalEndDate, "UTC:yyyy")
            + dateformat(nextIntervalEndDate, "UTC:mm")
            + dateformat(nextIntervalEndDate, "UTC:dd")
            + "T" + dateformat(nextIntervalEndDate, "UTC:HH")
            + dateformat(nextIntervalEndDate, "UTC:MM")
            + "00";
        self.nextInterval.endDateFormat = "" 
            + dateformat(nextIntervalEndDate, "UTC:yyyy") + "-"
            + dateformat(nextIntervalEndDate, "UTC:mm") + "-"
            + dateformat(nextIntervalEndDate, "UTC:dd") + "T"
            + dateformat(nextIntervalEndDate, "UTC:HH") + ":"
            + dateformat(nextIntervalEndDate, "UTC:MM") + ":00";
    }
};

/*
  * `key`: _String_ AllData formatted key, example: `20130927T005240652508858176`.
  * `value`: _Object_ Event to put.
  * `options`: _Object_ _(Default: undefined)_ Optional options for this 
          specific put operation.
    * `keyEncoding`: _String_ _(Default: undefined)_ _**CAUTION: not recommended**_
            Alternative encoding for the key. One of: `hex`, `utf8`, `ascii`, 
            `binary`, `base64`, `ucs2`, `utf16le`, `json`.
    * `sync`: _Boolean_ _(Default: false)_ Will force the Operating System to
            synchronize to disk prior to calling the `callback` with success.
    * `valueEncoding`: _String_ _(Default: undefined)_ _**CAUTION: not recommended**_
            Alternative encoding for the value. One of: `hex`, `utf8`, `ascii`, 
            `binary`, `base64`, `ucs2`, `utf16le`, `json`.
  * `callback`: _Function_ `function (error) {}` Callback to call with error or
          success.
*/
AllDataStorage.prototype.put = function put (key, value, options, callback) {
    var self = this;

    // handle optionality of options
    if (typeof options === "function") {
        callback = options;
        options = {};
    }

    // check that we are writing within the allowable interval range
    if (key < self.previousInterval.start) {
        return callback(new Error("key " + key + " too old, last acceptable: " + 
            self.previousMarker));
    } else if (key > self.nextInterval.end) {
        return callback(new Error("key " + key + " too far into the future, " +
            "furthest acceptable: " + self.nextInterval.end));
    }

    var interval;

    // if we are writing into a future interval, assume we are close to interval
    // switch and create new interval if necessary and put data in it
    if (key > self.nextInterval.start) {
        if (!self.nextInterval.interval) {
            self.nextInterval.interval = 
                levelup(path.join(self.location, self.nextInterval.start), {
                    cacheSize: self.cacheSize,
                    compression: self.compression,
                    createIfMissing: true,
                    errorIfExists: false,
                    keyEncoding: self.keyEncoding,
                    valueEncoding: self.valueEncoding
                });
        }

        interval = self.nextInterval.interval;
    } else if (key > self.currentInterval.start) {
        interval = self.currentInterval.interval;
    } else if (key > self.previousInterval.start) {
        interval = self.previousInterval.interval;
    }

    interval.put(key, value, options, callback);
};