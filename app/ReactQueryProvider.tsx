'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';

const ReactQueryProvider = ({ children }: { children: React.ReactNode }) => {
  // Un client par navigateur : un client créé au niveau du module serait partagé
  // entre les requêtes de tous les utilisateurs pendant le rendu serveur.
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export default ReactQueryProvider;
