import type {APIRoute} from 'astro';
import {getContent} from '../lib/content';

export const GET: APIRoute = async ({site}) => {
  const {projects, demo} = await getContent();
  const paths = !demo && site ? ['/', ...projects.map(project => `/work/${project.slug}/`)] : [];
  const urls = paths.map(path => `<url><loc>${new URL(path, site).href.replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {headers: {'Content-Type': 'application/xml; charset=utf-8'}});
};
