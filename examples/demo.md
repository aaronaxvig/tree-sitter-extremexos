# Switch setup process #

Here is an example set of steps for setting up a switch:

```exos
configure snmp sysName "BuildingA-5320"
configure snmp sysLocation "Building A IDF"
configure snmp sysContact "Internal Network Admins"
configure timezone -360 autodst

create vlan "printers" tag 185
configure vlan "printers" add ports 1-5,25-29 untagged
```

## Verification ##

Confirm that the VLAN was created:

```exos
show vlan
```
