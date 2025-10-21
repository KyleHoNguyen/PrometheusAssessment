using System.Globalization; // for parsing regardless of data type
using System.Text.Json; // for JSOn parsing

namespace PrometheusAssessment.Server.Services
{
    // class that uses AlphaVantage API
    public class AlphaVantageClient
    {
        private readonly HttpClient _httpClient; // field for HTTP requests to AlphaVantage
        private readonly string _apiKey; // field to store API KEY. Note API key is in ENV Variables or appsettings.json

        public AlphaVantageClient(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _apiKey = config["AlphaVantage:ApiKey"] ?? Environment.GetEnvironmentVariable("ALPHAVANTAGE_API_KEY") ?? "";
        }

        // record bc immutable
        public record TimeSeriesBar(DateTime Timestamp, double High, double Low, long Volume);

        // returns a List of TimeSeriesBar for the given stock. Uses Symbol as Parameter
        public async Task<List<TimeSeriesBar>> GetIntradayBarsAsync(string symbol)
        {
            // using alpha vantage time_series_intraday API call with an interval of 15 mins and full output size. Optional Params are defaulted
            var url = $"https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol={symbol}&interval=15min&outputsize=full&apikey={_apiKey}";
            var response = await _httpClient.GetAsync(url); // waiting for response
            response.EnsureSuccessStatusCode(); // ensures API call is a success, otherwise throw exception

            using var stream = await response.Content.ReadAsStreamAsync();
            // Console.WriteLine(stream);
            using var json = JsonDocument.Parse(stream);
            var root = json.RootElement;

            // Check for error or note
            if (root.TryGetProperty("Note", out var note))
            {
                throw new InvalidOperationException($"Alpha Vantage API Note: {note.GetString()}");
            }
            if (root.TryGetProperty("Error Message", out var error))
            {
                throw new InvalidOperationException($"Alpha Vantage API Error: {error.GetString()}");
            }
            if (!root.TryGetProperty("Time Series (15min)", out JsonElement timeSeries))
            {
                throw new InvalidOperationException("Unexpected response: 'Time Series (15min)' not found.");
            }

            // list for each bar, but only keeping the high, low, and volume data
            var bars = new List<TimeSeriesBar>();
            foreach (var item in timeSeries.EnumerateObject())
            {
                // parses the date/time string into a DateTime object and saves as "timestamp"
                if (!DateTime.TryParse(item.Name, out var timestamp)) continue;

                var data = item.Value; // data is the full json object containing all the data (open, high, etc)
                double high = double.Parse(data.GetProperty("2. high").GetString()!, CultureInfo.InvariantCulture);
                double low = double.Parse(data.GetProperty("3. low").GetString()!, CultureInfo.InvariantCulture);
                long volume = long.Parse(data.GetProperty("5. volume").GetString()!, CultureInfo.InvariantCulture);

                bars.Add(new TimeSeriesBar(timestamp, high, low, volume));
            }

            return bars;
        }
    }
}
