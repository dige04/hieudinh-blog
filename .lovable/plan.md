
# Thêm Card Blog vào trang Link Bio

## Tổng quan
Thêm một card "Blog" vào bento grid của trang About (trang mặc định `/`) để người dùng có thể click vào đó và chuyển sang trang blog `/blog`. Đây sẽ giống như kiểu link-in-bio phổ biến.

## Thay đổi

### 1. Cập nhật trang About (`src/pages/About.tsx`)

**Thêm icon và card Blog:**
- Import thêm icon `PenSquare` từ lucide-react
- Thêm một card Blog mới vào bento grid với:
  - Kích thước: `col-span-2 md:col-span-4` (chiếm toàn bộ chiều ngang)
  - Icon bút + chữ "Blog" hoặc "Bài viết"
  - Link đến `/blog`
  - Style tương tự các card khác với hover effect

**Xóa link "Quay lại Blog":**
- Bỏ phần footer link vì không còn cần thiết nữa (trang About giờ là trang chính)

### 2. Vị trí card Blog trong grid

Đề xuất đặt card Blog ở cuối grid, sau card Email:

```text
┌─────────────────┬───────┬───────┐
│                 │Threads│GitHub │
│  Profile Card   ├───────┼───────┤
│                 │LinkedIn│Insta │
├────────┬────────┼───────┴───────┤
│Location│  Work  │               │
├────────┴────────┤               │
│      Email      │               │
├─────────────────┴───────────────┤
│           📝 Blog               │
└─────────────────────────────────┘
```

## Chi tiết kỹ thuật

```tsx
// Thêm import
import { PenSquare } from "lucide-react";

// Thêm card Blog sau Email card
<a 
  href="/blog"
  className="col-span-2 md:col-span-4 row-span-1 bg-background rounded-3xl p-6 flex items-center justify-center gap-3 border border-border hover:bg-muted/50 transition-colors group"
>
  <PenSquare className="w-5 h-5 text-foreground group-hover:scale-110 transition-transform" />
  <span className="text-foreground font-medium">Blog</span>
</a>
```
