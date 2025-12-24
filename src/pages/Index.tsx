import { useState, useMemo } from "react";
import { LeftSidebar } from "@/components/blog/LeftSidebar";
import { RightSidebar } from "@/components/blog/RightSidebar";
import { BlogCard } from "@/components/blog/BlogCard";
import { SearchBar } from "@/components/blog/SearchBar";
import { TagFilter } from "@/components/blog/TagFilter";
import { SocialLinks } from "@/components/blog/SocialLinks";
import { MobileHeader } from "@/components/blog/MobileHeader";
import { blogPosts, tags, profile } from "@/data/blogData";

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
      {/* Mobile Header */}
      <MobileHeader selectedTag={selectedTag} onTagSelect={setSelectedTag} />

      <div className="flex">
        {/* Left Sidebar - hidden on mobile */}
        <LeftSidebar className="hidden lg:block" />

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Hero Section - visible on desktop */}
          <div className="hidden lg:block px-8 py-12 border-b border-border">
            <div className="max-w-2xl">
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src={profile.avatar} 
                  alt={profile.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
                  <p className="text-muted-foreground">{profile.bio}</p>
                </div>
              </div>
              <SocialLinks links={profile.social} />
            </div>
          </div>

          {/* Search & Filter - Desktop */}
          <div className="hidden lg:block px-8 py-6 border-b border-border">
            <div className="flex items-center gap-6">
              <div className="w-72">
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
              </div>
              <TagFilter tags={tags} selectedTag={selectedTag} onTagSelect={setSelectedTag} />
            </div>
          </div>

          {/* Search - Mobile */}
          <div className="lg:hidden px-4 py-4">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>

          {/* Blog Posts List */}
          <div className="p-4 lg:px-8 lg:py-6">
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

        {/* Right Sidebar - hidden on mobile */}
        <RightSidebar className="hidden xl:block" />
      </div>
    </div>
  );
};

export default Index;
