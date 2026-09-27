import React, { useEffect } from 'react';
import FormReporte from '../components/FormReporte';

export default function FormTarde() {
  useEffect(() => {
    document.title = 'Turno Tarde · Sala Situacional CDCE ESTADAL GUÁRICO';
  }, []);

  return <FormReporte turno="TARDE" />;
}
