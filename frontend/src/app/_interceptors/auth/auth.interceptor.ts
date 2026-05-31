import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // TODO: aggiungere il token JWT all'header Authorization
  // Esempio:
  // const token = localStorage.getItem('token');
  // if (token) {
  //   req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  // }
  return next(req);
};
