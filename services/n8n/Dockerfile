FROM n8nio/n8n:latest

USER root

RUN printf '#!/bin/sh\nchown -R node:node /home/node/.n8n\nexec su-exec node n8n\n' > /fix-perms.sh \
    && chmod +x /fix-perms.sh

ENTRYPOINT ["/fix-perms.sh"]
