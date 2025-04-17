import { PropsWithChildren, useEffect, useState } from 'react';
import { InternalAxiosRequestConfig } from 'axios';

import { AxiosContext, customAxios } from './AxiosContext';
import CognitoAuthService from 'common/services/auth/cognito-auth-service';

/**
 * The `AxiosProvider` React component creates, maintains, and provides
 * access to the `AxiosContext` value.
 * @param {PropsWithChildren} props - Component properties, `PropsWithChildren`.
 * @returns {JSX.Element} JSX
 */
const AxiosProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Add request interceptor to include auth token
    const requestInterceptor = customAxios.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        try {
          // Get tokens from Cognito
          const tokens = await CognitoAuthService.getUserTokens();
          
          // If tokens exist, add Authorization header
          if (tokens?.access_token) {
            // Make sure headers exists
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${tokens.access_token}`;
          }
          
          return config;
        } catch (error) {
          console.error('Error adding auth token to request:', error);
          return config;
        }
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    setIsReady(true);

    return () => {
      // Eject axios interceptors when component unmounts
      customAxios.interceptors.request.eject(requestInterceptor);
    };
  }, []);

  return (
    <AxiosContext.Provider value={customAxios}>{isReady && <>{children}</>}</AxiosContext.Provider>
  );
};

export default AxiosProvider;
