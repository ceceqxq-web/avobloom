/** Recover provider callbacks arriving at Site URL, without leaving the one-use code in the page URL. */
export function safeAuthNext(value:string|null|undefined):string{
 if(!value?.startsWith('/')||value.startsWith('//')||/[\\\r\n]/.test(value))return '/';
 return value;
}
export function authCallbackRedirect(input:URL):URL|null{
 if(input.pathname!=='/'||!input.searchParams.get('code'))return null;
 const target=new URL('/auth/callback',input.origin);target.searchParams.set('code',input.searchParams.get('code')!);
 const next=safeAuthNext(input.searchParams.get('next'));if(next!=='/')target.searchParams.set('next',next);
 return target;
}
