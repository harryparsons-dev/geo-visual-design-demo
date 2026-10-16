import {test} from 'node:test';
import assert from 'node:assert/strict';
import {getYouTubeId} from '../src/lib/video.ts';

test('extracts video IDs from supported YouTube links', () => {
  for (const url of [
    'https://www.youtube.com/watch?v=aqz-KE-bpKQ&t=10',
    'https://youtu.be/aqz-KE-bpKQ?si=example',
    'https://m.youtube.com/watch?v=aqz-KE-bpKQ',
    'https://youtube.com/shorts/aqz-KE-bpKQ',
    'https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ',
    'https://youtube.com/live/aqz-KE-bpKQ',
  ]) assert.equal(getYouTubeId(url), 'aqz-KE-bpKQ');
});

test('rejects unsafe origins, non-video links and malformed input', () => {
  for (const url of [
    '', '<iframe src="https://youtube.com"></iframe>',
    'javascript:alert(1)', 'http://youtu.be/aqz-KE-bpKQ',
    'https://youtube.com.evil.test/watch?v=aqz-KE-bpKQ',
    'https://evil.test/aqz-KE-bpKQ',
    'https://youtube.com/playlist?list=aqz-KE-bpKQ',
    'https://youtu.be/too-short', 'https://youtu.be/aqz-KE-bpKQ/extra',
    'https://user:password@youtube.com/watch?v=aqz-KE-bpKQ',
    'https://youtube.com:8080/watch?v=aqz-KE-bpKQ',
  ]) assert.equal(getYouTubeId(url), null);
});
