# Icons

SVG icons for the Cigar Platform app.

## Usage

Icons are loaded dynamically using the `IconDirective`:

```html
<!-- In any component -->
<i name="spinner" class="w-5 h-5 animate-spin"></i>
<i name="check" class="w-4 h-4 text-success-500"></i>
<i name="search" class="w-6 h-6"></i>
```

## Adding New Icons

1. Add your SVG file to this directory (e.g., `new-icon.svg`)
2. Remove any hardcoded `width` and `height` attributes from the SVG
3. Use `currentColor` for stroke/fill to allow color customization via CSS
4. **IMPORTANT**: Add the icon name to the `IconName` type in `shared/ui/src/lib/directives/icon/icon.directive.ts` for autocomplete support
5. Use the icon by its filename (without .svg extension)

```html
<i name="new-icon" class="w-5 h-5 text-gold-500"></i>
```

**Example of updating IconName type:**
```typescript
// In shared/ui/src/lib/directives/icon/icon.directive.ts
export type IconName =
  | 'spinner'
  | 'check'
  | 'new-icon'  // ← Add your new icon here
  | ...;
```

## Available Icons

- `spinner.svg` - Loading spinner
- `check.svg` - Checkmark
- `x.svg` - Close/Cancel
- `chevron-down.svg` - Chevron down
- `search.svg` - Search/Magnifying glass
- `user.svg` - User profile
- `menu.svg` - Hamburger menu

## Icon Guidelines

- Use Heroicons or similar for consistency
- Keep SVGs optimized (use SVGO)
- Use 24x24 viewBox for consistency
- Use `stroke-width="2"` for line icons
- Always use `currentColor` for themability
