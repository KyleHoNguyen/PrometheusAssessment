using Microsoft.AspNetCore.Mvc;
using PrometheusAssessment.Server.Models;
using PrometheusAssessment.Server.Services;

namespace PrometheusAssessment.Server.Controllers
{
    [ApiController] // tells .NET that this class is a WEB API Controller
    [Route("api/[controller]")] // defines the route
    public class IntradayController : ControllerBase
    {
        private readonly AlphaVantageClient _alphaClient; // field for the service instance

        public IntradayController(AlphaVantageClient alphaClient)
        {
            _alphaClient = alphaClient;
        }

        [HttpGet("{symbol}")] // responds to GET responses using the symbol
        public async Task<IActionResult> Get(string symbol)
        {
            if (string.IsNullOrWhiteSpace(symbol))
                return BadRequest("Symbol required.");

            // this is where im "consuming" the API
            var bars = await _alphaClient.GetIntradayBarsAsync(symbol); // using await to wait for the HTTP request to finish
            var cutoff = DateTime.UtcNow.Date.AddDays(-30); // making the cutoff 30 days from current date

            var grouped = bars
                .Where(b => b.Timestamp.Date >= cutoff) // only using last 30 days
                .GroupBy(b => b.Timestamp.Date) // grouping it by date
                .Select(g => new DailyAggregate
                {
                    Day = g.Key.ToString("yyyy-MM-dd"),
                    LowAverage = Math.Round(g.Average(x => x.Low), 4),
                    HighAverage = Math.Round(g.Average(x => x.High), 4),
                    Volume = g.Sum(x => x.Volume)
                })
                .OrderByDescending(d => d.Day)
                .ToList();

            return Ok(grouped); // returns the JSON
        }
    }
}
