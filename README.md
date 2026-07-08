# Fleet Failure Tracker (CSM Noatum)

An interactive dashboard for tracking compliance failures and analyzing weekly/monthly trends in fleet performance. This app consists of a Python-based backend script to process Excel data files and a clean, responsive frontend to visualize the statistics, vessel matrix, and failure logs.

---

## Prerequisites

Before running the application, make sure you have the following installed on your system:

1. **Python 3.x**: Required to process raw Excel data files.
2. **Pip**: Python package manager.
3. **Web Browser**: Any modern web browser (Chrome, Firefox, Edge, Safari).
4. **Local HTTP Web Server**: Required to run the HTML frontend (due to browser security CORS policies blocking local `fetch` calls).

---

## Step 1: Install Python Dependencies

The data processing script uses `pandas` and `openpyxl` to extract and structure the data from Excel files. Install them by running:

```bash
pip install pandas openpyxl
```

---

## Step 2: Process Raw Excel Data

The dashboard displays data from `data.json`. If you have new or updated Excel spreadsheets:

1. Create a folder named `data` in the project root directory (if it doesn't exist).
2. Place your raw Excel sheets (e.g., `Book1.xlsx`) inside the `data/` folder.
   > **Note:** The sheets inside the Excel file must contain `Week` in their name (e.g. `Week 1`, `Week 2`) to be processed by the script.
3. Run the processing script:
   ```bash
   python process_data.py
   ```
4. This script will scan the `data/` folder, filter out excluded vessels, parse failure logs, structure the records, and output them to [data.json](file:///c:/Users/Dell/Desktop/CSM_Noatum/CSM-Noatum-failure-dashboard/data.json).

---

## Step 3: Run the Web Dashboard

Since the frontend application uses `fetch()` to load the data from `data.json`, opening `index.html` directly (via double-clicking the file) will be blocked by modern browser security (CORS) rules. You must run it using a local web server.

Here are a few quick ways to do this:

### Option A: Using Python (Recommended & Easiest)
Since you already have Python installed, you can start a simple server from the root of the project folder:

```bash
python -m http.server 8000
```
Then, open your browser and navigate to:
[http://localhost:8000](http://localhost:8000)

### Option B: Using Node.js (`npx`)
If you have Node.js installed, run:

```bash
npx serve .
```
Then, open the URL provided in the terminal (usually `http://localhost:3000` or `http://localhost:5000`).

### Option C: VS Code Live Server Extension
If you are using Visual Studio Code:
1. Install the **Live Server** extension (by Ritwick Dey).
2. Open the project folder in VS Code.
3. Right-click [index.html](file:///c:/Users/Dell/Desktop/CSM_Noatum/CSM-Noatum-failure-dashboard/index.html) and select **Open with Live Server** (or click the **Go Live** button in the bottom status bar).

---

## Features

- **Weekly/Monthly View Toggle**: View dashboards on a weekly breakdown or aggregated monthly view.
- **Dynamic KPI Summary**: Displays Total Failures, Unique Vessels Affected, Top Failure Mode, and Most Affected Vessel.
- **Interactive Charts**:
  - **Weekly Failures Trend**: Bar chart detailing the comparison between total failures and unique vessels.
  - **Failure Category Stack**: Interactive visualization of failure counts categorized by types.
  - **Aggregate Profile**: Doughnut chart showcasing percentages of failure distributions.
- **Vessel Intensity Matrix**: Clean tabular layout showcasing failure intensities per vessel across the weeks.
- **Detailed Search & Filters**: Search vessel names and filter records by specific vessel, week, or failure type.
- **PDF Export**: Download clean, print-friendly reports of the filtered registry list.
