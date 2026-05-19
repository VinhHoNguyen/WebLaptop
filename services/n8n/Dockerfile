FROM n8nio/n8n:latest

USER root

RUN apt-get update -qq && apt-get install -y --no-install-recommends gosu \
    && rm -rf /var/lib/apt/lists/* \
    && printf '#!/bin/sh\nmkdir -p /home/node/.n8n\nchown -R node:node /home/node/.n8n\nexec gosu node n8n\n' > /fix-perms.sh \
    && chmod +x /fix-perms.sh

ENTRYPOINT ["/fix-perms.sh"]
