import React, { useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

// backend data structure
interface DailyAggregate {
    day: string;
    lowAverage: number;
    highAverage: number;
    volume: number;
}

const StockChart: React.FC = () => {
    const [inputSymbol, setInputSymbol] = useState(''); // what the user types 
    const [submittedSymbol, setSubmittedSymbol] = useState(''); // what the user searches
    const [data, setData] = useState<DailyAggregate[]>([]); // array of the stock data from api call
    const [loading, setLoading] = useState(false); // disables button when api call loading
    const [error, setError] = useState(''); // if any errors found

    const fetchData = async () => {
        if (!inputSymbol) return;
        setLoading(true);
        setError('')
        setSubmittedSymbol(inputSymbol);            ;

        try {
            const response = await fetch(`/api/intraday/${inputSymbol}`); // calls api with searched symbol
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const jsonDataRaw = await response.json(); // casts response to array
            if (!Array.isArray(jsonDataRaw)) {
                throw new Error('Unexpected API response format');
            }

            const jsonData = jsonDataRaw as DailyAggregate[];
            if (jsonData.length === 0) {
                throw new Error('No data returned for this symbol.');
            }

            setData(jsonData.reverse()); // earliest day first
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Failed to fetch data');
            }
            setData([]);
        } finally {
            setLoading(false);
        }
    };



    // Chart.js dataset
    const chartData = {
        labels: data.map((d) => d.day),
        datasets: [
            {
                label: 'Low Average',
                data: data.map((d) => d.lowAverage),
                borderColor: 'blue',
                fill: false,
            },
            {
                label: 'High Average',
                data: data.map((d) => d.highAverage),
                borderColor: 'red',
                fill: false,
            },
            {
                label: 'Volume',
                data: data.map((d) => d.volume),
                borderColor: 'green',
                fill: false,
                yAxisID: 'yVolume',
            },
        ],
    };

    // Chart.js options
    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: `Stock Data for ${submittedSymbol}`,
            },
        },
        scales: {
            y: {
                type: 'linear' as const,
                position: 'left' as const,
                title: { display: true, text: 'Price' },
            },
            yVolume: {
                type: 'linear' as const,
                position: 'right' as const,
                title: { display: true, text: 'Volume' },
                grid: { drawOnChartArea: false },
            },
        },
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minHeight: '100vh',
                padding: '20px',
                boxSizing: 'border-box',
            }}
        >
            {/* Top Centered Header and Search */}
            <div
                style={{
                    width: '100%',
                    maxWidth: '800px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginBottom: '24px',
                }}
            >
                <h1 style={{ textAlign: 'center', marginBottom: '16px' }}>
                    Stock Intraday Data
                </h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault(); // prevent page reload
                            fetchData();        // trigger search
                        }}
                        style={{ display: 'flex', gap: '8px' }}
                    >
                        <input
                            value={inputSymbol}
                            onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
                            placeholder="Enter stock symbol"
                            style={{
                                padding: '8px 12px',
                                fontSize: '16px',
                                borderRadius: '4px',
                                border: '1px solid #ccc',
                            }}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '8px 16px',
                                fontSize: '16px',
                                borderRadius: '4px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            {loading ? 'Loading...' : 'Search'}
                        </button>
                    </form>

                </div>
                {error && <p style={{ color: 'red', marginTop: '12px' }}>{error}</p>}
            </div>

            {data.length > 0 && (
                <div
                    style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                    }}
                >
                    <div style={{ width: '90vw', maxWidth: '1200px', height: '70vh' }}>
                        <Line data={chartData} options={options} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockChart;
