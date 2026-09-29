// Kullanıcıya gösterilebilir (WashMom dilinde) mesajı olan hata.
export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}
