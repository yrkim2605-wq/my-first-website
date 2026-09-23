const KAKAO_REST_KEY = import.meta.env.VITE_KAKAO_REST_KEY
const KEYWORD_SEARCH_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json'

export async function searchBakeriesByKeyword(query, { size = 15 } = {}) {
  const url = `${KEYWORD_SEARCH_URL}?query=${encodeURIComponent(query)}&size=${size}`
  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${KAKAO_REST_KEY}` },
  })

  if (!res.ok) {
    throw new Error(`카카오 로컬 API 요청 실패 (${res.status})`)
  }

  const data = await res.json()
  return data.documents.filter(
    (doc) => doc.category_name.includes('제과') || doc.category_name.includes('베이커리'),
  )
}
