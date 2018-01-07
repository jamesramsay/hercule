import got from 'got';

export default function resolveHttpUrl(url) {
  // TODO: handle relative link in
  const isHttpUrl = /^https?:\/\//;
  if (!isHttpUrl.test(url)) return null;

  const content = got.stream(url);

  // Manually trigger error since 2XX respsonse doesn't trigger error despite not having expected content
  content.on('response', function error(res) {
    if (res.statusCode !== 200)
      this.emit('error', { message: 'Could not read file', path: url });
  });

  return { content, url };
}
