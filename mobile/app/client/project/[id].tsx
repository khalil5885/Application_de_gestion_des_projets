import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ClientProjectDetailRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/project/${id}`} />;
}
