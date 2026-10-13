import breadHouse from '../assets/bakery-photos/bakery-photo-01.webp'
import meetBakery from '../assets/bakery-photos/bakery-photo-02.webp'
import coffeesAre from '../assets/bakery-photos/bakery-photo-03.webp'
import breadAndCo from '../assets/bakery-photos/bakery-photo-04.webp'
import pastryCase from '../assets/bakery-photos/bakery-photo-05.webp'
import fruitMousseCakes from '../assets/bakery-photos/bakery-photo-06.webp'
import strawberryRollCake from '../assets/bakery-photos/bakery-photo-07.webp'
import eggTart from '../assets/decorative/deco-egg-tart.webp'
import strawberryChoux from '../assets/decorative/deco-strawberry-choux.webp'
import strawberryCake from '../assets/decorative/deco-strawberry-cake.webp'

export const BAKERY_PHOTO_BY_ID = {
  1: pastryCase,
  2: coffeesAre,
  3: meetBakery,
  4: breadAndCo,
  5: breadHouse,
  6: breadAndCo,
  7: breadHouse,
  8: pastryCase,
  9: strawberryRollCake,
  10: meetBakery,
  11: coffeesAre,
  12: breadAndCo,
  13: fruitMousseCakes,
}

export const DEFAULT_BAKERY_PHOTO = breadHouse

// 카카오에서 불러온 실제 빵집은 사진이 없어서, 아래 사진들을 나눠 써요.
// photoSlot(빵집 목록 순서)이 있으면 그 순서대로 돌려 써서 이웃한 카드에 같은 사진이 나오지 않고,
// 없으면 id로 골라요. 어느 쪽이든 같은 빵집은 항상 같은 사진이에요.
const PHOTO_POOL = [
  pastryCase,
  eggTart,
  coffeesAre,
  strawberryChoux,
  meetBakery,
  fruitMousseCakes,
  breadAndCo,
  strawberryCake,
  strawberryRollCake,
  breadHouse,
]

const hashId = (id) => [...String(id)].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 100003, 7)

export const getBakeryPhoto = (id, uploadedPhotos = {}, photoSlot) =>
  BAKERY_PHOTO_BY_ID[id] ||
  uploadedPhotos[id] ||
  PHOTO_POOL[(photoSlot ?? hashId(id)) % PHOTO_POOL.length]
