import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  //Open API Documentation
  const config = new DocumentBuilder()
    .setTitle('kamix conformity API')
    .setDescription(
      'this api allows you to perform scans to membercheck to check that users of KAMIX services do not belong to a sanction list',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  //CORS configurations
  const options = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: '*',
    preflightContinue: true,
    optionsSuccessStatus: 200,
    credentials: true,
  };
  app.enableCors(options);

  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}/api`);
}
bootstrap();
