from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)

# Load dataset
data = pd.read_csv('data/jobs_data.csv')

# -----------------------------
# TOP DOMAINS
# -----------------------------
@app.route('/api/top-domains')
def top_domains():
    counts = data['Job Title'].value_counts().reset_index()
    counts.columns = ['domain', 'count']

    result = counts.to_dict(orient='records')
    return jsonify(result)


# -----------------------------
# SALARY INSIGHTS
# -----------------------------
@app.route('/api/salary-insights')
def salary_insights():

    grouped = data.groupby('Job Title').agg({
        'Min_Salary': 'min',
        'Max_Salary': 'max',
        'Avg_Salary': 'mean'
    }).reset_index()

    result = []

    for _, row in grouped.iterrows():
        result.append({
            'domain': row['Job Title'],
            'min_salary': int(row['Min_Salary']),
            'max_salary': int(row['Max_Salary']),
            'avg_salary': round(row['Avg_Salary'], 2)
        })

    return jsonify(result)


# -----------------------------
# JOBS BY CITY
# -----------------------------
@app.route('/api/jobs-by-city')
def jobs_by_city():

    counts = data['Location'].value_counts().reset_index()
    counts.columns = ['city', 'count']

    return jsonify(counts.to_dict(orient='records'))


# -----------------------------
# GET ALL DOMAINS
# -----------------------------
@app.route('/api/domains')
def get_domains():

    unique_domains = sorted(data['Job Title'].dropna().unique().tolist())
    return jsonify(unique_domains)


# -----------------------------
# GET ALL LOCATIONS
# -----------------------------
@app.route('/api/locations')
def get_locations():

    locations = sorted(data['Location'].unique().tolist())

    return jsonify(locations)


# -----------------------------
# COMPANY HIRING
# -----------------------------
@app.route('/api/company-hiring')
def company_hiring():

    if 'Company Name' in data.columns:

        counts = data['Company Name'].value_counts().head(10).reset_index()
        counts.columns = ['company', 'count']

    else:

        counts = pd.DataFrame([
            {
                "company": "Various Companies",
                "count": len(data)
            }
        ])

    return jsonify(counts.to_dict(orient='records'))


# -----------------------------
# SALARY RANGES
# -----------------------------
@app.route('/api/salary-ranges')
def salary_ranges():

    grouped = data.groupby('Job Title').agg({
        'Min_Salary': 'mean',
        'Max_Salary': 'mean',
        'Avg_Salary': 'mean'
    }).reset_index()

    result = []

    for _, row in grouped.iterrows():

        result.append({
            "domain": row['Job Title'],
            "min_salary": round(row['Min_Salary'], 2),
            "max_salary": round(row['Max_Salary'], 2),
            "avg_salary": round(row['Avg_Salary'], 2)
        })

    return jsonify(result)


# -----------------------------
# FILTER DATA
# -----------------------------
@app.route('/api/filter-data')
def filter_data():

    filtered = data.copy()

    domain = request.args.get('domain')
    location = request.args.get('location')
    min_salary = request.args.get('min_salary')

    # FILTER DOMAIN
    if domain and domain != 'All':
        filtered = filtered[
            filtered['Job Title'].str.lower() == domain.lower()
        ]

    # FILTER LOCATION
    if location and location != 'All':
        filtered = filtered[
            filtered['Location'].str.lower() == location.lower()
        ]

    # FILTER SALARY
    if min_salary:
        filtered = filtered[
            filtered['Avg_Salary'] >= float(min_salary)
        ]

    result = []

    for _, row in filtered.iterrows():

        result.append({
            "job_title": row.get('Job Title', ''),
            "location": row.get('Location', ''),
            "avg_salary": row.get('Avg_Salary', 0),
            "min_salary": row.get('Min_Salary', 0),
            "max_salary": row.get('Max_Salary', 0)
        })

    return jsonify(result)


# -----------------------------
# COMPARE DOMAINS
# -----------------------------
@app.route('/api/compare-domains')
def compare_domains():

    domain1 = request.args.get('domain1')
    domain2 = request.args.get('domain2')

    d1 = data[data['Job Title'] == domain1]
    d2 = data[data['Job Title'] == domain2]

    result = {
        "domain1": {
            "name": domain1,
            "avg_salary": round(d1['Avg_Salary'].mean(), 2) if not d1.empty else 0,
            "count": len(d1),

            "top_companies": {},
            "top_locations": d1['Location'].value_counts().head(3).to_dict()
        },

        "domain2": {
            "name": domain2,
            "avg_salary": round(d2['Avg_Salary'].mean(), 2) if not d2.empty else 0,
            "count": len(d2),

            "top_companies": {},
            "top_locations": d2['Location'].value_counts().head(3).to_dict()
        }
    }

    return jsonify(result)


# -----------------------------
# KEY INSIGHTS
# -----------------------------
@app.route('/api/key-insights')
def key_insights():

    top_domain_data = data['Job Title'].value_counts()

    top_domain = top_domain_data.idxmax()
    top_domain_count = int(top_domain_data.max())

    top_location_data = data['Location'].value_counts()

    top_location = top_location_data.idxmax()

    top_company = "Various Companies"

    avg_salary = round(data['Avg_Salary'].mean(), 2)

    highest_salary_row = data.loc[data['Avg_Salary'].idxmax()]

    highest_paying_domain = highest_salary_row['Job Title']
    highest_salary = round(highest_salary_row['Avg_Salary'], 2)

    insights = {
    "total_domains": int(data['Job Title'].nunique()),
    "total_listings": int(len(data)),
    "total_companies": int(data['Job Title'].nunique()),
    "top_domain": top_domain,
    "top_domain_count": top_domain_count,
    "top_company": top_company,
    "top_location": top_location,
    "avg_salary": avg_salary,

    "highest_paying_domain": highest_paying_domain,
    "highest_salary": highest_salary,

    "most_in_demand_domain": top_domain,
    "most_in_demand_count": top_domain_count
    }

    return jsonify(insights)


# -----------------------------
# RUN SERVER
# -----------------------------
if __name__ == '__main__':
    app.run(debug=True, port=8000)