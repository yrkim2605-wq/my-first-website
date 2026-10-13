// 카카오 지도 SDK의 장소 검색(services.Places)으로 빵집을 찾아요.
// JavaScript 키는 카카오 개발자 콘솔에 등록한 도메인에서만 동작하기 때문에,
// 브라우저에 키가 보여도 다른 사이트에서는 쓸 수 없어요. (REST 키는 브라우저에 두면 안 돼요)
const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY
const SDK_URL = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&libraries=services&autoload=false`

let sdkPromise = null

// SDK 스크립트는 처음 한 번만 불러오고, 이후에는 같은 Promise를 재사용해요.
const loadKakaoSdk = () => {
  if (sdkPromise) return sdkPromise

  sdkPromise = new Promise((resolve, reject) => {
    if (!KAKAO_JS_KEY) {
      reject(new Error('카카오 JavaScript 키(VITE_KAKAO_JS_KEY)가 설정되지 않았어요.'))
      return
    }
    const script = document.createElement('script')
    script.src = SDK_URL
    script.async = true
    script.onload = () => window.kakao.maps.load(() => resolve(window.kakao))
    script.onerror = () => reject(new Error('카카오 지도 SDK를 불러오지 못했어요.'))
    document.head.appendChild(script)
  }).catch((err) => {
    // 실패하면 "다시 시도" 때 처음부터 다시 불러올 수 있도록 비워둬요.
    sdkPromise = null
    throw err
  })

  return sdkPromise
}

export async function searchBakeriesByKeyword(query, { size = 15 } = {}) {
  const kakao = await loadKakaoSdk()
  const places = new kakao.maps.services.Places()
  const { Status } = kakao.maps.services

  const documents = await new Promise((resolve, reject) => {
    places.keywordSearch(
      query,
      (result, status) => {
        if (status === Status.OK) resolve(result)
        else if (status === Status.ZERO_RESULT) resolve([])
        else reject(new Error(`카카오 장소 검색 실패 (${status})`))
      },
      { size },
    )
  })

  return documents.filter(
    (doc) => doc.category_name.includes('제과') || doc.category_name.includes('베이커리'),
  )
}
