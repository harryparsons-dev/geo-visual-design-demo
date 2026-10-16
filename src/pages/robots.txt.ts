import type {APIRoute} from 'astro';
import {getContent} from '../lib/content';

export const GET: APIRoute = async ({site}) => {
  const {demo} = await getContent();
  const body = demo ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\n${site ? `Sitemap: ${new URL('/sitemap.xml', site)}\n` : ''}`;
  return new Response(body, {headers: {'Content-Type': 'text/plain; charset=utf-8'}});
};
