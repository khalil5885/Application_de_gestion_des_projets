import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function EmployeeTaskDetailRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/task/${id}`} />;
}
