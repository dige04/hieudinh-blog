import type { GlobalConfig } from 'payload'

export const SiteConfig: GlobalConfig = {
  slug: 'site-config',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      defaultValue: 'Hieu Dinh',
    },
    {
      name: 'bio',
      type: 'text',
      defaultValue: 'Software Engineer exploring AI',
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'location',
      type: 'text',
    },
    {
      name: 'work',
      type: 'text',
    },
    {
      name: 'social',
      type: 'group',
      fields: [
        { name: 'threads', type: 'text' },
        { name: 'github', type: 'text' },
        { name: 'linkedin', type: 'text' },
        { name: 'instagram', type: 'text' },
      ],
    },
  ],
}
