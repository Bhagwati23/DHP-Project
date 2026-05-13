from flask import Flask, send_from_directory, jsonify
import pandas as pd
import json
import os
from flask_cors import CORS

app = Flask(__name__, static_folder='static')
CORS(app)


@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/data')
def send_data():
    json_path = 'data/precomputed_data.json'
    if not os.path.exists(json_path):
        preprocess_csv()
    with open(json_path, 'r') as f:
        return jsonify(json.load(f))

@app.route('/api/languages')
def send_languages():
    with open('data/precomputed_data.json', 'r') as f:
        data = json.load(f)
    all_languages = set()
    for row in data.values():
        all_languages.update(row.keys())
    return jsonify(sorted(list(all_languages)))

def preprocess_csv():
    df = pd.read_csv('data.csv')
    # df['timestamp'] = pd.to_datetime(df['timestamp'])
    df = df[df['timestamp'].str.contains(r'\d{4}-\d{2}-\d{2}', na=False)]
    df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
    df = df.dropna(subset=['timestamp']) 
    max_date = df['timestamp'].max()
    start_date = max_date - pd.DateOffset(years=10)

    df_filtered = df[(df['timestamp'] >= start_date) & (df['timestamp'] <= max_date)]
    # df_filtered = df.copy()
    df_filtered['tags'] = df_filtered['tags'].astype(str).fillna('')
    df_filtered['tags'] = df_filtered['tags'].str.split(',')
    df_exploded = df_filtered.explode('tags')
    df_exploded['tags'] = df_exploded['tags'].str.strip()
    df_exploded['year_month'] = df_exploded['timestamp'].dt.to_period('Y').astype(str)

    lang_counts = df_exploded.groupby(['year_month', 'tags']).size().reset_index(name='count')
    top_languages = lang_counts.groupby('tags')['count'].sum().nlargest(30).index
    df_top = lang_counts[lang_counts['tags'].isin(top_languages)]
    pivot_df = df_top.pivot(index='year_month', columns='tags', values='count').fillna(0)
    row_totals = pivot_df.sum(axis=1)
    pivot_df = pivot_df.div(row_totals, axis=0) * 100

    os.makedirs('data', exist_ok=True)
    pivot_df.to_json('data/precomputed_data.json', orient='index')

if __name__ == '__main__':
    preprocess_csv()  # Ensure data is ready
    app.run(debug=True)
