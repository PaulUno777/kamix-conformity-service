import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api')

  //Open API Documentation
  const config = new DocumentBuilder()
  .setTitle('kamix conformity API')
  .setDescription('this api allows you to perform scans to membercheck to check that users of KAMIX services do not belong to a sanction list')
  .setVersion('1.0')
  .addTag('conformity')
  .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/doc', app, document);

  //CORS configurations
  app.enableCors();

  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}/api`);
}
bootstrap();
