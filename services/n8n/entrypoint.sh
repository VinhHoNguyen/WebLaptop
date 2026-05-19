#!/bin/sh
mkdir -p /home/node/.n8n /home/node/.cache
chown -R node:node /home/node
exec su -s /bin/sh -c "exec n8n" node
