import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SocialLinks } from "./SocialLinks";
import { cn } from "@/lib/utils";
import { profile } from "@/data/blogData";

interface RightSidebarProps {
  className?: string;
}

export function RightSidebar({ className }: RightSidebarProps) {
  return (
    <aside className={cn("w-72 border-l border-border bg-background min-h-screen sticky top-0 p-6 space-y-8", className)}>
      {/* Profile Card */}
      <div className="text-center">
        <img 
          src="/src/assets/avatar.jpg" 
          alt={profile.name}
          className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
        />
        <h3 className="font-semibold text-foreground mb-2">{profile.name}</h3>
        <p className="text-sm text-muted-foreground mb-4">{profile.bio}</p>
        <SocialLinks links={profile.social} size="sm" />
      </div>

      {/* Newsletter */}
      <div className="border border-border rounded-lg p-5">
        <h4 className="font-semibold text-foreground mb-2">Newsletter</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Đăng ký để nhận bài viết mới nhất.
        </p>
        <div className="space-y-3">
          <Input 
            type="email" 
            placeholder="Email của bạn"
            className="bg-background border-border"
          />
          <Button className="w-full">
            Đăng ký
          </Button>
        </div>
      </div>
    </aside>
  );
}
