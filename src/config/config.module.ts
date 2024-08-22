import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as process from 'node:process';
import environment from './environment';
import Joi from 'joi';

const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),
  OPENAI_API_KEY: Joi.string().required(),
  DATABASE_URL: Joi.string().required(),
});

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema,
      validationOptions: {
        abortEarly: false,
      },
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? undefined
          : environment.development,
      expandVariables: true,
    }),
  ],
})
export class AppConfigModule {}
