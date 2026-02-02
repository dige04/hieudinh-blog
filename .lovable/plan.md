

# Cải tiến Search & Profile Bio

## Tổng quan
1. Rút gọn bio thành "Solopreneur | AI Enthusiast"
2. Thay SearchBar thành icon tìm kiếm đậm, cùng hàng với categories
3. Click icon search sẽ mở fullscreen overlay với input và categories mờ phía dưới

## Chi tiết thay đổi

### 1. Cập nhật `src/data/blogData.ts`

Thay đổi bio trong profile:
```tsx
bio: "Solopreneur | AI Enthusiast"
```

### 2. Tạo component `SearchOverlay.tsx` mới

Component fullscreen khi click vào icon search:

```text
┌─────────────────────────────────────┐
│  ✕                                  │  <- Nút đóng
│                                     │
│  🔍 Tìm kiếm bài viết...           │  <- Input lớn, focus tự động
│                                     │
│  ░░ All ░░ Design ░░ React ░░      │  <- Categories mờ (opacity-50)
│                                     │
│  📄 Kết quả tìm kiếm...            │  <- Hiện kết quả real-time
└─────────────────────────────────────┘
```

### 3. Cập nhật `src/pages/Index.tsx`

Thay đổi section Search & Filter:

**Trước:**
```tsx
<div className="flex flex-col sm:flex-row sm:items-center gap-4">
  <div className="w-full sm:w-64">
    <SearchBar value={searchQuery} onChange={setSearchQuery} />
  </div>
  <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
    <TagFilter ... />
  </div>
</div>
```

**Sau:**
```tsx
<div className="flex items-center gap-3">
  {/* Search Icon Button */}
  <button 
    onClick={() => setIsSearchOpen(true)}
    className="p-2 hover:bg-secondary rounded-full transition-colors"
  >
    <Search className="h-5 w-5 stroke-[2.5]" />
  </button>
  
  {/* Categories - horizontal scroll */}
  <div className="flex-1 overflow-x-auto">
    <TagFilter ... />
  </div>
</div>

{/* Fullscreen Search Overlay */}
<SearchOverlay 
  isOpen={isSearchOpen} 
  onClose={() => setIsSearchOpen(false)}
  ... 
/>
```

### 4. Chi tiết `SearchOverlay.tsx`

```tsx
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

export function SearchOverlay({ ... }) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header with close button */}
      <div className="flex items-center justify-between p-4 border-b">
        <span className="text-lg font-medium">Tìm kiếm</span>
        <button onClick={onClose}>
          <X className="h-6 w-6" />
        </button>
      </div>
      
      {/* Search Input */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Tìm kiếm bài viết..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 text-lg bg-secondary rounded-lg"
          />
        </div>
      </div>
      
      {/* Categories - faded */}
      <div className="px-4 py-2 opacity-50">
        <TagFilter tags={tags} selectedTag={selectedTag} onTagSelect={onTagSelect} />
      </div>
      
      {/* Search Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {results.map(post => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
```

## Layout mới cho Filter Section

```text
Mọi thiết bị:
┌─────────────────────────────────────────┐
│  🔍  [All] [Design] [React] [Perf] →   │
│  ↑   └──────────── scroll ngang ──────→│
│  icon đậm                               │
└─────────────────────────────────────────┘

Click 🔍:
┌─────────────────────────────────────────┐
│  Tìm kiếm                          ✕   │
├─────────────────────────────────────────┤
│  🔍 Tìm kiếm bài viết...               │
│                                         │
│  ░ All ░ Design ░ React ░ (mờ 50%)     │
│                                         │
│  Kết quả:                               │
│  - Bài viết 1...                        │
│  - Bài viết 2...                        │
└─────────────────────────────────────────┘
```

## Tóm tắt files cần thay đổi

| File | Thay đổi |
|------|----------|
| `src/data/blogData.ts` | Cập nhật bio |
| `src/components/blog/SearchOverlay.tsx` | Tạo mới |
| `src/pages/Index.tsx` | Thay SearchBar bằng icon + SearchOverlay |

