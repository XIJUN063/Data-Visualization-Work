import pandas as pd

# 读取 CSV 文件
df = pd.read_csv('premier-player-23-24.csv')

# 将数据转换为 JSON 格式并保存
json_path = 'premier-player-23-24.json'
df.to_json(json_path, orient='records', indent=4)