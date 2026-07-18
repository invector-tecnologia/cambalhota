import sys
content = open("src/tui/app.nim").read()

# Replace menu items
content = content.replace(
    'let menuItems = @[" 1. Config ", " 2. Backup ", " 3. Restore ", " 4. History "]',
    'let menuItems = @[" 1. Config ", " 2. Backup ", " 3. Restore ", " 4. Cloud ", " 5. History "]'
)

# Replace other occurrences of 3 to 4 for History index
content = content.replace('selectedMenu == 3', 'selectedMenu == 4')
content = content.replace('selectedMenu < 3', 'selectedMenu < 4')

# Add cloud states
content = content.replace(
    'listStHistory: ListState',
    'listStCloudProv: ListState\n    listStHistory: ListState'
)
content = content.replace(
    'historyFilesIdx = 0',
    'historyFilesIdx, cloudProvIdx = 0'
)

content = content.replace(
    'let historyList = listRestoreHistory()',
    'let historyList = listRestoreHistory()\n    let cloudProvs = listCloudProviders()'
)

# And so on. This might be too complex for a script. I will do it manually.
open("src/tui/app.nim", "w").write(content)
