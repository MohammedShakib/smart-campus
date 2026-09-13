import re
import os

# 1. Fix styles.css
css_path = r'd:\projects\স্মার্ট ক্যাম্পাস\smart-campus\frontend\src\styles.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

# Fix --accent-light being used for text links in light mode
css = css.replace('color: var(--accent-light);', 'color: var(--accent-dark);')
# Fix muted text contrast
css = css.replace('--tx-muted:     #64748b;', '--tx-muted:     #64748b;')
# Fix text secondary contrast
css = css.replace('--tx-secondary: #475569;', '--tx-secondary: #334155;')

# Ensure empty state and muted texts are visible
css = css.replace('color: rgba(15,23,42,0.6);', 'color: var(--tx-muted);')

# Ensure panels have a solid white background and subtle border
css = css.replace('background: rgba(15,23,42,0.02);', 'background: #ffffff; box-shadow: 0 1px 2px rgba(0,0,0,0.04); border: 1px solid var(--border);')
css = css.replace('background: rgba(15,23,42,0.03);', 'background: #f8fafc; border: 1px solid var(--border);')
css = css.replace('background: rgba(15,23,42,0.035);', 'background: #ffffff;')
css = css.replace('background: rgba(15,23,42,0.04);', 'background: #f1f5f9;')

# Fix table header background
css = css.replace('background: rgba(15,23,42,0.06);', 'background: #f1f5f9; color: var(--tx-secondary);')

# Fix auth shell background
css = css.replace('linear-gradient(170deg, #f8fafc 0%, #f1f5f9 55%, #e2e8f0 100%)', 'linear-gradient(170deg, #ffffff 0%, #f8fafc 55%, #f1f5f9 100%)')

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css)

# 2. Fix main.jsx SVG and colors
jsx_path = r'd:\projects\স্মার্ট ক্যাম্পাস\smart-campus\frontend\src\main.jsx'
with open(jsx_path, 'r', encoding='utf-8') as f:
    jsx = f.read()

# Make graph dots lighter so they don't overpower the light background
jsx = jsx.replace('fill="#94a3b8"', 'fill="#e2e8f0"')
# Make graph text darker so it's readable on light background
jsx = jsx.replace('fill="rgba(148,163,184,0.6)"', 'fill="#475569"')
# Make graph edges darker
jsx = jsx.replace('stroke="rgba(99,102,241,0.16)"', 'stroke="rgba(99,102,241,0.35)"')
# Fix hub node rings
jsx = jsx.replace('opacity="0.12"', 'opacity="0.3"')
jsx = jsx.replace('opacity="0.22"', 'opacity="0.5"')

with open(jsx_path, 'w', encoding='utf-8') as f:
    f.write(jsx)
