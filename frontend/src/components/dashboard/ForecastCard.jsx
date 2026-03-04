import React, { useEffect, useState } from 'react';
import api from '../../services/api';



export function ForecastCard() {
  const [forecast, setForecast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchForecast = async () => {
    try {
      setError('');
      setIsLoading(true);
      const response = await api.get('/forecasts/latest');
      setForecast(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to fetch forecast:', error);
      setError('Unable to load forecast');
    } finally {
      setIsLoading(false);
    }
  };

  const generateForecast = async () => {
    try {
      setIsGenerating(true);
      setError('');
      await api.post('/forecasts/generate');
      // Fetch the newly generated forecast
      await fetchForecast();
    } catch (error) {
      console.error('Failed to generate forecast:', error);
      setError(error.response?.data?.message || 'Failed to generate forecast. Please ensure you have enough transaction data.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4 w-1/2"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          🔮 Monthly Forecast
        </h3>
        <p className="text-sm text-gray-600 mb-4">{error}</p>
        <button
          onClick={generateForecast}
          disabled={isGenerating}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {isGenerating ? 'Generating...' : 'Generate Forecast'}
        </button>
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          🔮 Monthly Forecast
        </h3>
        <p className="text-sm text-gray-600 text-center py-4 mb-4">
          No forecast data available yet. Add transactions to generate predictions.
        </p>
        <button
          onClick={generateForecast}
          disabled={isGenerating}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {isGenerating ? 'Generating...' : 'Generate Forecast'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          🔮 Monthly Forecast
        </h3>
        <button
          onClick={generateForecast}
          disabled={isGenerating}
          className="text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-1 px-3 rounded-full transition-colors"
          title="Regenerate forecast"
        >
          {isGenerating ? '...' : '↻'}
        </button>
      </div>

      <div className="space-y-4">
        {/* Current Spending */}
        {forecast.currentSpending !== undefined && (
          <div className="bg-white bg-opacity-60 rounded-lg p-4">
            <p className="text-sm text-gray-600 font-medium">Spent So Far This Month</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">
              ${forecast.currentSpending.toFixed(2)}
            </p>
          </div>
        )}

        {/* Predicted Amount */}
        <div className="bg-white bg-opacity-60 rounded-lg p-4">
          <p className="text-sm text-gray-600 font-medium">Predicted Month Total</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">
            ${forecast.predictedAmount.toFixed(2)}
          </p>
        </div>

        {/* Data Info */}
        <div className="bg-white bg-opacity-40 rounded-lg p-3">
          <p className="text-xs text-gray-600">
            Based on <span className="font-semibold">{forecast.basedOnMonths}</span> months of spending data.
            This is an estimated value.
          </p>
        </div>
      </div>
    </div>
  );
}




