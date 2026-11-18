const {argument, family, finish, setting, tail, value, vlan} = require('../netlogin');

const clients = $ => seq('clients', tail($, finish($, 'details')));
const withPorts = ($, following) => argument($, 'port', value($, 'ports'), following);
const showVpif = $ => tail($,
  clients($),
  withPorts($, tail($, clients($))),
  argument($, 'vlan', vlan($), tail($, clients($), withPorts($, tail($, clients($))))),
);

const diagnosticSetting = $ => tail($, finish($, choice('actions', 'instant-port-mode')));
const clientAddress = $ => value($, 'mac_address');

const rules = () => family('debug', {
  clear: $ => tail($,
    argument($, 'dynamic-vlan', field('vlan', choice('all', $.word_or_string))),
    finish($, 'mac-cache'),
  ),
  configure: $ => tail($,
    seq('dot1x', tail($,
      argument($, 'eapolPktSendDelayInterval', value($, 'second')),
      seq('trace-level', tail($, finish($, choice('console', 'trace-buf')))),
    )),
    argument($, 'postAuthHitCount', value($, 'count')),
  ),
  create: $ => tail($,
    argument($, 'client', vlan($), optional(seq(value($, 'ports'), optional(seq(clientAddress($), optional($._arguments)))))),
    seq('dot1x-client', optional(seq(
      value($, 'target'),
      optional(seq(
        value($, 'address_or_ports'),
        tail($,
          finish($, choice('eap-identity', 'eap-ttls', 'eapol-start')),
          seq(clientAddress($), tail($, finish($, choice('eap-identity', 'eap-ttls', 'eapol-start')))),
        ),
      )),
    ))),
  ),
  delete: $ => tail($, argument($, 'mac-cache', clientAddress($))),
  disable: diagnosticSetting,
  enable: diagnosticSetting,
  feature: $ => tail($, argument($, choice('disable', 'enable'), value($, 'name'))),
  require: $ => tail($, argument($, 'nlvlan', setting($))),
  show: $ => tail($,
    finish($, choice('FA-VSA', 'mac-cache')),
    argument($, 'client', value($, 'ports'), optional(seq(clientAddress($), optional($._arguments)))),
    seq('dot1x-clients', tail($, withPorts($), argument($, 'vlan', vlan($), tail($, withPorts($))))),
    seq('pif', tail($, clients($), seq(value($, 'ports'), tail($, clients($))))),
    seq('vpif', showVpif($)),
    seq('vr', tail($, finish($, 'clients'), seq('detailed', tail($, finish($, 'clients'))))),
  ),
  'suppress-auth': $ => tail($, argument($, 'ports', value($, 'ports'), optional(seq(
    setting($),
    tail($, argument($, 'mac', clientAddress($))),
  )))),
});

module.exports = {rules};
