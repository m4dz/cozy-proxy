// Generated by CoffeeScript 1.10.0
var Client, bcrypt, log;

bcrypt = require('bcrypt');

Client = require('request-json').JsonClient;

log = require('printit')({
  date: false,
  prefix: 'lib:helpers'
});

module.exports.cryptPassword = function(password) {
  var hash, salt;
  salt = bcrypt.genSaltSync(10);
  hash = bcrypt.hashSync(password, salt);
  return {
    hash: hash,
    salt: salt
  };
};

module.exports.sendResetEmail = function(instance, user, key, callback) {
  var client, data, localization;
  localization = require('./localization_manager');
  data = {
    from: localization.t('reset password email from', {
      domain: instance.domain
    }),
    subject: localization.t('reset password email subject'),
    content: localization.t('reset password email text', {
      domain: instance.domain,
      key: key
    })
  };
  client = new Client("http://localhost:9101/");
  if (process.env.NODE_ENV === "production") {
    client.setBasicAuth(process.env.NAME, process.env.TOKEN);
  }
  return client.post("mail/to-user/", data, function(err, res, body) {
    if ((err == null) && ((body != null ? body.error : void 0) != null)) {
      err = body.error;
    }
    if (err != null) {
      log.error(err);
    }
    return callback(err);
  });
};

module.exports.checkEmail = function(email) {
  var re;
  re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return (email != null) && email.length > 0 && re.test(email);
};

module.exports.hideEmail = function(email) {
  return email.split('@')[0].replace('.', ' ').replace('-', ' ');
};
