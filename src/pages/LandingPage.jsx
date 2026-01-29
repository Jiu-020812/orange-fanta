import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [currentFeature, setCurrentFeature] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: '📦',
      title: '간편한 재고 관리',
      desc: '바코드 스캔으로 빠른 등록',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: '📊',
      title: '자동 평균가 계산',
      desc: '매입가 자동 계산으로 수익 파악',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: '📈',
      title: '실시간 통계',
      desc: '입출고 현황을 한눈에',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: '🏷️',
      title: '카테고리 관리',
      desc: '품목별 체계적 정리',
      color: 'from-green-500 to-teal-500',
    },
  ];

  const targetUsers = [
    '온라인 쇼핑몰 운영자',
    '재고 관리가 필요하신 분',
    '소규모 매장 사장님',
  ];

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', overflow: 'hidden' }}>
      {/* Hero Section */}
      <section
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          overflow: 'hidden',
        }}
      >
        {/* Animated Background Circles */}
        <div
          style={{
            position: 'absolute',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            top: '-200px',
            right: '-100px',
            animation: 'float 6s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
            bottom: '-100px',
            left: '-50px',
            animation: 'float 8s ease-in-out infinite reverse',
          }}
        />

        <div style={{ textAlign: 'center', zIndex: 1, maxWidth: '800px' }}>
          {/* Logo Animation */}
          <div
            style={{
              fontSize: '80px',
              marginBottom: '20px',
              animation: 'bounce 2s ease-in-out infinite',
            }}
          >
            🍊
          </div>

          <h1
            style={{
              fontSize: 'clamp(32px, 6vw, 64px)',
              fontWeight: '900',
              color: 'white',
              marginBottom: '20px',
              textShadow: '0 4px 20px rgba(0,0,0,0.2)',
              animation: 'fadeInUp 1s ease-out',
            }}
          >
            재고 관리, 이제 쉽고 간편하게
          </h1>

          <p
            style={{
              fontSize: 'clamp(16px, 3vw, 24px)',
              color: 'rgba(255, 255, 255, 0.95)',
              marginBottom: '40px',
              animation: 'fadeInUp 1s ease-out 0.2s backwards',
            }}
          >
            입출고부터 평균가 계산까지, MyInventory와 함께
          </p>

          <div
            style={{
              display: 'flex',
              gap: '20px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              animation: 'fadeInUp 1s ease-out 0.4s backwards',
            }}
          >
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '18px 40px',
                fontSize: '18px',
                fontWeight: '700',
                background: 'white',
                color: '#667eea',
                border: 'none',
                borderRadius: '50px',
                cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px) scale(1.05)';
                e.target.style.boxShadow = '0 15px 40px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
              }}
            >
              무료로 시작하기 →
            </button>

            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '18px 40px',
                fontSize: '18px',
                fontWeight: '700',
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '2px solid white',
                borderRadius: '50px',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'white';
                e.target.style.color = '#667eea';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.color = 'white';
              }}
            >
              로그인
            </button>
          </div>

          {/* Scroll Indicator */}
          <div
            style={{
              marginTop: '80px',
              animation: 'bounce 2s ease-in-out infinite',
            }}
          >
            <div style={{ color: 'white', fontSize: '14px', marginBottom: '10px', opacity: 0.8 }}>
              스크롤해서 더 알아보기
            </div>
            <div style={{ fontSize: '24px' }}>↓</div>
          </div>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </section>

      {/* Features Section */}
      <section
        style={{
          padding: '100px 20px',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 'clamp(28px, 5vw, 48px)',
              fontWeight: '900',
              textAlign: 'center',
              marginBottom: '60px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            이런 기능들이 있어요 ✨
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '30px',
            }}
          >
            {features.map((feature, idx) => (
              <div
                key={idx}
                style={{
                  padding: '40px 30px',
                  borderRadius: '24px',
                  background: 'white',
                  boxShadow:
                    currentFeature === idx
                      ? '0 20px 60px rgba(102, 126, 234, 0.3)'
                      : '0 10px 30px rgba(0,0,0,0.1)',
                  transform: currentFeature === idx ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.5s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setCurrentFeature(idx)}
              >
                <div
                  style={{
                    fontSize: '64px',
                    marginBottom: '20px',
                    animation: currentFeature === idx ? 'bounce 1s ease-in-out infinite' : 'none',
                  }}
                >
                  {feature.icon}
                </div>

                <h3
                  style={{
                    fontSize: '24px',
                    fontWeight: '800',
                    marginBottom: '12px',
                    background: `linear-gradient(135deg, ${feature.color})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {feature.title}
                </h3>

                <p style={{ fontSize: '16px', color: '#666', lineHeight: '1.6' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section
        style={{
          padding: '100px 20px',
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 'clamp(28px, 5vw, 48px)',
              fontWeight: '900',
              textAlign: 'center',
              marginBottom: '60px',
              color: 'white',
              textShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}
          >
            이렇게 사용해요 📱
          </h2>

          <div
            style={{
              background: 'white',
              borderRadius: '24px',
              padding: '40px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'float 6s ease-in-out infinite',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                height: '400px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                fontWeight: '700',
              }}
            >
              실제 화면 스크린샷 영역
              <br />
              ( 앱 화면을 넣을듯?)
            </div>
          </div>
        </div>
      </section>

      {/* Target Users Section */}
      <section
        style={{
          padding: '100px 20px',
          background: 'white',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 'clamp(28px, 5vw, 48px)',
              fontWeight: '900',
              textAlign: 'center',
              marginBottom: '60px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            이런 분들께 추천해요 👥
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
            }}
          >
            {targetUsers.map((user, idx) => (
              <div
                key={idx}
                style={{
                  padding: '30px 20px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  textAlign: 'center',
                  fontSize: '18px',
                  fontWeight: '700',
                  boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
                  transform: 'translateY(0)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-10px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                ✅ {user}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          padding: '100px 20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: '900',
            color: 'white',
            marginBottom: '30px',
          }}
        >
          지금 바로 시작하세요!
        </h2>

        <p
          style={{
            fontSize: '20px',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '40px',
          }}
        >
          회원가입은 무료입니다 🎉
        </p>

        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '20px 50px',
            fontSize: '20px',
            fontWeight: '700',
            background: 'white',
            color: '#667eea',
            border: 'none',
            borderRadius: '50px',
            cursor: 'pointer',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
          }}
        >
          무료 회원가입 →
        </button>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '40px 20px',
          background: '#1a1a2e',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
          © 2026 MyInventory. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
