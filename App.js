import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import './App.css';

function App() {
    const [city, setCity] = useState('');
    const [weather, setWeather] = useState(null);
    const [forecast, setForecast] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [searchHistory, setSearchHistory] = useState([]);
    const [favorites, setFavorites] = useState([]);

    const fetchWeather = async () => {
        if (!city) return;

        // Verifica se já temos os dados do clima para a cidade
        const cachedWeather = localStorage.getItem(`weather-${city}`);
        if (cachedWeather) {
            setWeather(JSON.parse(cachedWeather));
            setIsVisible(true);
            return; // Retorna para evitar nova chamada à API
        }

        setLoading(true);
        const apiKey = '175ea1c8d5c1b001038b35dcffe40803'; // Sua chave de API
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

        try {
            const weatherResponse = await fetch(weatherUrl);
            if (!weatherResponse.ok) {
                const suggestions = ['São Paulo', 'Rio de Janeiro', 'Brasília']; // Sugestões de exemplo
                throw new Error(`Cidade não encontrada. Tente uma das seguintes: ${suggestions.join(', ')}`);
            }
            const weatherData = await weatherResponse.json();
            
            // Armazena os dados no cache
            localStorage.setItem(`weather-${city}`, JSON.stringify(weatherData));

            setWeather(weatherData);
            setIsVisible(true);
            setError('');

            const forecastResponse = await fetch(forecastUrl);
            if (!forecastResponse.ok) {
                throw new Error('Erro ao obter dados de previsão.');
            }
            const forecastData = await forecastResponse.json();
            setForecast(forecastData);
        } catch (err) {
            setError(err.message);
            setWeather(null);
            setForecast(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        fetchWeather();
    };

    const getLocationWeather = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    const apiKey = '175ea1c8d5c1b001038b35dcffe40803'; // Sua chave de API
                    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
                    
                    fetch(url)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Erro ao obter dados de localização.');
                            }
                            return response.json();
                        })
                        .then(data => {
                            if (data && data.weather) {
                                setWeather(data);
                                setIsVisible(true);
                                setError('');
                            } else {
                                setError('Dados do clima não disponíveis.');
                            }
                        })
                        .catch(err => {
                            console.error('Erro ao buscar dados de clima:', err);
                            setError('Erro ao obter dados de clima.');
                            setWeather(null);
                        });
                },
                (error) => {
                    setError(`Erro na geolocalização: ${error.message}`);
                }
            );
        } else {
            setError('Geolocalização não é suportada neste navegador.');
        }
    };

    const toggleFavorite = (cityName) => {
        setFavorites(prevFavorites => {
            if (prevFavorites.includes(cityName)) {
                return prevFavorites.filter(fav => fav !== cityName);
            }
            return [...prevFavorites, cityName];
        });
    };

    return (
        <div className="App">
            <h1 id="app-title">Aplicativo de Clima</h1>
            <button aria-labelledby="app-title" onClick={getLocationWeather}>Usar Localização Atual</button>
            <form onSubmit={handleSubmit} aria-label="Buscar clima">
                <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Digite uma cidade"
                    aria-required="true"
                    aria-label="Nome da cidade"
                />
                <button type="submit" aria-label="Buscar clima na cidade">
                    <img src="https://img.icons8.com/material-outlined/24/ffffff/search--v1.png" alt="Buscar" />
                    Buscar
                </button>
            </form>

            {loading && <p>Carregando...</p>}
            {error && <p>{error}</p>}
            {weather && (
                <div className={`weather-card ${isVisible ? 'visible' : ''}`}>
                    <h2>Estado de {weather.name}</h2>
                    <img 
                        src={`http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`} 
                        alt={weather.weather[0].description} 
                    />
                    <p>Temperatura: {weather.main.temp} °C</p>
                    <p>Umidade: {weather.main.humidity}%</p>
                    <p>Velocidade do Vento: {weather.wind.speed} m/s</p>
                    <button onClick={() => toggleFavorite(weather.name)}>
                        {favorites.includes(weather.name) ? 'Remover Favorito' : 'Adicionar aos Favoritos'}
                    </button>
                </div>
            )}

            <h3>Histórico de Busca</h3>
            <ul>
                {searchHistory.map((item, index) => (
                    <li key={index} onClick={() => setCity(item)}>
                        {item}
                    </li>
                ))}
            </ul>

            {forecast && (
                <div>
                    <h3>Previsão do Tempo</h3>
                    {forecast.list.slice(0, 5).map((item, index) => (
                        <div key={index}>
                            <p>{new Date(item.dt * 1000).toLocaleDateString()} - {item.weather[0].description}</p>
                            <p>Temperatura: {item.main.temp} °C</p>
                        </div>
                    ))}

                    {/* Gráfico de Temperatura */}
                    <h3>Gráfico de Temperatura</h3>
                    <LineChart width={500} height={300} data={forecast.list.slice(0, 5)}>
                        <XAxis dataKey="dt_txt" />
                        <YAxis />
                        <Tooltip />
                        <CartesianGrid strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="main.temp" stroke="#4CAF50" />
                    </LineChart>
                </div>
            )}
        </div>
    );
}

export default App;
