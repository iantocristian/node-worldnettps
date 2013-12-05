var _ = require('underscore');
var xml2js = require('xml2js');
var request = require('request');
var shasum = require('shasum');
var moment = require('moment');

module.exports = {

  defaults: {
    xmlgateway: 'https://testpayments.worldnettps.com/merchant/xmlpayment',
    datetimeformatstring: 'DD-MM-YYYY:HH:mm:ss:SSS'
  },

  WorldNetTPS: (function() {

    function WorldNetTPS(opts) {
      var key, value, _ref;
      this.options = {};
      _ref = module.exports.defaults;
      for (key in _ref) {
        if (!_.has(_ref, key)) continue;
        value = _ref[key];
        this.options[key] = value;
      }
      for (key in opts) {
        if (!_.has(opts, key)) continue;
        value = opts[key];
        this.options[key] = value;
      }
    };


    var setHash = function(obj, secret, keys) {
      var str = '';
      _.each(keys, function(key) {
        str += obj[key];
      });
      str += secret;

      obj['HASH'] = shasum(str, 'md5');
    };

    var verifyHash = function(obj, secret, keys) {
      var str = '';
      _.each(keys, function(key) {
        str += obj[key];
      });
      str += secret;

      return (obj['hash'] === shasum(str, 'md5'));
    }

    var buildXml = function(obj, rootName) {
      var xmlBuilder = new xml2js.Builder({
        rootName: rootName
      });
      return xmlBuilder.buildObject(obj);
    };

    var parseXml = function(str, cb) {
      var xmlParser = new xml2js.Parser({
        explicitArray: false,
        normalizeTags: true
      });
      xmlParser.parseString(str, cb);
    };

    var post = function(url, xmlstr, cb) {

      console.log(xmlstr);

      var reqbuffer = new Buffer(xmlstr);

      var req = request(url, {
          method: 'POST',
          headers: {
            'Content-Length': reqbuffer.length
          }
        },
        function(err, res, body) {
          console.log(body);

          cb(err, body);
        }
      );

      req.write(reqbuffer);
    };


    /**
     * Stored Subscription Creation Request
     *
     * @param params
     * @param cb
     */
    WorldNetTPS.prototype.addStoredSubscription = function(params, cb) {
      var reqobj = {
        'MERCHANTREF': params.merchantref,
        'TERMINALID': this.options.terminalid,
        'DATETIME': moment().format(this.options.datetimeformatstring),
        'NAME': params.name,
        'DESCRIPTION': params.description,
        'PERIODTYPE': params.periodtype,
        'LENGTH': params.length,
        'CURRENCY': params.currency,
        'RECURRINGAMOUNT': params.recurringamount,
        'INITIALAMOUNT': params.initialamount,
        'TYPE': params.type,
        'ONUPDATE': params.onupdate,
        'ONDELETE': params.ondelete
      };

      setHash(reqobj, this.options.secret,
        ['TERMINALID', 'MERCHANTREF', 'DATETIME', 'TYPE', 'NAME', 'PERIODTYPE', 'CURRENCY', 'RECURRINGAMOUNT', 'INITIALAMOUNT', 'LENGTH']);

      var reqstr = buildXml(reqobj, 'ADDSTOREDSUBSCRIPTION');

      post(this.options.xmlgateway, reqstr, function(err, resstr) {

          parseXml(resstr, function(err, resobj) {
            if (err) { return cb(err); }

            if (!_.isUndefined(resobj.error)) {
              cb(resobj.error);
            }
            else {
              cb(null, resobj.addstoredsubscriptionresponse);
            }
          });

      });
    };

    /**
     * Stored Subscription Update Request
     *
     * @param params
     * @param cb
     */
    WorldNetTPS.prototype.updateStoredSubscription = function(params, cb) {
      var reqobj = {
        'MERCHANTREF': params.merchantref,
        'TERMINALID': this.options.terminalid,
        'DATETIME': moment().format(this.options.datetimeformatstring),
        'NAME': params.name,
        'DESCRIPTION': params.description,
        'PERIODTYPE': params.periodtype,
        'LENGTH': params.length,
        'CURRENCY': params.currency,
        'RECURRINGAMOUNT': params.recurringamount,
        'INITIALAMOUNT': params.initialamount,
        'TYPE': params.type,
        'ONUPDATE': params.onupdate,
        'ONDELETE': params.ondelete
      };

      setHash(reqobj, this.options.secret,
        ['TERMINALID', 'MERCHANTREF', 'DATETIME', 'TYPE', 'NAME', 'PERIODTYPE', 'CURRENCY', 'RECURRINGAMOUNT', 'INITIALAMOUNT', 'LENGTH']);

      var reqstr = buildXml(reqobj, 'UPDATESTOREDSUBSCRIPTION');

      post(this.options.xmlgateway, reqstr, function(err, resstr) {

          parseXml(resstr, function(err, resobj) {
            if (err) { return cb(err); }

            if (!_.isUndefined(resobj.error)) {
              cb(resobj.error);
            }
            else {
              cb(null, resobj.updatestoredsubscriptionresponse);
            }
          });

      });
    };

    /**
     * Stored Subscription Deletion Request
     *
     * @param params
     * @param cb
     */
    WorldNetTPS.prototype.deleteStoredSubscription = function(params, cb) {
      var reqobj = {
        'MERCHANTREF': params.merchantref,
        'TERMINALID': this.options.terminalid,
        'DATETIME': moment().format(this.options.datetimeformatstring)
      };

      setHash(reqobj, this.options.secret,
        ['TERMINALID', 'MERCHANTREF', 'DATETIME']);

      var reqstr = buildXml(reqobj, 'DELETESTOREDSUBSCRIPTION');

      post(this.options.xmlgateway, reqstr, function(err, resstr) {

          parseXml(resstr, function(err, resobj) {
            if (err) { return cb(err); }

            if (!_.isUndefined(resobj.error)) {
              cb(resobj.error);
            }
            else {
              cb(null, resobj.deletestoredsubscriptionresponse);
            }
          });

      });
    };


    /**
     * Subscription Creation Request
     * Each subscription should be created based on some stored subscription. When new subscription is created
     * it name, description, set-up price, recurring price, length, periodtype and type are copied from the
     * corresponding stored subscription, most subscription fields can be changed by Subscription
     * Updating request.
     *
     * @param params: {
     *   merchantref
     *   storedsubscriptionref
     *   securecardmerchantref
     *   startdate (DD-MM-YYYY)
     *   enddate (DD-MM-YYYY) optional
     *   edccdecision (Y/N) optional
     * }
     * @param cb
     */
    WorldNetTPS.prototype.addSubscription = function(params, cb) {
      var reqobj = {
        'MERCHANTREF': params.merchantref,
        'TERMINALID': this.options.terminalid,
        'STOREDSUBSCRIPTIONREF': params.storedsubscriptionref,
        'SECURECARDMERCHANTREF': params.securecardmerchantref,
        'DATETIME': moment().format(this.options.datetimeformatstring),
        'STARTDATE': params.startdate
      };

      if (!_.isUndefined(params.enddate)) {
        reqobj['ENDDATE'] = params.enddate;
      }
      if (!_.isUndefined(params.edccdecision)) {
        reqobj['EDCCDECISION'] = params.edccdecision;
      }

      setHash(reqobj, this.options.secret,
        ['TERMINALID', 'MERCHANTREF', 'STOREDSUBSCRIPTIONREF', 'SECURECARDMERCHANTREF', 'DATETIME', 'STARTDATE']);

      var reqstr = buildXml(reqobj, 'ADDSUBSCRIPTION');

      post(this.options.xmlgateway, reqstr, function(err, resstr) {

          parseXml(resstr, function(err, resobj) {
            if (err) { return cb(err); }

            if (!_.isUndefined(resobj.error)) {
              cb(resobj.error);
            }
            else {
              cb(null, resobj.addsubscriptionresponse);
            }
          });

      });
    };

    /**
     * Subscription Updating Request
     *
     * @param params {
     *   merchantref
     *   securecardmerchantref
     *   startdate (DD-MM-YYYY) optional
     *   enddate (DD-MM-YYYY) optional
     *   edccdecision (Y/N) optional
     * }
     * @param cb
     */
    WorldNetTPS.prototype.updateSubscription = function(params, cb) {
      var reqobj = {
        'MERCHANTREF': params.merchantref,
        'TERMINALID': this.options.terminalid,
        'SECURECARDMERCHANTREF': params.securecardmerchantref,
        'DATETIME': moment().format(this.options.datetimeformatstring),
        'STARTDATE': params.startdate
      };

      if (!_.isUndefined(params.enddate)) {
        reqobj['ENDDATE'] = params.enddate;
      }
      if (!_.isUndefined(params.edccdecision)) {
        reqobj['EDCCDECISION'] = params.edccdecision;
      }

      setHash(reqobj, this.options.secret,
        ['TERMINALID', 'MERCHANTREF', 'SECURECARDMERCHANTREF', 'DATETIME', 'STARTDATE']);

      var reqstr = buildXml(reqobj, 'UPDATESUBSCRIPTION');

      post(this.options.xmlgateway, reqstr, function(err, resstr) {

          parseXml(resstr, function(err, resobj) {
            if (err) { return cb(err); }

            if (!_.isUndefined(resobj.error)) {
              cb(resobj.error);
            }
            else {
              cb(null, resobj.updatesubscriptionresponse);
            }
          });

      });
    };

    /**
     * Subscription Deletion Request
     *
     * @param params {
     *   merchantref
     * }
     * @param cb
     */
    WorldNetTPS.prototype.deleteSubscription = function(params, cb) {
      var reqobj = {
        'MERCHANTREF': params.merchantref,
        'TERMINALID': this.options.terminalid,
        'DATETIME': moment().format(this.options.datetimeformatstring)
      };

      setHash(reqobj, this.options.secret,
        ['TERMINALID', 'MERCHANTREF', 'DATETIME']);

      var reqstr = buildXml(reqobj, 'DELETESUBSCRIPTION');

      post(this.options.xmlgateway, reqstr, function(err, resstr) {

          parseXml(resstr, function(err, resobj) {
            if (err) { return cb(err); }

            if (!_.isUndefined(resobj.error)) {
              cb(resobj.error);
            }
            else {
              cb(null, resobj.deletesubscriptionresponse);
            }
          });

      });
    };

    /**
     * Subscription Payment Request
     * Manual subscription recurring payment can be done from the XML Gateway. If automatic subscription was not
     * paid automatically because of card details expiration or other issue it also can be paid in the same way
     * as manual after Secure Card issue was solved
     *
     * @param params {
     *   orderid
     *   subscriptionref
     *   amount (10 or 10.00)
     *   foreigncurrencyinformation optional(EDCC only)
     *   description optional
     *   email optional
     * }
     * @param cb
     */
    WorldNetTPS.prototype.subscriptionPayment = function(params, cb) {
      var self = this;

      var reqobj = {
        'ORDERID': params.orderid,
        'TERMINALID': this.options.terminalid,
        'AMOUNT': params.amount,
        'SUBSCRIPTIONREF': params.subscriptionref,
        'DESCRIPTION': params.description || null,
        'FOREIGNCURRENCYINFORMATION': params.foreigncurrencyinformation || null,
        'DATETIME': moment().format(self.options.datetimeformatstring),
        'EMAIL': params.email || null
      };

      _.each(_.keys(reqobj), function(key) {
        if (reqobj[key] === null) {
          delete reqobj[key];
        }
      });

      setHash(reqobj, self.options.secret,
        ['TERMINALID', 'ORDERID', 'SUBSCRIPTIONREF', 'AMOUNT', 'DATETIME']);

      var reqstr = buildXml(reqobj, 'SUBSCRIPTIONPAYMENT');

      post(self.options.xmlgateway, reqstr, function(err, resstr) {

          parseXml(resstr, function(err, resobj) {
            if (err) { return cb(err); }

            if (!_.isUndefined(resobj.error)) {
              cb(resobj.error);
            }
            else {
              if (verifyHash(_.extend({}, reqobj, resobj.subscriptionpaymentresponse),
                            self.options.secret,
                            ['TERMINALID', 'ORDERID', 'AMOUNT', 'datetime', 'responsecode', 'responsetext']))
              {
                cb(null, resobj.subscriptionpaymentresponse);
              }
              else {
                cb(new Error('Invalid response hash'));
              }
            }
          });

      });
    }


    return WorldNetTPS;

  })()

};