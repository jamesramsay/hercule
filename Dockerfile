FROM mhart/alpine-node:base

WORKDIR /hercule

# `npm pack` output
ADD hercule-*.tgz .

# production node_modules
ADD node_modules package/node_modules

ENV PATH="/hercule/package/bin:${PATH}"

CMD ["hercule", "-h"]
