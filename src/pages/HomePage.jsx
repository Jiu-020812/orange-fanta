import { useEffect, useState } from "react";
import TodoList from "./TodoList";

const OPENWEATHER_API_KEY = "b23e3ef920cc977da3084aedddef8322";
const CITY_NAME = "Iksan";
const COUNTRY_CODE = "KR";

// 날씨 코드 → 이모지 매핑
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
  const [weather, setWeather] = useState(null); // { temp, main, description }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 1) 시계 1초마다 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 2) 날씨 한 번 가져오기
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
        width: "100%",
        minHeight: "60vh",
        display: "flex",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      {/* 가운데에 투두 + 날씨 카드 두 개를 나란히 배치 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(260px, 320px) minmax(480px, 1fr)",
          gap: 40,
          alignItems: "flex-start",
          maxWidth: 980,
          width: "100%",
        }}
      >
        {/* 왼쪽: 메모장 느낌 투두 리스트 */}
        <div>
          <TodoList />
        </div>

        {/* 오른쪽: 기존 날짜/시간/날씨 카드 */}
        <div
          style={{
            width: "100%",
            maxWidth: 640,
            padding: 24,
            borderRadius: 24,
            backgroundColor: "#ffffff",
            boxShadow: "0 10px 30px rgba(15,23,42,0.12)",
            boxSizing: "border-box",
          }}
        >
          {/* 날짜 / 시간 */}
          <div
            style={{
              marginBottom: 12,
              fontSize: 18,
              fontWeight: 600,
              color: "#111827",
            }}
          >
            오늘은{" "}
            <span
              style={{
                color: "#2563eb",
              }}
            >
              {formattedDate}
            </span>
            입니다.
          </div>
          <div
            style={{
              marginBottom: 24,
              fontSize: 32,
              fontWeight: 700,
              color: "#111827",
            }}
          >
            {formattedTime}
          </div>

          {/* 날씨 박스 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: 16,
              borderRadius: 20,
              background:
                "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(251,191,36,0.1))",
              border: "1px solid rgba(148,163,184,0.5)",
            }}
          >
            <div
              style={{
                fontSize: 40,
              }}
            >
              {emoji}
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                익산 오늘의 날씨
              </div>

              {loading ? (
                <div
                  style={{
                    fontSize: 13,
                    color: "#6b7280",
                  }}
                >
                  날씨 불러오는 중...
                </div>
              ) : error ? (
                <div
                  style={{
                    fontSize: 13,
                    color: "#ef4444",
                  }}
                >
                  {error}
                </div>
              ) : weather ? (
                <>
                  <div
                    style={{
                      fontSize: 15,
                      color: "#111827",
                    }}
                  >
                    {weather.description || "날씨 정보"}
                    {typeof weather.temp === "number"
                      ? ` · ${Math.round(weather.temp)}°C`
                      : ""}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      marginTop: 2,
                    }}
                  >
                    (OpenWeather 기준 실시간 정보)
                  </div>
                </>
              ) : (
                <div
                  style={{
                    fontSize: 13,
                    color: "#6b7280",
                  }}
                >
                  날씨 정보가 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* 아래 간단 안내 */}
          <p
            style={{
              marginTop: 20,
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            상단 메뉴에서 <b>물품 관리</b> 또는 <b>물품 등록</b>을 눌러서
            평균 매입가를 관리해보세요.
          </p>
        </div>
      </div>
    </div>
  );
}

export default HomePage;