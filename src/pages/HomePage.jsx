import { useEffect, useState } from "react";
import TodoList from "./TodoList";

const OPENWEATHER_API_KEY = "b23e3ef920cc977da3084aedddef8322";
const CITY_NAME = "Iksan";
const COUNTRY_CODE = "KR";

function getWeatherEmoji(main) {
  if (!main) return "❔";
  const m = main.toLowerCase();

  if (m.includes("clear")) return "☀️";
  if (m.includes("cloud")) return "⛅";
  if (m.includes("rain") || m.includes("drizzle")) return "🌧️";
  if (m.includes("thunder")) return "⛈️";
  if (m.includes("snow")) return "❄️";
  if (m.includes("fog") || m.includes("mist") || m.includes("haze"))
    return "🌫️";

  return "🌈";
}

function HomePage() {
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError("");

        const url = `https://api.openweathermap.org/data/2.5/weather?q=${CITY_NAME},${COUNTRY_CODE}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=kr`;

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();

        const main = data.weather?.[0]?.main || "";
        const description = data.weather?.[0]?.description || "";
        const temp = data.main?.temp;

        setWeather({
          main,
          description,
          temp,
        });
      } catch (e) {
        console.error("날씨 가져오기 오류:", e);
        setError("날씨 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const formattedDate = now.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const formattedTime = now.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const emoji = getWeatherEmoji(weather?.main);

  return (
    <div
      style={{
        minHeight: "calc(100vh - 56px)",
        background: "linear-gradient(135deg, #b8c5f2 0%, #c5b3d9 50%, #e8d4f0 100%)",
        padding: "40px 20px",
      }}
    >

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "30px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* 날짜/시간 + 날씨 카드 (2칸) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "30px",
          }}
        >
          {/* 날짜/시간 카드 */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "40px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                fontSize: "48px",
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              🕐
            </div>

            <h2
              style={{
                fontSize: "24px",
                fontWeight: "800",
                marginBottom: "12px",
                color: "#7c8db5",
                textAlign: "center",
              }}
            >
              {formattedDate}
            </h2>

            <div
              style={{
                fontSize: "48px",
                fontWeight: "900",
                color: "#111827",
                textAlign: "center",
                letterSpacing: "2px",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formattedTime}
            </div>
          </div>

          {/* 날씨 카드 */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "40px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                fontSize: "64px",
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              {emoji}
            </div>

            <h3
              style={{
                fontSize: "20px",
                fontWeight: "700",
                color: "#111827",
                marginBottom: "12px",
                textAlign: "center",
              }}
            >
              익산 오늘의 날씨
            </h3>

            {loading ? (
              <div
                style={{
                  textAlign: "center",
                  fontSize: "15px",
                  color: "#6b7280",
                }}
              >
                날씨 불러오는 중...
              </div>
            ) : error ? (
              <div
                style={{
                  textAlign: "center",
                  fontSize: "15px",
                  color: "#ef4444",
                }}
              >
                {error}
              </div>
            ) : weather ? (
              <>
                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: "900",
                    color: "#8b9abe",
                    textAlign: "center",
                    marginBottom: "8px",
                  }}
                >
                  {typeof weather.temp === "number"
                    ? `${Math.round(weather.temp)}°C`
                    : "-"}
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    color: "#4b5563",
                    textAlign: "center",
                  }}
                >
                  {weather.description || "날씨 정보"}
                </div>
              </>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  fontSize: "15px",
                  color: "#6b7280",
                }}
              >
                날씨 정보가 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* TodoList 카드 */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "40px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <TodoList />
        </div>

        {/* 안내 카드 */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "24px 32px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div style={{ fontSize: "32px" }}>💡</div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: "16px",
                color: "#4b5563",
                margin: 0,
                lineHeight: "1.6",
              }}
            >
              상단 메뉴에서 <strong style={{ color: "#667eea" }}>품목 관리</strong> 또는{" "}
              <strong style={{ color: "#667eea" }}>품목 등록</strong>을 눌러서
              평균 매입가를 관리해보세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
