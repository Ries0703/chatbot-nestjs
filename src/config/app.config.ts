import { configDotenv } from 'dotenv';
import process from 'node:process';

configDotenv();

const environment = process.env.NODE_ENV;

function validateEnvVar(
  envVar: string | undefined,
  name: string,
  isNumber: boolean = false,
): string | number {
  if (!envVar) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  if (isNumber) {
    const parsed = parseInt(envVar, 10);
    if (isNaN(parsed)) {
      throw new Error(
        `Environment variable ${name} should be a number but received: ${envVar}`,
      );
    }
    return parsed;
  }

  return envVar;
}

type Config = {
  appConfig: {
    PORT: number;
  };

  dbConfig: {
    DATABASE_URL: string;
  };

  redisConfig: {
    REDIS_HOST: string;
    REDIS_PORT: number;
    REDIS_PASSWORD: string | undefined;
    REDIS_URL: string;
  };

  facebookConfig: {
    FACEBOOK_MESSAGE_URI: string;
    VERIFY_TOKEN: string;
    FACEBOOK_APP_SECRET: string;
  };

  openAIConfig: {
    OPENAI_API_KEY: string;
  };
};

const prodConfig: Config = {
  appConfig: {
    PORT: validateEnvVar(process.env.PORT, 'PORT', true) as number,
  },

  dbConfig: {
    DATABASE_URL: validateEnvVar(
      process.env.DATABASE_URL,
      'DATABASE_URL',
    ) as string,
  },

  redisConfig: {
    REDIS_HOST: validateEnvVar(process.env.REDIS_HOST, 'REDIS_HOST') as string,
    REDIS_PORT: validateEnvVar(
      process.env.REDIS_PORT,
      'REDIS_PORT',
      true,
    ) as number,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD, // Optional, no validation required
    REDIS_URL: process.env.REDIS_URL,
  },

  facebookConfig: {
    FACEBOOK_MESSAGE_URI: validateEnvVar(
      process.env.FACEBOOK_MESSAGE_URI,
      'FACEBOOK_MESSAGE_URI',
    ) as string,
    VERIFY_TOKEN: validateEnvVar(
      process.env.VERIFY_TOKEN,
      'VERIFY_TOKEN',
    ) as string,
    FACEBOOK_APP_SECRET: validateEnvVar(
      process.env.FACEBOOK_APP_SECRET,
      'FACEBOOK_APP_SECRET',
    ) as string,
  },

  openAIConfig: {
    OPENAI_API_KEY: validateEnvVar(
      process.env.OPENAI_API_KEY,
      'OPENAI_API_KEY',
    ) as string,
  },
};

const devConfig: Config = {
  appConfig: {
    PORT: validateEnvVar(process.env.PORT, 'PORT', true) as number,
  },

  dbConfig: {
    DATABASE_URL: validateEnvVar(
      process.env.DATABASE_URL,
      'DATABASE_URL',
    ) as string,
  },

  redisConfig: {
    REDIS_HOST: validateEnvVar(process.env.REDIS_HOST, 'REDIS_HOST') as string,
    REDIS_PORT: validateEnvVar(
      process.env.REDIS_PORT,
      'REDIS_PORT',
      true,
    ) as number,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD, // Optional, no validation required
    REDIS_URL: process.env.REDIS_URL,
  },

  facebookConfig: {
    FACEBOOK_MESSAGE_URI: validateEnvVar(
      process.env.FACEBOOK_MESSAGE_URI,
      'FACEBOOK_MESSAGE_URI',
    ) as string,
    VERIFY_TOKEN: validateEnvVar(
      process.env.VERIFY_TOKEN,
      'VERIFY_TOKEN',
    ) as string,
    FACEBOOK_APP_SECRET: validateEnvVar(
      process.env.FACEBOOK_APP_SECRET,
      'FACEBOOK_APP_SECRET',
    ) as string,
  },

  openAIConfig: {
    OPENAI_API_KEY: validateEnvVar(
      process.env.OPENAI_API_KEY,
      'OPENAI_API_KEY',
    ) as string,
  },
};

export const config = environment === 'production' ? prodConfig : devConfig;
