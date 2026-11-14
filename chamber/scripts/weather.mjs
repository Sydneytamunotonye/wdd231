const apiKey = "YOUR_OPENWEATHERMAP_API_KEY";

const lat = 4.8156;
const lon = 7.0498;
const base = "https://api.openweathermap.org/data/2.5";
const query = `lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
const currentURL = `${base}/weather?${query}`;
const forecastURL = `${base}/forecast?${query}`;

async function getJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

const localDate = (seconds, offset) => new Date((seconds + offset) * 1000);
const dayKey = (seconds, offset) => localDate(seconds, offset).toISOString().slice(0, 10);

const timeFormat = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
const weekdayFormat = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" });

const degrees = (value) => `${Math.round(value)}°C`;
const capitalize = (text) => text.replace(/\b\w/g, (letter) => letter.toUpperCase());

function dailyHighLow(forecast, current) {
  const offset = forecast.city.timezone;
  const days = new Map();

  const add = (seconds, high, low) => {
    const key = dayKey(seconds, offset);
    const day = days.get(key) ?? { seconds, high: -Infinity, low: Infinity };
    day.high = Math.max(day.high, high);
    day.low = Math.min(day.low, low);
    days.set(key, day);
  };

  add(current.dt, current.main.temp_max, current.main.temp_min);
  forecast.list.forEach((slot) => add(slot.dt, slot.main.temp_max, slot.main.temp_min));

  return [...days.values()].slice(0, 3).map((day, index) => ({
    label: index === 0 ? "Today" : weekdayFormat.format(localDate(day.seconds, offset)),
    high: day.high,
    low: day.low,
  }));
}

function renderCurrent(container, current, today) {
  const offset = current.timezone;
  const condition = current.weather[0];
  const description = capitalize(condition.description);

  container.innerHTML = `
    <div class="weather-now">
      <img src="https://openweathermap.org/img/wn/${condition.icon}@2x.png" alt="${description}" width="100" height="100">
      <p class="temp">${degrees(current.main.temp)}</p>
    </div>
    <ul class="weather-details">
      <li class="weather-desc">${description}</li>
      <li><span class="label">High:</span> ${degrees(today.high)}</li>
      <li><span class="label">Low:</span> ${degrees(today.low)}</li>
      <li><span class="label">Humidity:</span> ${current.main.humidity}%</li>
      <li><span class="label">Sunrise:</span> ${timeFormat.format(localDate(current.sys.sunrise, offset))}</li>
      <li><span class="label">Sunset:</span> ${timeFormat.format(localDate(current.sys.sunset, offset))}</li>
    </ul>`;
}

function renderForecast(container, days) {
  container.innerHTML = `
    <ul class="forecast-list">
      ${days.map((day) => `
        <li>
          <span class="day">${day.label}</span>
          <span><span class="label">High</span> <strong>${degrees(day.high)}</strong></span>
          <span><span class="label">Low</span> ${degrees(day.low)}</span>
        </li>`).join("")}
    </ul>`;
}

export async function showWeather(currentBox, forecastBox) {
  const fail = (message) => {
    currentBox.innerHTML = `<p class="status">${message}</p>`;
    forecastBox.innerHTML = `<p class="status">${message}</p>`;
  };

  if (!apiKey || apiKey.startsWith("YOUR_")) {
    fail("Weather is unavailable: no OpenWeatherMap API key has been set.");
    return;
  }

  try {
    const [current, forecast] = await Promise.all([getJSON(currentURL), getJSON(forecastURL)]);
    const days = dailyHighLow(forecast, current);
    renderCurrent(currentBox, current, days[0]);
    renderForecast(forecastBox, days);
  } catch (error) {
    fail("Sorry, the weather could not be loaded right now.");
    console.error("Could not load weather:", error);
  }
}
