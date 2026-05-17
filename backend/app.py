from flask import Flask, jsonify, request
import pandas as pd
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

data = pd.read_csv('data/jobs_data.csv')

@app.route('/jobs-by-title')
def jobs_by_title():
    counts = data['Job Title'].value_counts().reset_index()
    counts.columns = ['label', 'count']
    return jsonify(counts.to_dict(orient='records'))

@app.route('/jobs-by-location')
def jobs_by_location():
    counts = data['Location'].value_counts().reset_index()
    counts.columns = ['label', 'count']
    return jsonify(counts.to_dict(orient='records'))

@app.route('/jobs-by-salary')
def jobs_by_salary():
    grouped = data.groupby('Job Title').agg({
        'Min_Salary': 'min',
        'Max_Salary': 'max',
        'Avg_Salary': 'mean'
    }).reset_index()

    result = []
    for _, row in grouped.iterrows():
        result.append({
            'title': row['Job Title'],
            'min_salary': row['Min_Salary'],
            'max_salary': row['Max_Salary'],
            'avg_salary': round(row['Avg_Salary'], 2)
        })
    return jsonify(result)

@app.route('/job-trends')
def job_trends():
    job_title = request.args.get('job_title')
    
    if job_title:
        # Filter data for specific job title
        filtered = data[data['Job Title'] == job_title]
        # Group by location and count
        trends = filtered.groupby('Location').size().reset_index(name='count')
    else:
        # Default view - show all jobs grouped by location
        trends = data.groupby(['Job Title', 'Location']).size().reset_index(name='count')
    
    # Convert to required format
    result = []
    if job_title:
        for _, row in trends.iterrows():
            result.append({
                'location': row['Location'],
                'count': int(row['count'])
            })
    else:
        for _, row in trends.iterrows():
            result.append({
                'job': row['Job Title'],
                'location': row['Location'],
                'count': int(row['count'])
            })
    
    return jsonify(result)


if __name__ == '__main__':
    app.run(debug=True)