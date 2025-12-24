import { Home, User, Mail, PenSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeftSidebarProps {
  className?: string;
}

const menuItems = [
  { icon: Home, label: "Trang chủ", href: "/" },
  { icon: PenSquare, label: "Bài viết", href: "/blog" },
  { icon: User, label: "Giới thiệu", href: "/about" },
  { icon: Mail, label: "Liên hệ", href: "/contact" },
];

export function LeftSidebar({ className }: LeftSidebarProps) {
  return (
    <aside className={cn("w-16 lg:w-56 border-r border-border bg-sidebar min-h-screen sticky top-0", className)}>
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="hidden lg:block text-sm font-medium">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
