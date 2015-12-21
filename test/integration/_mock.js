var nock = require('nock');

nock('http://github.com').get('/size.md').reply(200, 'big\n');

nock('http://github.com').get('/a.md').times(1).reply(200, ':[](http://github.com/b.md)\n');
nock('http://github.com').get('/b.md').times(2).reply(200, ':[](http://github.com/c.md)\n');
nock('http://github.com').get('/c.md').times(3).reply(200, ':[](http://github.com/d.md)\n');
nock('http://github.com').get('/d.md').times(4).reply(200, ':[](http://github.com/e.md)\n');
nock('http://github.com').get('/e.md').times(5).reply(200, ':[](http://github.com/f.md)\n');
nock('http://github.com').get('/f.md').times(6).reply(200, ':[](http://github.com/g.md)\n');
nock('http://github.com').get('/g.md').times(7).reply(200, 'done.\n');
