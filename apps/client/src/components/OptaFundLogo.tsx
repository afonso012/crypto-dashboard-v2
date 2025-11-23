// Ficheiro: src/components/OptaFundLogo.tsx (FICHEIRO NOVO)

import React from 'react';

// Este é o ícone SVG inspirado no "Huly" que definimos anteriormente
export const OptaFundLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M14 0L16.45 5.55L22 8L16.45 10.45L14 16L11.55 10.45L6 8L11.55 5.55L14 0Z" fill="#fff" fillOpacity="0.4"/>
    <path d="M22 14L19.55 19.55L14 22L19.55 24.45L22 30L24.45 24.45L30 22L24.45 19.55L22 14Z" fill="#fff" fillOpacity="0.4"/>
    <path d="M6 14L3.55 19.55L-2 22L3.55 24.45L6 30L8.45 24.45L14 22L8.45 19.55L6 14Z" fill="#fff" fillOpacity="0.4"/>
    <path d="M14 6L15.4 8.8L18 10L15.4 11.2L14 14L12.6 11.2L10 10L12.6 8.8L14 6Z" fill="#fff"/>
  </svg>
);