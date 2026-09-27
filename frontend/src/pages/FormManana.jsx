import React, { useEffect } from 'react';
import FormReporte from '../components/FormReporte';

export default function FormManana() {
  useEffect(() => {
    document.title = 'Turno Mañana · Sala Situacional CDCE ESTADAL GUÁRICO';
  }, []);

  return <FormReporte turno="MAÑANA" />;
}
