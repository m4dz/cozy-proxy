// Generated by CoffeeScript 1.10.0
var Client, client, devices, dsHost, dsPort, extractCredentials, logger, sharings, updateCredentials,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Client = require('request-json').JsonClient;

logger = require('printit')({
  date: false,
  prefix: 'lib:remote_access'
});

devices = {};

sharings = {};

dsHost = 'localhost';

dsPort = '9101';

client = new Client("http://" + dsHost + ":" + dsPort + "/");

if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test") {
  client.setBasicAuth(process.env.NAME, process.env.TOKEN);
}

extractCredentials = module.exports.extractCredentials = function(header) {
  var authDevice, password, username;
  if (header != null) {
    authDevice = header.replace('Basic ', '');
    authDevice = new Buffer(authDevice, 'base64').toString('utf8');
    username = authDevice.substr(0, authDevice.indexOf(':'));
    password = authDevice.substr(authDevice.indexOf(':') + 1);
    return [username, password];
  } else {
    return ["", ""];
  }
};

updateCredentials = module.exports.updateCredentials = function(model, callback) {
  var cache, path;
  if (model === 'Device') {
    path = "request/device/all";
    devices = {};
    cache = devices;
  } else if (model === "Sharing") {
    path = "request/sharing/all";
    sharings = {};
    cache = sharings;
  } else {
    if (callback != null) {
      callback();
    }
  }
  return client.post(path, {}, function(err, res, results) {
    if ((err != null) || ((results != null ? results.error : void 0) != null)) {
      logger.error(err);
      return typeof callback === "function" ? callback(err) : void 0;
    } else {
      if (results != null) {
        results = results.map(function(result) {
          return result.id;
        });
        return client.post("request/access/byApp/", {}, function(err, res, accesses) {
          var access, i, len, ref;
          if (err != null) {
            logger.error(err);
            callback(err);
          } else {
            for (i = 0, len = accesses.length; i < len; i++) {
              access = accesses[i];
              if (ref = access.key, indexOf.call(results, ref) >= 0) {
                cache[access.value.login] = access.value.token;
              }
            }
          }
          return typeof callback === "function" ? callback() : void 0;
        });
      } else {
        return callback() != null;
      }
    }
  });
};

module.exports.isDeviceAuthenticated = function(header, callback) {
  var isPresent, login, password, ref;
  ref = extractCredentials(header), login = ref[0], password = ref[1];
  isPresent = (devices[login] != null) && devices[login] === password;
  if (isPresent || process.env.NODE_ENV === "development") {
    return callback(true);
  } else {
    return updateCredentials('Device', function() {
      return callback((devices[login] != null) && devices[login] === password);
    });
  }
};

module.exports.isSharingAuthenticated = function(header, callback) {
  var isPresent, login, password, ref;
  ref = extractCredentials(header), login = ref[0], password = ref[1];
  isPresent = (sharings[login] != null) && sharings[login] === password;
  if (isPresent || process.env.NODE_ENV === "development") {
    return callback(true);
  } else {
    return updateCredentials('Sharing', function() {
      return callback((sharings[login] != null) && sharings[login] === password);
    });
  }
};

module.exports.isTargetAuthenticated = function(credential, callback) {
  if (!((credential.shareID != null) && (credential.token != null))) {
    return callback(false);
  }
  return client.get("data/" + credential.shareID, function(err, result, doc) {
    var target;
    if (err || ((doc != null ? doc.targets : void 0) == null)) {
      return callback(false);
    } else {
      target = doc.targets.filter(function(t) {
        return t.token === credential.token || t.preToken === credential.token;
      });
      target = target[0];
      return callback(target != null, doc, target);
    }
  });
};
