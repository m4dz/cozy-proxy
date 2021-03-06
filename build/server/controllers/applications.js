// Generated by CoffeeScript 1.8.0
var appManager, getProxy, localization;

appManager = require('../lib/app_manager');

getProxy = require('../lib/proxy').getProxy;

localization = require('../lib/localization_manager');

module.exports.app = function(req, res, next) {
  var appName, shouldStart;
  appName = req.params.name;
  req.url = req.url.substring(("/apps/" + appName).length);
  shouldStart = -1 === req.url.indexOf('socket.io');
  return appManager.ensureStarted(appName, shouldStart, function(err, port) {
    var error;
    if (err != null) {
      error = new Error(err.msg);
      error.status = err.code;
      error.template = {
        name: err.code === 404 ? 'not_found' : 'error_app',
        params: {
          polyglot: localization.getPolyglot()
        }
      };
      return next(error);
    } else {
      return getProxy().web(req, res, {
        target: "http://localhost:" + port
      });
    }
  });
};

module.exports.publicApp = function(req, res, next) {
  var appName, shouldStart;
  appName = req.params.name;
  req.url = req.url.substring(("/public/" + appName).length);
  req.url = "/public" + req.url;
  shouldStart = -1 === req.url.indexOf('socket.io');
  return appManager.ensureStarted(appName, shouldStart, function(err, port) {
    var error;
    if (err != null) {
      error = new Error(err.msg);
      error.status = err.code;
      error.template = {
        name: 'error_public',
        params: {
          polyglot: localization.getPolyglot()
        }
      };
      return next(error);
    } else {
      return getProxy().web(req, res, {
        target: "http://localhost:" + port
      });
    }
  });
};

module.exports.appWithSlash = function(req, res) {
  return res.redirect("" + req.url + "/");
};
