// "더 보기"로 받은 다음 쪽을 이미 보이는 글에 이어 붙여요. 글 ID가 같은 글은 한 번만 보여줘요.
// (다른 사람이 글을 쓰거나 좋아요를 눌러서 쪽 경계가 밀려도 같은 글이 두 번 나오지 않게 하는 안전장치예요)
export const mergePostPages = (current, next) => {
  const seen = new Set(current.map((post) => post.id))
  return [...current, ...next.filter((post) => !seen.has(post.id))]
}
