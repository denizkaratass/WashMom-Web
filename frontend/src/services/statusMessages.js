// Backend HTTP durum kodları → kullanıcıya gösterilen Türkçe mesajlar (api.js ve mockApi.js ortak kullanır).
export const STATUS_MESSAGES = {
  400: 'Bu fotoğrafı okuyamadım. Başka bir fotoğraf dener misin?',
  413: 'Bu fotoğraf biraz fazla büyük. Daha küçük bir fotoğraf dener misin?',
  422: 'Fotoğrafta kıyafeti seçemedim. Kıyafeti sade bir zemine koyup ortada olacak şekilde tekrar çeker misin?',
  500: 'Bir şeyler ters gitti, WashMom tekrar denemeni istiyor.',
}
