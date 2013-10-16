# alldata-storage-leveldb

_Stability: 1 - [Experimental](https://github.com/tristanls/stability-index#stability-1---experimental)_

[![NPM version](https://badge.fury.io/js/alldata-storage-leveldb.png)](http://npmjs.org/package/alldata-storage-leveldb)

LevelDB backed storage module for [AllData](https://github.com/tristanls/alldata), a distributed master-less write-once immutable event store database implementing "All Data" part of [Lambda Architecture](http://www.slideshare.net/nathanmarz/runaway-complexity-in-big-data-and-a-plan-to-stop-it).

## Usage

```javascript
var AllDataStorage = require('alldata-storage-leveldb');

var allDataStorage = new AllDataStorage('./db', {
    /* alldata-storage-leveldb options */
    consolidationInterval: "P1D",
    /* LevelDB options */
    cacheSize: 8 * 1024 * 1024,
    compression: true,
    keyEncoding: 'utf8',
    valueEncoding: 'json'    
});

allDataStorage.on('interval closed', function (pathToIntervalDb) {
    console.log('new read-only interval at ' + pathToIntervalDb); 
});

allDataStorage.put('20130927T005240652508858176', {foo: 'bar'}, function (error) {
    if (error) throw error;
});
```

## Test

    npm test

## Overview

AllDataStorage provides a storage implementation for AllData with some particular characteristics. 

### Consolidation Interval

Since AllData is a write-once immutable event store with keys generated by [alldata-keygen](https://github.com/tristanls/alldata-keygen), this means that all the keys will be tightly coupled to the time they were generated, as well as monotonically increasing. Therefore, it is assumed that the store will, over a small window of time, stop receiving keys coupled to some time in the past. For example, if it is 10am, it is assumed that storage will not receive keys created at 7am. However, it is assumed to be more likely that keys created at 9:55am could still be received. Because of this, the time interval, in which it is assumed to be likely that events in the past could still be received, is configurable as `consolidationInterval` option.

There are two time intervals open at any given time, the current interval, and the previous interval. This is to allow data that falls into the previous interval to still be collected. Once time passes and a new interval is entered, what used to be a previous interval is now no longer available to be written to and becomes read-only. This is illustrated below:

```
-------------------+------------------+
   prev interval   | current interval |
-------------------+------------------+
                                      ^
                                      |
                                     now

-------------------+-----------------------+------------------+
 ... READ ONLY ... |     prev interval     | current interval |
-------------------+-----------------------+------------------+
                                                              ^
                                                              |
                                                            later
```

When a previous interval turns read-only, the `interval closed` event is emitted.

Notice that the read-only portion of the store can now be packaged up in any way that is convenient to enable batch processing by other components of the Lambda Architecture. To support this use-case, AllDataStorage (LevelDB-based) creates a new LevelDB database for each consolidation interval.

On the boundary between intervals, there might be a condition when an event not far off into the "future" is created. In that case, a temporary "next" interval is created that will become the current interval once the time comes. Trying to insert future events beyond the next interval is an error.

```
+-----------------------+---------------------+-+-----------------------+
|     prev interval     |    current interval | |     next interval     |
+-----------------------+---------------------+-+-----------------------+
                                              ^
                                              |
                                             now
```

## Documentation

### AllDataStorage

**Public API**

  * [new AllDataStorage(location, \[options\])](#new-alldatastoragelocation-options)
  * [allDataStorage.close(\[callback\])](#alldatastorageclosecallback)
  * [allDataStorage.put(key, value, [options], callback)](#alldatastorageputkey-value-options-callback)
  * [Event 'interval closed'](#event-interval-closed)

#### new AllDataStorage(location, [options])

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
    * `consolidationInterval`: _String_ _(Default: `P1D`)_ ISO8601 duration specifying the length of a consolidation interval. For now, this is limited to one of: `P1D`, `PT3H`, `PT1H`, `PT15M`, `PT5M`.
    * `keyEncoding`: _String_ _(Default: `utf8`)_ Encoding for the key. One of
            `hex`, `utf8`, `ascii`, `binary`, `base64`, `ucs2`, `utf16le`, `json`.
    * `valueEncoding`: _String_ _(Default: `json`)_ Encoding for the key. One of
            `hex`, `utf8`, `ascii`, `binary`, `base64`, `ucs2`, `utf16le`, `json`. 

Creates a new LevelDB-backed AllDataStorage instance.

#### allDataStorage.close([callback])

  * `callback`: _Function_ _(Default: undefined)_ `function (error) {}` If provided a callback to call once storage is closed.

Closes storage.

#### allDataStorage.intervalCheck([now])

_**CAUTION: reserved for internal use**_

  * `now`: _Date_ _(Default: undefined)_ Time to use as "now" for interval rotation check.

When this method is executed, current time is compared with what consolidation intervals are currently available. If current time falls into the current interval, nothing happens. If current time is later than the current interval, the following happens:

  1. previous interval is closed and becomes read only
  2. current interval becomes previous interval
  3. next interval becomes current interval (and is created if needed)
  4. 'interval closed' event is emitted with path to the closed interval from `1`

Upon creation of a new AllDataStorage instance this method is scheduled to run at regular intervals.

#### allDataStorage.put(key, value, [options], callback)

  * `key`: _String_ AllData formatted key, example: `20130927T005240652508858176`.
  * `value`: _Object_ Event to put.
  * `options`: _Object_ _(Default: undefined)_ Optional options for this specific put operation.
    * `keyEncoding`: _String_ _(Default: undefined)_ _**CAUTION: not recommended**_ Alternative encoding for the key. One of: `hex`, `utf8`, `ascii`, `binary`, `base64`, `ucs2`, `utf16le`, `json`.
    * `sync`: _Boolean_ _(Default: false)_ Will force the Operating System to synchronize to disk prior to calling the `callback` with success.
    * `valueEncoding`: _String_ _(Default: undefined)_ _**CAUTION: not recommended**_ Alternative encoding for the value. One of: `hex`, `utf8`, `ascii`, `binary`, `base64`, `ucs2`, `utf16le`, `json`.
  * `callback`: _Function_ `function (error) {}` Callback to call with error or success.

During normal operation `keyEncoding` and `valueEncoding` "global" values will be used. It is not recommended to have different encodings for different puts to the same underlying LevelDB database.

If trying to `put` to a READ ONLY portion of the story, an error will be returned.

#### Event `interval closed`

  * `function (closedIntervalPath) {}`
    * `closedIntervalPath`: _String_ Path to LevelDB corresponding to the closed interval.

Emitted when an interval is closed and becomes read-only.

```javascript
allDataStorage.on('interval closed', function (closedIntervalPath) {
    console.log("interval " + closedIntervalPath + " closed"); 
});
```