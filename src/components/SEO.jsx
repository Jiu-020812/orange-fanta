import { Helmet } from "react-helmet-async";

/**
 * SEO 컴포넌트
 * 페이지별 메타태그, Open Graph, Twitter Card, JSON-LD 구조화 데이터 관리
 */
export default function SEO({
  title = "MyInventory - 스마트 재고 관리 시스템",
  description = "네이버, 쿠팡 등 다중 채널 재고를 한 곳에서 관리하세요. 실시간 동기화, 자동 발주, 재고 분석 리포트 제공",
  keywords = "재고관리, 재고관리시스템, 재고관리프로그램, 네이버스마트스토어, 쿠팡, 온라인쇼핑몰, 재고추적, 발주관리",
  author = "MyInventory Team",
  url = "https://myinvetory.com",
  image = "https://myinvetory.com/og-image.png",
  type = "website",
  locale = "ko_KR",
  siteName = "MyInventory",
  twitterCard = "summary_large_image",
  noindex = false,
  nofollow = false,
  canonical,
  structuredData,
}) {
  const canonicalUrl = canonical || url;
  const robots = noindex || nofollow
    ? `${noindex ? 'noindex' : 'index'},${nofollow ? 'nofollow' : 'follow'}`
    : 'index,follow';

  return (
    <Helmet>
      {/* 기본 메타태그 */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph (Facebook, KakaoTalk) */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content={locale} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* 네이버 블로그/검색 최적화 */}
      <meta name="naver-site-verification" content="" /> {/* 네이버 웹마스터 도구에서 발급 */}

      {/* Google Search Console */}
      <meta name="google-site-verification" content="" /> {/* 구글 서치 콘솔에서 발급 */}

      {/* 모바일 최적화 */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      <meta name="theme-color" content="#667eea" />

      {/* 구조화된 데이터 (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
