declare module 'pg' {
  export class Pool {
    constructor(config?: Record<string, unknown>)
  }
}
