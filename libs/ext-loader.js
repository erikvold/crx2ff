var tmp = require('tmp');
var fs = require('fs-extra');

var dlCrx = require('./utils/dl-crx');
var crxUnzip = require('./utils/unzip-crx');

var cwsIdRegex = /[a-z]{32}/;

var path = require('path');
var gitRegex = new RegExp('(' + path.sep + '|^)\\.git$');

function loadFromPath (extensionPath, readOnly, cb) {
    fs.lstat(extensionPath, function (error, stats) {
        if (error) {
            return cb(error);
        }

        if (!stats.isDirectory() && !extensionPath.match(/\.(crx|zip)$/)) {
            return cb(new Error("Path must point to a directory, crx or zip."));
        }

        if (stats.isDirectory() && readOnly) {
            // Just return the path when we're not planning to do modifications
            return cb(null, extensionPath);
        }


        tmp.dir({unsafeCleanup: true}, function (error, tmpPath) {
            if (error) {
                return cb(error);
            }

            var done = function (error) {
                if (error) {
                    return cb(error);
                }

                return cb(null, tmpPath);
            };

            var filter = function(currentPath) {
                var isGIT = gitRegex.test(currentPath);
                if (isGIT) {
                    console.warn('WARNING: skipping', currentPath);
                }
                return !isGIT;
            };

            // Copy extension directory into temporary one for modification
            if (stats.isDirectory()) {
                fs.copy(extensionPath, tmpPath, filter, done);
            } else {
                crxUnzip(extensionPath, tmpPath, done);
            }
        });
    });
}

function load (idOrPath, readOnly, cb) {
    if (idOrPath.match(cwsIdRegex)) {
        return dlCrx(idOrPath, function (error, crxPath) {
            if (error) {
                return cb(error);
            }

            return loadFromPath(crxPath, true, cb);
        });
    }

    return loadFromPath(idOrPath, readOnly, cb);
}

module.exports = load;
