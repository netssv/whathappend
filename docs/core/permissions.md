# Permissions Scope

We only ask for what we absolutely need (Manifest V3):

- **activeTab / tabs**: To know which site you want to audit.
- **storage**: To save your terminal history and settings locally.
- **scripting**: To read performance data or check for tracking pixels.
- **host_permissions**: To talk to DNS/RDAP servers and check headers:
  - `https://dns.google/*`
  - `https://rdap.org/*`
  - `https://crt.sh/*`
  - `https://isitdown.site/*`
  - `https://*/*`
  - `http://*/*`

[⬅ Return to Knowledge Map](../map.md)
