FROM n8nio/n8n:latest

USER root

RUN apk add --no-cache su-exec \
    && printf '#!/bin/sh\nmkdir -p /home/node/.n8n\nchown -R node:node /home/node/.n8n\nexec su-exec node n8n\n' > /fix-perms.sh \
    && chmod +x /fix-perms.sh

ENTRYPOINT ["/fix-perms.sh"]
