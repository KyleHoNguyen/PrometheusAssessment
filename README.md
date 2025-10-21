# Alphavantage Intraday Aggregator (C# .NET 8 Minimal API)

This project queries Alpha Vantage's `TIME_SERIES_INTRADAY` at 15-minute intervals, groups the last 30 days of bars by day, and returns JSON containing `day`, `lowAverage`, `highAverage`, and `volume`.

## Requirements
- .NET 8 SDK
- Alpha Vantage API key (set as environment variable `ALPHAVANTAGE_API_KEY`)

Alpha Vantage docs: https://www.alphavantage.co/documentation/ (see TIME_SERIES_INTRADAY). :contentReference[oaicite:1]{index=1}

## Setup & Run

1. Clone or create the folder and files as shown.
2. Set your API key in your environment:
   - macOS / Linux:
     ```bash
     export ALPHAVANTAGE_API_KEY=your_api_key_here
     ```
   - Windows (PowerShell):
     ```powershell
     $env:ALPHAVANTAGE_API_KEY="your_api_key_here"
     ```

3. From `src/`:
   ```bash
   dotnet restore
   dotnet run

## Display
The screen should display "Stock Intraday Data" with a simple search bar right below it. Enter any Stock name and it should return a line chart showing 
the High/Low average and the volume for the last 30 days. Note that the chart will show less than 30 points as there are no records for weekend days (Saturday and Sunday). 
Enjoy!
