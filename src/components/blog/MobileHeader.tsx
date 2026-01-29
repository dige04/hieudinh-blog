import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SocialLinks } from "./SocialLinks";
import { TagFilter } from "./TagFilter";
import { profile, tags } from "@/data/blogData";
import avatar from "@/assets/avatar.jpg";

interface MobileHeaderProps {
  selectedTag: string;
  onTagSelect: (tag: string) => void;
}

export function MobileHeader({ selectedTag, onTagSelect }: MobileHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img 
            src={avatar} 
            alt={profile.name}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
          <span className="font-semibold text-sm truncate">{profile.name}</span>
        </a>
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 p-6">
            {/* Profile */}
            <div className="text-center mb-8">
              <a href="/" className="inline-block hover:opacity-80 transition-opacity">
                <img 
                  src={avatar} 
                  alt={profile.name}
                  className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="font-semibold text-foreground mb-2">{profile.name}</h3>
              </a>
              <p className="text-sm text-muted-foreground mb-4">{profile.bio}</p>
              <SocialLinks links={profile.social} size="sm" />
            </div>

            {/* Menu */}
            <nav className="space-y-2">
              <a href="/" className="block px-4 py-2 rounded-lg hover:bg-accent text-sm font-medium">Trang chủ</a>
              <a href="/blog" className="block px-4 py-2 rounded-lg hover:bg-accent text-sm font-medium">Bài viết</a>
            </nav>
          </SheetContent>
        </Sheet>
      </header>

      {/* Tags horizontal scroll */}
      <div className="px-4 py-3 border-b border-border overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          <TagFilter tags={tags} selectedTag={selectedTag} onTagSelect={onTagSelect} />
        </div>
      </div>
    </div>
  );
}
