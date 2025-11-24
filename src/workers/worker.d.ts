/**
 * Worker Type Definitions
 * 
 * TypeScript declarations for Web Workers
 */

declare module '*?worker' {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
}

declare module '*?worker&url' {
  const url: string;
  export default url;
}
