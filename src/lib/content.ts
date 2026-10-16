import {createClient} from '@sanity/client';
import {getYouTubeId} from './video';

export interface Project {
  _id: string;
  title: string;
  slug: string;
  category: string;
  year: number;
  description: string;
  credits?: string;
  videoUrl: string;
  thumbnail: {url: string; alt: string};
  featured?: boolean;
}

export interface Settings {
  name: string;
  tagline: string;
  introduction: string;
  about: string;
  email: string;
  location?: string;
  services: string[];
}

export interface Content {
  settings: Settings;
  projects: Project[];
  demo: boolean;
}

const demo: Content = {
  demo: true,
  settings: {
    name: 'GEO',
    tagline: 'Films with feeling.',
    introduction: 'A space for stories worth telling. Independent filmmaking, from the first idea to the final frame.',
    about: 'Every good film starts with a connection. This is a starter portfolio for sharing the people, places and ideas behind your work. Make it yours with your own story, films and images.',
    email: 'hello@example.com',
    location: 'Based in the UK · Available worldwide',
    services: ['Creative direction', 'Cinematography', 'Editing & colour'],
  },
  projects: [
    {
      _id: 'demo-1', title: 'The quiet between', slug: 'the-quiet-between',
      category: 'Documentary', year: 2026,
      description: 'A demonstration project for your portfolio layout. Replace this text, artwork and sample film with your own work in Sanity.',
      credits: 'Sample playback: Big Buck Bunny, Blender Foundation. This film is demonstration content, not portfolio work.',
      videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      thumbnail: {url: '/images/landscape.svg', alt: 'Illustrated mountain landscape in warm evening light'}, featured: true,
    },
    {
      _id: 'demo-2', title: 'A different rhythm', slug: 'a-different-rhythm',
      category: 'Brand film', year: 2026,
      description: 'A second demonstration project. Use this space to explain the brief, your approach and the story behind the finished film.',
      videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      credits: 'Sample playback: Big Buck Bunny, Blender Foundation.',
      thumbnail: {url: '/images/rhythm.svg', alt: 'Abstract architectural illustration with amber light'},
    },
    {
      _id: 'demo-3', title: 'Into the blue', slug: 'into-the-blue',
      category: 'Personal', year: 2025,
      description: 'A third demonstration project. The artwork and sample film are placeholders for your own photography and video.',
      videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      credits: 'Sample playback: Big Buck Bunny, Blender Foundation.',
      thumbnail: {url: '/images/ocean.svg', alt: 'Illustrated blue ocean under a pale horizon'},
    },
  ],
};

const query = `{
  "settings": *[_type == "siteSettings" && _id == "siteSettings"][0]{
    name, tagline, introduction, about, email, location, services
  },
  "projects": *[_type == "project"] | order(featured desc, order asc, year desc, title asc){
    _id, title, "slug": slug.current, category, year, description, credits,
    videoUrl, featured, "thumbnail": {"url": thumbnail.asset->url, "alt": thumbnail.alt}
  }
}`;

function assertText(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Missing or invalid Sanity field: ${field}`);
}

function validateContent(value: Omit<Content, 'demo'>): void {
  if (!value.settings) throw new Error('Publish the Website settings document in Sanity before building.');
  for (const key of ['name', 'tagline', 'introduction', 'about', 'email'] as const) {
    assertText(value.settings[key], `settings.${key}`);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.settings.email)) throw new Error('Invalid contact email in Sanity.');
  if (!Array.isArray(value.settings.services) || !value.settings.services.every(s => typeof s === 'string')) {
    throw new Error('Website settings must include a services list.');
  }
  if (!Array.isArray(value.projects)) throw new Error('Sanity projects response must be a list.');
  const slugs = new Set<string>();
  for (const project of value.projects) {
    for (const key of ['_id', 'title', 'slug', 'category', 'description', 'videoUrl'] as const) {
      assertText(project[key], `project.${key}`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug) || slugs.has(project.slug)) {
      throw new Error(`Invalid or duplicate project slug: ${project.slug}`);
    }
    slugs.add(project.slug);
    if (!Number.isInteger(project.year)) throw new Error(`Invalid year for ${project.title}`);
    if (!getYouTubeId(project.videoUrl)) throw new Error(`Invalid YouTube link for ${project.title}`);
    assertText(project.thumbnail?.alt, `${project.title}.thumbnail.alt`);
    assertText(project.thumbnail?.url, `${project.title}.thumbnail.url`);
    const image = new URL(project.thumbnail.url);
    if (image.protocol !== 'https:' || image.hostname !== 'cdn.sanity.io') throw new Error('Expected a Sanity image URL.');
  }
}

let contentPromise: Promise<Content> | undefined;

export function getContent(): Promise<Content> {
  return contentPromise ??= loadContent();
}

async function loadContent(): Promise<Content> {
  const projectId = import.meta.env.SANITY_PROJECT_ID;
  const dataset = import.meta.env.SANITY_DATASET;
  if (!projectId && !dataset) return demo;
  if (!projectId || !dataset) throw new Error('Set both SANITY_PROJECT_ID and SANITY_DATASET, or leave both empty for demo mode.');

  // Build-time only. Avoid the CDN so a webhook build reads fresh published content.
  // Fail a broken build rather than silently deploying demo content over a live site.
  const client = createClient({projectId, dataset, apiVersion: '2025-02-19', useCdn: false, perspective: 'published'});
  const result = await client.fetch<Omit<Content, 'demo'>>(query);
  validateContent(result);
  return {...result, demo: false};
}

export function imageUrl(url: string, width: number): string {
  if (url.startsWith('/')) return url;
  const image = new URL(url);
  image.searchParams.set('w', String(width));
  image.searchParams.set('auto', 'format');
  image.searchParams.set('fit', 'max');
  return image.toString();
}
