import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot, CanActivate,
  Router, RouterStateSnapshot
} from '@angular/router';
import { AppService } from '../app.service';
import { map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PublicGuard implements CanActivate {

  constructor(
    private router: Router,
    private app: AppService,
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): any {
    return this.app.handshake().pipe(map((resp: any) => {
      if (!!resp.user) {
        this.router.navigate(['/']);
      }
      return !resp.user;
    }));
  }
}
