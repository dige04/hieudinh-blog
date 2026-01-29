
# Đơn giản hóa trang Blog

## Tổng quan
Xóa 2 sidebar (trái và phải) khỏi trang `/blog`, chỉ giữ lại phần hero section ở trên cùng và làm cho nó có thể click để quay về trang chủ About (`/`).

## Thay đổi

### 1. Cập nhật `src/pages/Index.tsx`

**Xóa bỏ:**
- Import `LeftSidebar` và `RightSidebar`
- Component `<LeftSidebar />` và `<RightSidebar />` trong JSX
- Bỏ wrapper `<div className="flex">` vì không cần layout 3 cột nữa

**Cập nhật Hero Section:**
- Bọc phần profile (avatar + tên + bio) trong thẻ `<a href="/">` để click vào sẽ quay về trang About
- Thêm `cursor-pointer` và `hover:opacity-80` để người dùng biết có thể click được

### 2. Layout mới

```text
┌─────────────────────────────────────┐
│  👤 Hieu Dinh (click → về /)       │
│     Solopreneur                     │
│     [Social Links]                  │
├─────────────────────────────────────┤
│  🔍 Search   [Tags filter]          │
├─────────────────────────────────────┤
│  📄 Blog Post 1                     │
│  ─────────────────────────          │
│  📄 Blog Post 2                     │
│  ─────────────────────────          │
│  📄 Blog Post 3                     │
└─────────────────────────────────────┘
```

### 3. Chi tiết kỹ thuật

```tsx
// Xóa imports không cần
// import { LeftSidebar } from "@/components/blog/LeftSidebar";
// import { RightSidebar } from "@/components/blog/RightSidebar";

// Hero Section với link về trang chủ
<div className="hidden lg:block px-8 py-12 border-b border-border">
  <div className="max-w-2xl mx-auto">
    <a href="/" className="flex items-center gap-4 mb-6 hover:opacity-80 transition-opacity">
      <img 
        src={profile.avatar} 
        alt={profile.name}
        className="w-16 h-16 rounded-full object-cover"
      />
      <div>
        <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
        <p className="text-muted-foreground">{profile.bio}</p>
      </div>
    </a>
    <SocialLinks links={profile.social} />
  </div>
</div>

// Căn giữa nội dung chính vì không còn sidebar
<main className="flex-1 min-w-0 max-w-4xl mx-auto">
```

### 4. Cập nhật MobileHeader

Cũng cần làm cho phần profile trong mobile header có thể click về trang chủ.
