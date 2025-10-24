import { registerAs } from '@nestjs/config';

interface ClientsId {
  Web_Client_ID: string;
  Android_Client_ID: string;
  iOS_Client_ID: string;
}

export default registerAs(
  'GoogleAuth',
  (): ClientsId => ({
    Android_Client_ID: process.env.GOOGLE_WEB_CLIENT_ID as string,
    iOS_Client_ID: process.env.GOOGLE_IOS_CLIENT_ID as string,
    Web_Client_ID: process.env.GOOGLE_WEB_CLIENT_ID as string,
  }),
);
