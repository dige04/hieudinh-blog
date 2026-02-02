import { useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { TagFilter } from "./TagFilter";
import { BlogCard } from "./BlogCard";
import { BlogPost } from "@/data/blogData";

interface Tag {
  name: string;
  color: 'default' | 'pink' | 'orange' | 'green' | 'blue' | 'purple' | 'yellow';
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  tags: Tag[];
  selectedTag: string;
  onTagSelect: (tag: string) => void;
  results: BlogPost[];
}

export function SearchOverlay({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  tags,
  selectedTag,
  onTagSelect,
  results,
}: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header with close button */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <span className="text-lg font-medium text-foreground">Tìm kiếm</span>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-secondary rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-foreground" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Tìm kiếm bài viết..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 text-lg bg-secondary text-foreground placeholder:text-muted-foreground rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Categories - faded */}
      <div className="px-4 py-2 opacity-50">
        <TagFilter tags={tags} selectedTag={selectedTag} onTagSelect={onTagSelect} />
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto px-4">
        {results.length > 0 ? (
          <div className="divide-y divide-border" onClick={onClose}>
            {results.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        ) : searchQuery ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Không tìm thấy bài viết nào.</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nhập từ khóa để tìm kiếm...</p>
          </div>
        )}
      </div>
    </div>
  );
}
