/// <reference types="react" />

declare namespace JSX {
  // Added a property to avoid the "interface declaring no members is equivalent to its supertype" error
  interface Element
    extends React.ReactElement<React.ComponentProps<React.ElementType>, React.ElementType> {
    _jsx_element?: true;
  }
  interface IntrinsicElements {
    [elemName: string]: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  }
}
