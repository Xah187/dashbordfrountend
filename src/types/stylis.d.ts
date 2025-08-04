/**
 * Type declarations for stylis and stylis-plugin-rtl
 * This file resolves the error: "Cannot find a declaration file for module 'stylis'"
 */

declare module 'stylis' {
  export type Middleware = (element: any, index: number, children: any[], callback: any) => void;

  export const enum CharCode {
    Newline = 10,
    Tab = 9,
    Backspace = 8,
    Formfeed = 12,
    CarriageReturn = 13,
    Space = 32,
    ExclamationMark = 33,
    DoubleQuote = 34,
    Hash = 35,
    DollarSign = 36,
    PercentSign = 37,
    Ampersand = 38,
    SingleQuote = 39,
    OpenParenthesis = 40,
    CloseParenthesis = 41,
    Asterisk = 42,
    PlusSign = 43,
    Comma = 44,
    Hyphen = 45,
    Period = 46,
    Slash = 47,
    Colon = 58,
    Semicolon = 59,
    LessThan = 60,
    EqualSign = 61,
    GreaterThan = 62,
    QuestionMark = 63,
    AtSign = 64,
    OpenSquareBracket = 91,
    Backslash = 92,
    CloseSquareBracket = 93,
    Caret = 94,
    Underscore = 95,
    GraveAccent = 96,
    OpenCurlyBracket = 123,
    VerticalBar = 124,
    CloseCurlyBracket = 125,
    Tilde = 126,
  }

  export const enum ContextType {
    PREPARATION = 1,
    RULESET = 2,
  }
  
  export const enum ElementType {
    RULE = 1,
    DECLARATION = 2,
    COMMENT = 3,
    KEYFRAMES = 4,
    AT_RULE = 5,
  }

  export function compile(value: string): string;
  export function middleware(...middlewares: Middleware[]): Middleware;
  export function parse(value: string, root?: any, parent?: any): any;
  export function serialize(children: any, callback: Middleware): string;
  export function stringify(element: any, callback?: any, parent?: any, siblings?: any, line?: any, column?: any, length?: any, preserve?: any): string;
  export function tokenize(value: string): any[];
  
  // Add prefixer export that was missing
  export const prefixer: Middleware;
}

declare module 'stylis-plugin-rtl' {
  import { Middleware } from 'stylis';
  const stylisRTL: Middleware;
  export default stylisRTL;
} 