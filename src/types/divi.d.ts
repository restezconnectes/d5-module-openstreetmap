// Type declarations for Divi modules (provided by Visual Builder at runtime)

declare module "@divi/module-library" {
  export function registerModule(metadata: any, definition: any): void;
  export function generateDefaultAttrs(metadata: any): any;
}

declare module "@divi/module" {
  export const ModuleContainer: any;
  export const ChildModulesContainer: any;
  export const StyleContainer: any;
  export const CssStyle: any;
  export const CommonStyle: any;
  export const TextStyle: any;
  export function textOptionsClassnames(attrs: any, options?: any): string;
  export interface StylesProps<T = any, P = any> {
    attrs?: T;
    parentAttrs?: P;
    elements?: any;
    settings?: any;
    orderClass?: string;
    mode?: string;
    state?: string;
    noStyleTag?: boolean;
    [key: string]: any;
  }
  export interface ModuleClassnamesParams<T = any> {
    attrs?: T;
    classnames?: any;
    classnamesInstance?: any;
    [key: string]: any;
  }
  export interface ModuleScriptDataProps {
    scriptDataComponents?: any;
  }
}

declare module "@divi/types" {
  export namespace Metadata {
    export type Values<T> = any;
  }
  export namespace ModuleLibrary {
    export namespace Module {
      export interface RegisterDefinition<T> {
        metadata: any;
        placeholderContent?: any;
        renderers?: any;
      }
    }
  }
}

declare module "@divi/icon-library" {
  export const iconLibrary: any;
}

