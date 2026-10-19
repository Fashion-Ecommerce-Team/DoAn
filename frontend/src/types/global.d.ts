// Global declaration for plain CSS imports
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}
