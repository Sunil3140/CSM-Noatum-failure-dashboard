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

exclude_vessels = ['abu samrah', 'super fast beleares', 'superfast baleares']

dfs = []
for file in excel_files:
    sheet_dict = pd.read_excel(file, sheet_name=None)
    for sheet_name, df_sheet in sheet_dict.items():
        if 'Week' in sheet_name:
            df_sheet['Assigned Week'] = sheet_name.split('(')[0].strip()
            dfs.append(df_sheet)

if not dfs:
    print("No sheets containing 'Week' found in Excel files.")
    import sys
    sys.exit(0)

df = pd.concat(dfs, ignore_index=True)

# Parse Start Date
df['Start Date'] = pd.to_datetime(df['Start Date'], format='mixed', errors='coerce')
df = df.dropna(subset=['Start Date'])

# Sort by date
df = df.sort_values(by='Start Date')

def determine_failure_type(reason):
    reason = str(reason).lower()
    if 'sfoc' in reason:
        return 'SFOC out of range'
    elif 'scoc' in reason and ('lower' in reason or 'below' in reason or 'less' in reason):
        return 'SCOC below range'
    elif 'scoc' in reason and ('higher' in reason or 'above' in reason or 'more' in reason):
        return 'SCOC above range'
    elif 'validation' in reason or ('aux' in reason and 'engine' in reason):
        return 'Aux Engine Validation'
    elif 'rule 7' in reason or 'reporting gap' in reason or 'reporting cap' in reason:
        return 'Reporting Gap (Rule 7)'
    else:
        return 'Other'

results = []
row_id = 0

for _, row in df.iterrows():
    vessel_name = str(row.get('Ship Name', '')).strip().upper()
    if vessel_name.lower() in exclude_vessels:
        continue
        
    reason_str = str(row.get('Reason', ''))
    if pd.isna(row.get('Reason')) or not reason_str.strip():
        continue
        
    # Split semicolon-separated reasons
    reasons = [r.strip() for r in reason_str.split(';') if r.strip()]
    
    # Determine all failure types for this row
    row_failure_types = []
    for r in reasons:
        ftype = determine_failure_type(r)
        if ftype != 'Other' and ftype not in row_failure_types:
            row_failure_types.append(ftype)
            
    # Format date as dd-Mon-yy
    date_str = row['Start Date'].strftime('%d-%b-%y')
    
    week = row.get('Assigned Week')
    if pd.isna(week):
        # Fallback if no assigned week in sheet name
        min_date = df['Start Date'].min()
        days_diff = (row['Start Date'] - min_date).days
        week_num = min(4, (days_diff // 7) + 1)
        week = f"Week {week_num}"
    
    # If there are valid failure types, add the single combined record
    if row_failure_types:
        # Clean up reason string
        clean_reason = reason_str.replace('\ufffd', '-').replace('\u2013', '-').replace('\u2014', '-').replace('\n', ' ').strip()
        clean_reason = ' '.join(clean_reason.split())
        
        results.append({
            'row_id': row_id,
            'week': week,
            'date': date_str,
            'vessel': vessel_name,
            'report_type': str(row.get('Report Type', '')).strip(),
            'failure_types': row_failure_types,
            'reason': clean_reason
        })
        row_id += 1

# Write to data.json
out_path = os.path.join(os.path.dirname(__file__), 'data.json')
with open(out_path, 'w') as f:
    json.dump(results, f, indent=4)

print(f"Data successfully written to {out_path}")
print(f"Total split records generated: {len(results)}")
print(f"Total unique original rows: {row_id}")
