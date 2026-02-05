import Image from 'next/image'
import Link from 'next/link'
import { Linkedin, Github, Instagram, AtSign, Mail, PenSquare, Podcast } from 'lucide-react'

const profile = {
  name: 'Hieu Dinh',
  bio: 'Solopreneur | AI Enthusiast',
  email: 'hi@hieudinh.dev',
  social: {
    linkedin: 'https://www.linkedin.com/in/dinhthanhhieu/',
    github: 'https://github.com/dige04',
    threads: 'https://threads.net/@to.hieuuu',
    instagram: 'https://instagram.com/to.hieuuu',
  },
}

export function LinkInBio() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] py-8 px-4">
      <main className="max-w-4xl mx-auto">
        {/* Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Profile Card - spans 2 columns */}
          <div className="col-span-2 row-span-2 bg-white rounded-3xl p-8 flex flex-col items-center justify-center border border-gray-200">
            <Image
              src="/avatar.jpg"
              alt={profile.name}
              width={120}
              height={120}
              className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover mb-4"
            />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center">
              {profile.name}
            </h1>
            <p className="text-gray-500 text-center mt-1">
              {profile.bio}
            </p>
          </div>

          {/* LinkedIn */}
          <a
            href={profile.social.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-3xl p-6 flex items-center justify-center border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <Linkedin className="w-10 h-10 md:w-12 md:h-12 text-gray-800" strokeWidth={1.5} />
          </a>

          {/* GitHub */}
          <a
            href={profile.social.github}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-3xl p-6 flex items-center justify-center border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <Github className="w-10 h-10 md:w-12 md:h-12 text-gray-800" strokeWidth={1.5} />
          </a>

          {/* Threads */}
          <a
            href={profile.social.threads}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-3xl p-6 flex items-center justify-center border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <AtSign className="w-10 h-10 md:w-12 md:h-12 text-gray-800" strokeWidth={1.5} />
          </a>

          {/* Instagram */}
          <a
            href={profile.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-3xl p-6 flex items-center justify-center border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <Instagram className="w-10 h-10 md:w-12 md:h-12 text-gray-800" strokeWidth={1.5} />
          </a>

          {/* Email - full width */}
          <a
            href={`mailto:${profile.email}`}
            className="col-span-2 md:col-span-4 bg-white rounded-3xl p-5 flex items-center justify-center gap-3 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <Mail className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
            <span className="text-gray-600">{profile.email}</span>
          </a>

          {/* Blog Link - full width */}
          <Link
            href="/blog"
            className="col-span-2 md:col-span-4 bg-white rounded-3xl p-5 flex items-center justify-center gap-3 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <PenSquare className="w-5 h-5 text-gray-800" strokeWidth={1.5} />
            <span className="text-gray-900 font-medium">Blog</span>
          </Link>

          {/* Podcast Link - full width */}
          <Link
            href="/podcast"
            className="col-span-2 md:col-span-4 bg-white rounded-3xl p-5 flex items-center justify-center gap-3 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <Podcast className="w-5 h-5 text-gray-800" strokeWidth={1.5} />
            <span className="text-gray-900 font-medium">Tech Digest Podcast</span>
          </Link>
        </div>
      </main>
    </div>
  )
}
