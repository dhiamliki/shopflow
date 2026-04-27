import re

with open('notifications.page.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix corrupted content - ensure newlines after semicolons before import/from
content = content.replace(';import ', ';\nimport ')
content = content.replace(';from ', ';\nfrom ')

# Ensure import is present
if 'import { EmptyStateComponent }' not in content:
    content = content.replace(
        'import { SectionHeadingComponent } from',
        'import { SectionHeadingComponent } from'
    )

with open('notifications.page.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed notifications.page.ts')
