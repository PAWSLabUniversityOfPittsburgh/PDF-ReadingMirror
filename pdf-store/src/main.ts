import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as session from 'express-session';
import * as FileStore from 'session-file-store';
import * as passport from 'passport';
import * as bodyParser from 'body-parser';

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  const config = app.get(ConfigService);
  const production = (process.env.NODE_ENV || 'development').toLowerCase() == 'production';
  if (!production) {
    app.enableCors({ credentials: true, origin: 'http://localhost:4200' });
  }

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  app.use(session({
    secret: config.get('SESSION_SECRET'),
    resave: true,
    saveUninitialized: true,
    name: 'pdf-reader-session',
    store: new (FileStore(session))({ path: config.get('STORAGE_PATH') + '/sessions' }),
    cookie: {
      secure: false,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  }))
  app.use(passport.initialize());
  app.use(passport.session());

  await app.listen((await config.get('PORT')) || 3000);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();

// TODO: plugin dev environment
// TODO: provide api access to other tools
// TODO: improve ddos defense, 
