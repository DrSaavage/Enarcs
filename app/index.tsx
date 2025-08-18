import { Redirect } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  useEffect(() => {
  }, []);

  return <Redirect href="/auth" />;
}
