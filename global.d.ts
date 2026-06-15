declare module "*.css" {
  const content: { readonly [className: string]: string };
  export default content;
}

declare module "*.scss" {
  const content: { readonly [className: string]: string };
  export default content;
}

declare module "*.sass" {
  const content: { readonly [className: string]: string };
  export default content;
}
