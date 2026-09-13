import re

with open(r'd:\projects\স্মার্ট ক্যাম্পাস\smart-campus\frontend\src\styles.css', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace variables block
variables_old = r'''  /\* Surface \*/
  --bg-base:   #090b18;
  --bg-raised: #0e1024;
  --bg-card:   rgba\(255,255,255,0\.035\);
  --bg-hover:  rgba\(255,255,255,0\.055\);
  --bg-input:  rgba\(255,255,255,0\.04\);

  /\* Text \*/
  --tx-primary:   #f0f4ff;
  --tx-secondary: #94a3b8;
  --tx-muted:     #4b5a70;
  --tx-link:      #818cf8;

  /\* Borders \*/
  --border:        rgba\(255,255,255,0\.07\);
  --border-hover:  rgba\(255,255,255,0\.14\);
  --border-focus:  rgba\(99,102,241,0\.55\);

  /\* Shadows \*/
  --shadow-card: 0 0 0 1px rgba\(255,255,255,0\.05\), 0 24px 64px rgba\(0,0,0,0\.65\);
  --shadow-glow: 0 0 48px rgba\(99,102,241,0\.18\);
  --shadow-btn:  0 4px 20px rgba\(99,102,241,0\.38\), 0 1px 0 rgba\(255,255,255,0\.10\) inset;'''

variables_new = '''  /* Surface */
  --bg-base:   #f8fafc;
  --bg-raised: #ffffff;
  --bg-card:   #ffffff;
  --bg-hover:  #f1f5f9;
  --bg-input:  #f8fafc;

  /* Text */
  --tx-primary:   #0f172a;
  --tx-secondary: #475569;
  --tx-muted:     #64748b;
  --tx-link:      #4f46e5;

  /* Borders */
  --border:        #e2e8f0;
  --border-hover:  #cbd5e1;
  --border-focus:  rgba(99,102,241,0.55);

  /* Shadows */
  --shadow-card: 0 1px 3px rgba(0,0,0,0.05), 0 4px 20px rgba(0,0,0,0.04);
  --shadow-glow: 0 0 32px rgba(99,102,241,0.12);
  --shadow-btn:  0 4px 14px rgba(99,102,241,0.25), 0 1px 0 rgba(255,255,255,0.40) inset;'''

content = re.sub(variables_old, variables_new, content, count=1)

# 2. Replace hardcoded dark backgrounds/gradients
content = content.replace('linear-gradient(170deg, #060818 0%, #08091f 55%, #060c1a 100%)', 'linear-gradient(170deg, #f8fafc 0%, #f1f5f9 55%, #e2e8f0 100%)')
content = content.replace('linear-gradient(180deg, #07091c 0%, #060819 100%)', 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)')
content = content.replace('rgba(9,11,24,0.88)', 'rgba(255,255,255,0.88)')
content = content.replace('background: #0f1223;', 'background: #ffffff;')

# 3. Replace rgba(255,255,255, 0.x) with rgba(15,23,42, 0.x) (which is a dark slate color suitable for light theme borders/bg)
# EXCEPT for the shadow-btn inset which was already replaced
content = re.sub(r'rgba\(255,255,255,([0-9.]+)\)', r'rgba(15,23,42,\1)', content)
# Fix up shadow-btn which we explicitly want white
content = content.replace('rgba(15,23,42,0.40) inset', 'rgba(255,255,255,0.40) inset')

# 4. In CampusGraph (main.jsx), we have dark theme stroke colors. Let's modify styles.css if needed, but we also need to fix main.jsx.
# Wait, I will write another script for main.jsx.

with open(r'd:\projects\স্মার্ট ক্যাম্পাস\smart-campus\frontend\src\styles.css', 'w', encoding='utf-8') as f:
    f.write(content)
