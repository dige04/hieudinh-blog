
# Thống nhất Layout Blog cho mọi thiết bị

## Vấn đề hiện tại
- Desktop (`lg:`) hiển thị Hero Section với avatar to, bio đầy đủ
- Mobile/Tablet (`<lg`) hiển thị MobileHeader với hamburger menu riêng
- Hai layout khác nhau tạo trải nghiệm không nhất quán

## Giải pháp
Tạo một layout duy nhất responsive cho tất cả thiết bị, giống như screenshot reference - tinh tế và nhất quán.

## Thay đổi

### 1. Cập nhật `src/pages/Index.tsx`

Thay thế 2 layout riêng biệt bằng một layout thống nhất:

```text
┌─────────────────────────────────────────┐
│  👤 Avatar  Hieu Dinh                   │
│             Solopreneur | Data & AI...  │
│                                         │
│  @ 🐙 in 📷 (social icons)             │
├─────────────────────────────────────────┤
│  🔍 Tìm kiếm...  [All][Design][React]..│
├─────────────────────────────────────────┤
│  DESIGN                      [thumbnail]│
│  Thiết kế UX/UI cho ứng dụng...        │
│  20 Dec 2024 • 5 min read              │
├─────────────────────────────────────────┤
│  ...                                    │
└─────────────────────────────────────────┘
```

**Thay đổi chi tiết:**
- Xóa `MobileHeader` component
- Tạo một Hero Section responsive hiển thị trên mọi kích thước màn hình
- Search và Tag filter trên cùng một hàng (wrap trên mobile)
- Padding responsive: `px-4 md:px-6 lg:px-8`

### 2. Xóa hoặc đơn giản hóa `MobileHeader.tsx`

Có thể xóa hoàn toàn component này vì không còn cần thiết.

### 3. Chi tiết code mới cho `Index.tsx`

```tsx
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
        {/* ... posts */}
      </div>
    </main>
  </div>
);
```

## Responsive Breakpoints

| Thiết bị | Breakpoint | Layout |
|----------|------------|--------|
| Mobile | < 640px | Avatar 48px, search full width, tags scroll ngang |
| Tablet | 640px - 1024px | Avatar 64px, search + tags cùng hàng |
| Desktop | > 1024px | Giống tablet, padding rộng hơn |

## Lợi ích
- Một codebase duy nhất cho mọi thiết bị
- Không cần hamburger menu phức tạp
- Trải nghiệm nhất quán như screenshot reference
- Dễ maintain hơn
