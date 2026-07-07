import os
import pandas as pd
import json
import glob

# Read all excel files in the 'data' folder
data_dir = os.path.join(os.path.dirname(__file__), 'data')
if not os.path.exists(data_dir):
    os.makedirs(data_dir)

excel_files = glob.glob(os.path.join(data_dir, "*.xlsx"))
if not excel_files:
    print(f"No excel files found in {data_dir}. Please add your excel files there.")
    import sys
    sys.exit(0)

dfs = []
for file in excel_files:
    sheet_dict = pd.read_excel(file, sheet_name=None)
    for sheet_name, df_sheet in sheet_dict.items():
        if 'Week' in sheet_name:
            df_sheet['Assigned Week'] = sheet_name.split('(')[0].strip()
        dfs.append(df_sheet)
df = pd.concat(dfs, ignore_index=True)

# Ensure start date is string, then parse
df['Start Date'] = pd.to_datetime(df['Start Date'], format='mixed', errors='coerce')
df = df.dropna(subset=['Start Date'])

# Sort by date
df = df.sort_values(by='Start Date')
min_date = df['Start Date'].min()

def determine_failure_type(reason):
    reason = str(reason).lower()
    if 'sfoc out' in reason:
        return 'SFOC out of range'
    elif 'scoc below' in reason:
        return 'SCOC below range'
    elif 'validation' in reason and ('aux' in reason or 'engine' in reason):
        return 'Aux Engine Validation'
    elif 'rule 7' in reason or 'reporting gap' in reason:
        return 'Reporting Gap (Rule 7)'
    else:
        return 'Other'

def assign_week(date):
    days_diff = (date - min_date).days
    week_num = min(4, (days_diff // 7) + 1)
    return f"Week {week_num}"

results = []

for _, row in df.iterrows():
    ftype = determine_failure_type(row['Reason'])
    week = row.get('Assigned Week')
    if pd.isna(week):
        week = assign_week(row['Start Date'])
    
    # Format date as dd-Mon-yy
    date_str = row['Start Date'].strftime('%d-%b-%y')
    
    results.append({
        'week': week,
        'date': date_str,
        'vessel': str(row.get('Ship Name', '')).strip().upper(),
        'report_type': str(row.get('Report Type', '')).strip(),
        'failure_type': ftype,
        'reason': str(row.get('Reason', ''))
    })

# Write to data.json
out_path = os.path.join(os.path.dirname(__file__), 'data.json')
with open(out_path, 'w') as f:
    json.dump(results, f, indent=4)

print(f"Data successfully written to {out_path}")
