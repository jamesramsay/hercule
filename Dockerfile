FROM mhart/alpine-node

RUN npm install -g hercule@latest

CMD ["hercule"]
