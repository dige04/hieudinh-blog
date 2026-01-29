import { useState, useMemo } from "react";
import { BlogCard } from "@/components/blog/BlogCard";
import { SearchBar } from "@/components/blog/SearchBar";
import { TagFilter } from "@/components/blog/TagFilter";
import { SocialLinks } from "@/components/blog/SocialLinks";
import { blogPosts, tags, profile } from "@/data/blogData";
import avatar from "@/assets/avatar.jpg";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");

  const filteredPosts = useMemo(() => {
    return blogPosts.filter((post) => {
      const matchesSearch = 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = selectedTag === "All" || post.tag === selectedTag;
      return matchesSearch && matchesTag;
    });
  }, [searchQuery, selectedTag]);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Hero Section - unified for all devices */}
        <div className="py-8 md:py-12 border-b border-border">
          <a href="/" className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 hover:opacity-80 transition-opacity">
            <img 
              src={avatar} 
              alt={profile.name}
              className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover flex-shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">{profile.name}</h1>
              <p className="text-sm md:text-base text-muted-foreground truncate">{profile.bio}</p>
            </div>
          </a>
          <SocialLinks links={profile.social} size="sm" />
        </div>

        {/* Search & Filter - unified responsive */}
        <div className="py-4 md:py-6 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-full sm:w-64">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <TagFilter tags={tags} selectedTag={selectedTag} onTagSelect={setSelectedTag} />
            </div>
          </div>
        </div>

        {/* Blog Posts List */}
        <div className="py-4 md:py-6">
          {filteredPosts.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Không tìm thấy bài viết nào.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
